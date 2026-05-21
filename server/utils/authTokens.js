const jwt = require('jsonwebtoken')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)

const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL = '7d'

function buildSessionTokenPayload(user) {
	if (!user?._id || !user?.teamId) {
		return null
	}
	return {
		userId: user._id,
		teamId: user.teamId,
		roles: Array.isArray(user.roles) ? user.roles : [],
		username: user.username,
		isTeamAdmin: Boolean(user.isTeamAdmin),
	}
}

function signSessionTokens(payload) {
	return {
		accessToken: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL }),
		refreshToken: jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_TTL }),
	}
}

function getSessionCookieOptions() {
	const isProduction = process.env.NODE_ENV === 'production'
	return {
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? 'None' : 'Lax',
	}
}

function setSessionCookies(res, { accessToken, refreshToken }) {
	const base = getSessionCookieOptions()
	res.cookie('token', accessToken, { ...base, maxAge: 15 * 60 * 1000 })
	res.cookie('refreshToken', refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 })
}

function clearSessionCookies(res) {
	const base = getSessionCookieOptions()
	res.clearCookie('token', base)
	res.clearCookie('refreshToken', base)
	try {
		const { clearAppSessionCookie } = require('../services/appSessionService')
		clearAppSessionCookie(res)
	} catch {
		/* appSessionService optional at startup */
	}
}

async function loadActiveSessionUser(userId) {
	if (!userId) return null

	const user = await User.findOne({
		_id: userId,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	}).select('teamId roles username isTeamAdmin appAccessEnabled')

	if (!user?.teamId || user.appAccessEnabled === false) return null

	const team = await Team.findById(user.teamId).select('isActive')
	if (!team || team.isActive === false) return null

	return user
}

function verifyRefreshToken(refreshToken) {
	return new Promise((resolve, reject) => {
		jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
			if (err) reject(err)
			else resolve(decoded)
		})
	})
}

/**
 * Weryfikuje refresh cookie i wydaje nową parę tokenów z aktualnymi danymi z bazy.
 */
async function issueRefreshedSessionFromCookie(refreshToken) {
	const decoded = await verifyRefreshToken(refreshToken)
	const user = await loadActiveSessionUser(decoded?.userId)
	if (!user) {
		return { ok: false, reason: 'session_invalid' }
	}

	const payload = buildSessionTokenPayload(user)
	if (!payload) {
		return { ok: false, reason: 'session_invalid' }
	}

	return { ok: true, tokens: signSessionTokens(payload) }
}

module.exports = {
	buildSessionTokenPayload,
	signSessionTokens,
	setSessionCookies,
	clearSessionCookies,
	loadActiveSessionUser,
	issueRefreshedSessionFromCookie,
}
