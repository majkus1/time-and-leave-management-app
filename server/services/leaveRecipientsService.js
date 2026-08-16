// services/leaveRecipientsService.js
//
// Jedno źródło prawdy dla pytania „kto dostaje wniosek urlopowy pracownika".
// Logika jest tu przeniesiona z leaveController.js bez zmian — korzysta z niej
// zarówno ścieżka składania wniosku (wysyłka maili i pushy), jak i podgląd
// pokazywany pod formularzem. Dzięki temu podgląd nie może rozjechać się
// z tym, co faktycznie dzieje się przy zapisie.
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)
const { findSupervisorsForDepartment, canSupervisorApproveLeaves } = require('./roleService')
const { formatLeaveRecipientsForDisplay } = require('../utils/leaveRecipientsDisplay')

const ACTIVE_USER_FILTER = {
	$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
}

// Pola potrzebne zarówno do wysyłki maila (username), jak i do podglądu
// (imię, nazwisko, rola, aktywność). Rozszerzenie selecta nie zmienia tego,
// kto trafia na listę — filtruje dokumenty tylko `find`, nie `select`.
const RECIPIENT_FIELDS = 'username firstName lastName roles isActive'

// Deduplikacja po username, z wykluczeniem samego wnioskodawcy.
// Przy duplikacie preferowany jest obiekt z pełnymi danymi osobowymi.
function dedupeRecipients(allRecipients, user) {
	const uniqueRecipientsMap = new Map()

	for (const recipient of allRecipients) {
		if (recipient.username && recipient.username !== user.username) {
			if (!uniqueRecipientsMap.has(recipient.username)) {
				uniqueRecipientsMap.set(recipient.username, recipient)
			} else {
				const existing = uniqueRecipientsMap.get(recipient.username)
				if (recipient.firstName && recipient.lastName && (!existing.firstName || !existing.lastName)) {
					uniqueRecipientsMap.set(recipient.username, recipient)
				}
			}
		}
	}

	return Array.from(uniqueRecipientsMap.values())
}

/**
 * Odbiorcy dla typu wniosku wymagającego zatwierdzenia.
 * Kod przeniesiony 1:1 z dawnego getUniqueEmailRecipients w leaveController.
 * @param {Object} user - pracownik, którego dotyczy wniosek
 * @param {String|ObjectId} teamId
 * @returns {Promise<Array<User>>}
 */
async function collectLeaveApprovalRecipients(user, teamId) {
	// 1. Zbierz przełożonych z działów
	const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
	const allSupervisors = []
	for (const dept of userDepartments) {
		const deptSupervisors = await findSupervisorsForDepartment(dept, teamId)
		allSupervisors.push(...deptSupervisors)
	}

	// 2. Zbierz przełożonych z SupervisorConfig (selectedEmployees) - nawet jeśli nie są w tym samym dziale
	const supervisorConfigs = await SupervisorConfig.find({
		teamId,
		selectedEmployees: user._id,
		'permissions.canApproveLeaves': true,
		'permissions.canApproveLeavesSelectedEmployees': true
	}).select('supervisorId')

	const supervisorIdsFromConfig = supervisorConfigs.map(config => config.supervisorId)
	const supervisorsFromConfig = await User.find({
		_id: { $in: supervisorIdsFromConfig },
		teamId,
		roles: { $in: ['Przełożony (Supervisor)'] }
	})

	// Połącz przełożonych z działów i z konfiguracji
	const allPotentialSupervisors = [...allSupervisors, ...supervisorsFromConfig]
	const uniqueSupervisors = Array.from(new Map(allPotentialSupervisors.map(sup => [sup._id.toString(), sup])).values())
	const potentialSupervisors = uniqueSupervisors.filter(sup => sup.username !== user.username)

	// 3. Sprawdź uprawnienia każdego przełożonego
	const supervisors = []
	for (const supervisor of potentialSupervisors) {
		const supervisorObj = await User.findById(supervisor._id)
		if (!supervisorObj) continue
		const canApprove = await canSupervisorApproveLeaves(supervisorObj, user)
		if (canApprove) {
			supervisors.push(supervisorObj)
		}
	}

	// 4. Zbierz HR
	const hrUsers = await User.find({
		teamId,
		roles: { $in: ['HR'] },
	}).select(RECIPIENT_FIELDS)

	// 5. Zbierz Adminów (jeśli nie ma przełożonych ani HR)
	let adminUsers = []
	if (supervisors.length === 0 && hrUsers.length === 0) {
		adminUsers = await User.find({
			teamId,
			roles: { $in: ['Admin'] },
		}).select(RECIPIENT_FIELDS)
	}

	// 6. Połącz wszystkie listy i usuń duplikaty na podstawie username
	return dedupeRecipients([...supervisors, ...hrUsers, ...adminUsers], user)
}

/**
 * Odbiorcy dla typu, który nie wymaga zatwierdzenia (np. L4) — dostają
 * wyłącznie powiadomienie. Kod przeniesiony 1:1 z gałęzi w submitLeaveRequest:
 * lista jak wyżej, plus HR (tylko aktywni), plus Admini gdy nie ma żadnego HR.
 */
async function collectLeaveNotificationRecipients(user, teamId) {
	// Zbierz przełożonych (standardowa logika)
	const supervisors = await collectLeaveApprovalRecipients(user, teamId)

	// Zbierz HR (tylko aktywnych)
	const hrUsers = await User.find({
		teamId,
		roles: { $in: ['HR'] },
		...ACTIVE_USER_FILTER,
	}).select(RECIPIENT_FIELDS)

	// Jeśli nie ma HR, zbierz Adminów (tylko aktywnych)
	let adminUsers = []
	if (hrUsers.length === 0) {
		adminUsers = await User.find({
			teamId,
			roles: { $in: ['Admin'] },
			...ACTIVE_USER_FILTER,
		}).select(RECIPIENT_FIELDS)
	}

	return dedupeRecipients([...supervisors, ...hrUsers, ...adminUsers], user)
}

/**
 * Rozstrzyga, kto ma dostać wniosek, na podstawie tego, czy typ wymaga zatwierdzenia.
 * @returns {Promise<{ mode: 'approval'|'notification', recipients: Array<User> }>}
 */
async function resolveLeaveRequestRecipients({ user, teamId, typeRequiresApproval }) {
	const recipients = typeRequiresApproval
		? await collectLeaveApprovalRecipients(user, teamId)
		: await collectLeaveNotificationRecipients(user, teamId)

	return { mode: typeRequiresApproval ? 'approval' : 'notification', recipients }
}

module.exports = {
	collectLeaveApprovalRecipients,
	collectLeaveNotificationRecipients,
	resolveLeaveRequestRecipients,
	formatLeaveRecipientsForDisplay,
}
