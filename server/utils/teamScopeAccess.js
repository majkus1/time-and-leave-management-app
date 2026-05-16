const { isSameTeam } = require('./vacationAccessPolicy')
const { isSuperAdminUser } = require('./userProfileAccessPolicy')

const ACTIVE_USER_FILTER = {
	$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
}

function normalizeRequestedTeamId(teamId) {
	if (teamId === undefined || teamId === null || teamId === '') return null
	return typeof teamId === 'string' ? teamId.trim() : String(teamId)
}

/**
 * Ustal teamId dla operacji zespołowych.
 * — zwykły user: własny zespół (requested musi się zgadzać lub być pominięty)
 * — super admin: dowolny requestedTeamId (np. edycja w Logs)
 */
function resolveScopedTeamId({ viewer, requestedTeamId }) {
	if (!viewer) {
		return { ok: false, status: 404, message: 'Użytkownik nie znaleziony' }
	}

	const requested = normalizeRequestedTeamId(requestedTeamId)
	const viewerTeamId = viewer.teamId

	if (!requested) {
		if (!viewerTeamId) {
			return { ok: false, status: 400, message: 'teamId jest wymagane' }
		}
		return { ok: true, viewer, teamId: viewerTeamId }
	}

	if (isSuperAdminUser(viewer)) {
		return { ok: true, viewer, teamId: requested }
	}

	if (!isSameTeam(viewerTeamId, requested)) {
		return { ok: false, status: 404, message: 'Zespół nie znaleziony' }
	}

	return { ok: true, viewer, teamId: requested }
}

function viewerIsTeamAdmin(viewer) {
	return Array.isArray(viewer?.roles) && viewer.roles.includes('Admin')
}

/** Mutacje struktury zespołu (działy itd.) — Admin w zespole lub super admin. */
function assertCanMutateTeamResource(viewer) {
	if (!viewer) {
		return { ok: false, status: 404, message: 'Użytkownik nie znaleziony' }
	}
	if (viewerIsTeamAdmin(viewer) || isSuperAdminUser(viewer)) {
		return { ok: true, viewer }
	}
	return {
		ok: false,
		status: 403,
		message: 'Brak uprawnień — tylko administrator może wykonać tę operację',
	}
}

module.exports = {
	ACTIVE_USER_FILTER,
	resolveScopedTeamId,
	assertCanMutateTeamResource,
	viewerIsTeamAdmin,
}
