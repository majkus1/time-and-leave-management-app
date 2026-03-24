/**
 * Authoritative aggregates for the AI assistant — same counting idea as
 * client `teamWorkCalendarSummary.js` (distinct days with hoursWorked > 0 per user).
 * Prevents the model from summing all users' hours when the user asks about themselves.
 */
'use strict'

const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const { roundWorkHoursForDisplay } = require('../utils/workHoursDisplay')

function formatDate(d) {
	if (!d) return null
	const x = new Date(d)
	return x.toISOString().slice(0, 10)
}

/**
 * @param {object} params
 * @param {import('mongoose').Document} params.requestingUser
 * @param {{ start: Date, end: Date }} params.range
 * @param {import('mongoose').Types.ObjectId[]} params.detailedUserIds
 * @param {'team'|'supervised'|'self'} params.scope
 * @param {number|null} params.yearMessageOverride
 */
async function buildVerifiedStatsForAi({
	requestingUser,
	range,
	detailedUserIds,
	scope,
	yearMessageOverride = null,
}) {
	const start = range.start
	const end = range.end
	const teamId = requestingUser.teamId
	const requesterId = requestingUser._id.toString()

	const [workdaysInRange, rosterTotal, rosterActive] = await Promise.all([
		Workday.find({
			userId: { $in: detailedUserIds },
			date: { $gte: start, $lte: end },
		})
			.select('userId date hoursWorked additionalWorked')
			.lean(),
		User.countDocuments({ teamId }),
		User.countDocuments({
			teamId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		}),
	])

	const ids = detailedUserIds.map(id => id.toString())
	const byUser = {}
	for (const uid of ids) {
		byUser[uid] = { dayKeys: new Set(), hoursRaw: 0, otRaw: 0 }
	}

	let teamHoursRaw = 0
	let teamOtRaw = 0

	for (const wd of workdaysInRange) {
		const u = String(wd.userId)
		const bucket = byUser[u]
		if (!bucket) continue

		const dk = formatDate(wd.date)
		if (wd.hoursWorked && Number(wd.hoursWorked) > 0) {
			if (dk) bucket.dayKeys.add(dk)
			const h = Number(wd.hoursWorked) || 0
			bucket.hoursRaw += h
			teamHoursRaw += h
		}
		if (wd.additionalWorked) {
			const o = Number(wd.additionalWorked) || 0
			bucket.otRaw += o
			teamOtRaw += o
		}
	}

	let sumPersonDays = 0
	const perUserOut = {}
	for (const uid of ids) {
		const b = byUser[uid]
		const days = b.dayKeys.size
		sumPersonDays += days
		perUserOut[uid] = {
			totalWorkDays: days,
			totalHoursWorked: roundWorkHoursForDisplay(b.hoursRaw) ?? 0,
			totalOvertimeHours: roundWorkHoursForDisplay(b.otRaw) ?? 0,
		}
	}

	const requesterStats = perUserOut[requesterId] || {
		totalWorkDays: 0,
		totalHoursWorked: 0,
		totalOvertimeHours: 0,
	}

	const fn = requestingUser.firstName || ''
	const ln = requestingUser.lastName || ''
	const displayName = `${fn} ${ln}`.trim() || requesterId

	return {
		periodFrom: formatDate(start),
		periodTo: formatDate(end),
		yearMessageOverrideApplied: yearMessageOverride,
		requestingUser: {
			id: requesterId,
			displayName,
		},
		/** Use these for "I / my / how much did I work" questions */
		workStatsForRequestingUser: {
			totalWorkDays: requesterStats.totalWorkDays,
			totalHoursWorked: requesterStats.totalHoursWorked,
			totalOvertimeHours: requesterStats.totalOvertimeHours,
			definitionPl:
				'Zgodnie z podsumowaniem ewidencji: liczba różnych dni kalendarzowych w okresie, w których masz wpisane godziny pracy (>0), oraz suma godzin (hoursWorked) i nadgodzin (additionalWorked).',
			definitionEn:
				'Matches app summary: distinct calendar days in range with recorded work hours (>0), sum of hoursWorked and additionalWorked (overtime).',
		},
		teamRoster: {
			userAccountsInTeam: rosterTotal,
			userAccountsActiveNotDeactivated: rosterActive,
			notePl:
				'Aktywne konto = użytkownik nie jest oznaczony jako nieaktywny (isActive !== false). „Wszyscy w zespole” = liczba kont przypisanych do zespołu.',
			noteEn:
				'Active account = user is not marked inactive (isActive !== false). Team size = users assigned to this team.',
		},
		/** Only when answering about the whole group / "team total" — not for a single person */
		teamWorkAggregateForUsersInAiScope: {
			scope,
			userIdsIncluded: ids,
			sumHoursAllUsersInScope: roundWorkHoursForDisplay(teamHoursRaw) ?? 0,
			sumOvertimeAllUsersInScope: roundWorkHoursForDisplay(teamOtRaw) ?? 0,
			sumOfEachPersonsWorkDays: sumPersonDays,
			notePl:
				'Suma godzin po wszystkich osobach w zakresie AI (Admin/HR: zwykle cały zespół). To NIE jest „Twoje” indywidualne podsumowanie — do pytania „ile ja pracowałem” użyj wyłącznie workStatsForRequestingUser.',
			noteEn:
				'Sum across all people in AI scope. NOT the same as one person — for “how much did I work” use workStatsForRequestingUser only.',
		},
	}
}

module.exports = {
	buildVerifiedStatsForAi,
}
