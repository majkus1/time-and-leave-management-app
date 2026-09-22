const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const User = require('../models/user')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const demoDataService = require('./demoDataService')
const entitlementsService = require('./entitlementsService')
const { founderCallForTeam } = require('./founderOutreachService')

/** Po tylu dniach od założenia zespołu lista pierwszych kroków znika sama, nawet niedokończona. */
const ONBOARDING_WINDOW_DAYS = 60

function isAdminOrHr(roles) {
	return Array.isArray(roles) && (roles.includes('Admin') || roles.includes('HR'))
}

/**
 * Stan listy „pierwsze kroki” dla Admina / HR. Kroki liczymy z danych, nie z flag —
 * dodany pracownik i wpisany dzień są faktami; jedynie zapis ustawień to znacznik,
 * bo samo istnienie dokumentu ustawień nic nie mówi (tworzy się przy rejestracji).
 */
async function getOnboardingStatus({ teamId, roles }) {
	if (!isAdminOrHr(roles)) return { visible: false }

	const team = await Team.findById(teamId).select('createdAt demoData billingPlanKey trialEndsAt adminPhone').lean()
	if (!team) return { visible: false }

	// Dane demo raportujemy także po ukryciu listy — przycisk „usuń” musi być dostępny, dopóki dane istnieją.
	const demo = demoDataService.describeDemoState(team)
	// Baner „15 min wdrożenia z twórcą” — niezależny od listy (własne zamknięcie po stronie klienta), tylko w trialu.
	const trial = entitlementsService.isTrialActive(team)
	const founderCall = {
		...(trial ? founderCallForTeam(team) : { active: false, url: null, until: null }),
		phoneLeft: Boolean(String(team.adminPhone || '').trim()),
	}

	// Lista „pierwsze kroki” (z asystentem i danymi demo) tylko w okresie próbnym — po nim zespół ma już swoje dane albo plan darmowy.
	if (!trial) return { visible: false, demo, founderCall }

	const settings = await Settings.getSettings(teamId)
	if (settings.onboardingDismissedAt) return { visible: false, demo, founderCall }

	const ageDays = (Date.now() - new Date(team.createdAt).getTime()) / 86400000
	if (ageDays > ONBOARDING_WINDOW_DAYS) return { visible: false, demo, founderCall }

	// Pracownicy demo (team.demoData.users) i ich ewidencja nie zaliczają kroków — lista dotyczy własnych danych zespołu
	const demoUserIds = (team.demoData?.users || []).map(String)
	const activeUsers = (
		await User.find({
			teamId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		})
			.select('_id')
			.lean()
	).filter(u => !demoUserIds.includes(String(u._id)))
	const employeesCount = Math.max(0, activeUsers.length - 1) // bez konta zakładającego
	const firstWorkday = activeUsers.length
		? await Workday.findOne({ userId: { $in: activeUsers.map(u => u._id) } })
				.select('_id')
				.lean()
		: null

	const steps = {
		employees: { done: employeesCount >= 1, count: employeesCount },
		settings: { done: Boolean(settings.onboardingSettingsSavedAt) },
		firstWorkday: { done: Boolean(firstWorkday) },
	}
	const doneCount = Object.values(steps).filter(s => s.done).length

	return {
		visible: true,
		steps,
		doneCount,
		total: 3,
		allDone: doneCount === 3,
		demo,
		founderCall,
	}
}

async function dismissOnboarding({ teamId, roles }) {
	if (!isAdminOrHr(roles)) {
		const err = new Error('Forbidden')
		err.code = 'FORBIDDEN'
		throw err
	}
	const settings = await Settings.getSettings(teamId)
	if (!settings.onboardingDismissedAt) {
		settings.onboardingDismissedAt = new Date()
		await settings.save()
	}
	return { ok: true }
}

module.exports = {
	getOnboardingStatus,
	dismissOnboarding,
	createDemoData: demoDataService.createDemoData,
	removeDemoData: demoDataService.removeDemoData,
	ONBOARDING_WINDOW_DAYS,
}
