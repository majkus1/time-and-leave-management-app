const crypto = require('crypto')
const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const AppSession = require('../models/AppSession')(firmDb)
const Team = require('../models/Team')(firmDb)

const TOUCH_THROTTLE_MS = 5 * 60 * 1000
const APP_SESSION_COOKIE = 'appSessionId'

function hashIp(ip) {
	if (!ip) return null
	const salt = process.env.APP_SESSION_IP_SALT || process.env.JWT_SECRET || 'planopia'
	return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 16)
}

function getClientIp(req) {
	const fwd = req.headers['x-forwarded-for']
	if (fwd) return String(fwd).split(',')[0].trim()
	return req.socket?.remoteAddress || null
}

function truncateUa(ua) {
	if (!ua || typeof ua !== 'string') return null
	return ua.slice(0, 200)
}

function getSessionCookieOptions() {
	const isProduction = process.env.NODE_ENV === 'production'
	return {
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? 'None' : 'Lax',
		maxAge: 7 * 24 * 60 * 60 * 1000,
	}
}

function setAppSessionCookie(res, sessionId) {
	if (!sessionId) return
	res.cookie(APP_SESSION_COOKIE, String(sessionId), getSessionCookieOptions())
}

function clearAppSessionCookie(res) {
	const { maxAge, ...base } = getSessionCookieOptions()
	res.clearCookie(APP_SESSION_COOKIE, base)
}

function getAppSessionIdFromReq(req) {
	const id = req.cookies?.[APP_SESSION_COOKIE]
	return id && mongoose.Types.ObjectId.isValid(id) ? String(id) : null
}

async function startSession({ userId, teamId, username, req }) {
	const now = new Date()
	const doc = await AppSession.create({
		userId,
		teamId,
		username: username || undefined,
		startedAt: now,
		lastSeenAt: now,
		ipHash: hashIp(getClientIp(req)),
		userAgent: truncateUa(req?.headers?.['user-agent']),
	})
	return doc
}

/** Po zalogowaniu / nowej sesji — cookie + dokument. */
async function beginAppSession(res, { user, req }) {
	if (!user?._id || !user?.teamId) return null
	const doc = await startSession({
		userId: user._id,
		teamId: user.teamId,
		username: user.username,
		req,
	})
	setAppSessionCookie(res, doc._id)
	return doc
}

/** Refresh / heartbeat — aktualizuj co najwyżej co TOUCH_THROTTLE_MS. */
async function touchSessionFromReq(req, { force = false } = {}) {
	const sessionId = getAppSessionIdFromReq(req)
	if (!sessionId) return null
	const now = new Date()
	const filter = { _id: sessionId, endedAt: null }
	if (!force) {
		filter.lastSeenAt = { $lt: new Date(now.getTime() - TOUCH_THROTTLE_MS) }
	}
	await AppSession.updateOne(filter, { $set: { lastSeenAt: now } })
	return sessionId
}

async function touchSessionById(sessionId) {
	if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) return
	const now = new Date()
	await AppSession.updateOne(
		{
			_id: sessionId,
			endedAt: null,
			lastSeenAt: { $lt: new Date(now.getTime() - TOUCH_THROTTLE_MS) },
		},
		{ $set: { lastSeenAt: now } }
	)
}

async function endSessionFromReq(req) {
	const sessionId = getAppSessionIdFromReq(req)
	if (sessionId) {
		await AppSession.updateOne(
			{ _id: sessionId, endedAt: null },
			{ $set: { endedAt: new Date() } }
		)
	}
}

function startOfUtcDay(d) {
	const x = new Date(d)
	x.setUTCHours(0, 0, 0, 0)
	return x
}

function sessionDurationMinutes(s) {
	const end = s.endedAt ? new Date(s.endedAt) : new Date()
	const start = new Date(s.startedAt)
	return Math.max(0, Math.round((end - start) / 60000))
}

async function enrichSessions(sessions) {
	if (!sessions.length) return []
	const teamIds = [...new Set(sessions.map(s => String(s.teamId)))]
	const teams = await Team.find({ _id: { $in: teamIds } })
		.select('name')
		.lean()
	const teamNameById = new Map(teams.map(t => [String(t._id), t.name]))

	return sessions.map(s => ({
		id: String(s._id),
		userId: String(s.userId),
		teamId: String(s.teamId),
		teamName: teamNameById.get(String(s.teamId)) || '—',
		username: s.username || '—',
		startedAt: s.startedAt?.toISOString?.() || null,
		lastSeenAt: s.lastSeenAt?.toISOString?.() || null,
		endedAt: s.endedAt?.toISOString?.() || null,
		durationMinutes: sessionDurationMinutes(s),
		ipHash: s.ipHash || null,
		userAgent: s.userAgent || null,
	}))
}

async function getActivityOverview({ onlineMinutes = 30, historyDays = 7 } = {}) {
	const onlineMin = Math.min(Math.max(Number(onlineMinutes) || 30, 5), 120)
	const histDays = Math.min(Math.max(Number(historyDays) || 7, 1), 90)

	const now = new Date()
	const onlineSince = new Date(now.getTime() - onlineMin * 60 * 1000)
	const historySince = new Date(now.getTime() - histDays * 24 * 60 * 60 * 1000)
	const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
	const todayStart = startOfUtcDay(now)

	const [onlineRaw, recentRaw, uniqueUsers24h, sessionsStartedToday, activeSessionsOpen] =
		await Promise.all([
			AppSession.find({
				endedAt: null,
				lastSeenAt: { $gte: onlineSince },
			})
				.sort({ lastSeenAt: -1 })
				.limit(150)
				.lean(),
			AppSession.find({ startedAt: { $gte: historySince } })
				.sort({ lastSeenAt: -1 })
				.limit(400)
				.lean(),
			AppSession.distinct('userId', { lastSeenAt: { $gte: dayAgo } }),
			AppSession.countDocuments({ startedAt: { $gte: todayStart } }),
			AppSession.countDocuments({ endedAt: null }),
		])

	const onlineNow = await enrichSessions(onlineRaw)
	const recentSessions = await enrichSessions(recentRaw)

	const byTeam = new Map()
	for (const row of onlineNow) {
		byTeam.set(row.teamName, (byTeam.get(row.teamName) || 0) + 1)
	}

	return {
		onlineWindowMinutes: onlineMin,
		historyDays: histDays,
		generatedAt: now.toISOString(),
		stats: {
			onlineNow: onlineNow.length,
			openSessions: activeSessionsOpen,
			uniqueUsersLast24h: uniqueUsers24h.length,
			sessionsStartedToday,
			teamsOnlineNow: byTeam.size,
		},
		teamsOnlineBreakdown: [...byTeam.entries()]
			.map(([teamName, count]) => ({ teamName, count }))
			.sort((a, b) => b.count - a.count),
		onlineNow,
		recentSessions,
	}
}

module.exports = {
	APP_SESSION_COOKIE,
	getAppSessionIdFromReq,
	setAppSessionCookie,
	clearAppSessionCookie,
	beginAppSession,
	touchSessionFromReq,
	touchSessionById,
	endSessionFromReq,
	getActivityOverview,
}
