const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const { createLog } = require('./logService')
const { SUPER_ADMIN_USERNAME } = require('../utils/logAccessPolicy')

const TEAM_SOFT_DELETED = 'TEAM_SOFT_DELETED'
const TEAM_PERMANENTLY_DELETED = 'TEAM_PERMANENTLY_DELETED'
const TEAM_PERMANENTLY_DELETED_RETENTION = 'TEAM_PERMANENTLY_DELETED_RETENTION'

/** Akcje zachowane przy trwałym usuwaniu logów użytkowników zespołu (gdyby były na ich kontach). */
const TEAM_DELETION_AUDIT_ACTIONS = [
	TEAM_SOFT_DELETED,
	TEAM_PERMANENTLY_DELETED,
	TEAM_PERMANENTLY_DELETED_RETENTION,
]

function buildTeamDeletionDetails(team, executor) {
	const name = (team?.name || '').trim() || '—'
	const tid = team?._id ? String(team._id) : '—'
	const by = (executor?.username || '').trim() || (executor?._id ? String(executor._id) : '—')
	const adminPart =
		team?.adminEmail && String(team.adminEmail).trim()
			? `, adminEmail: ${String(team.adminEmail).trim()}`
			: ''
	return `Zespół "${name}" (${tid})${adminPart} — wykonał: ${by}`
}

async function resolvePlatformAuditLogUserId(fallbackUserId) {
	const platform = await User.findOne({ username: SUPER_ADMIN_USERNAME }).select('_id').lean()
	if (platform?._id) return platform._id
	return fallbackUserId || null
}

/** Soft delete — log na koncie admina (użytkownik oznaczony nieaktywny, wpis zostaje w bazie). */
async function logTeamSoftDeleted(team, executor) {
	if (!executor?._id) return
	await createLog(
		executor._id,
		TEAM_SOFT_DELETED,
		buildTeamDeletionDetails(team, executor),
		executor._id
	)
}

/** Trwałe usunięcie — log na koncie super-admina platformy, żeby przetrwał skasowanie użytkowników zespołu. */
async function logTeamPermanentlyDeleted(team, executor) {
	if (!executor?._id) return
	const auditUserId = await resolvePlatformAuditLogUserId(executor._id)
	if (!auditUserId) return
	await createLog(
		auditUserId,
		TEAM_PERMANENTLY_DELETED,
		buildTeamDeletionDetails(team, executor),
		executor._id
	)
}

/** Cron po 30 dniach karencji — wpis na koncie super-admina platformy. */
async function logTeamPermanentlyDeletedByRetention(team) {
	const auditUserId = await resolvePlatformAuditLogUserId()
	if (!auditUserId) return
	await createLog(
		auditUserId,
		TEAM_PERMANENTLY_DELETED_RETENTION,
		`${buildTeamDeletionDetails(team, { username: 'system (retencja 30 dni)' })}`,
		auditUserId
	)
}

module.exports = {
	TEAM_SOFT_DELETED,
	TEAM_PERMANENTLY_DELETED,
	TEAM_PERMANENTLY_DELETED_RETENTION,
	TEAM_DELETION_AUDIT_ACTIONS,
	logTeamSoftDeleted,
	logTeamPermanentlyDeleted,
	logTeamPermanentlyDeletedByRetention,
}
