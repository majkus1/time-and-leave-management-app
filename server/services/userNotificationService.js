const { firmDb } = require('../db/db')
const UserNotification = require('../models/UserNotification')(firmDb)
const User = require('../models/user')(firmDb)
const mongoose = require('mongoose')

const MAX_BODY = 3500
const LIST_LIMIT = 80

function truncate(str, n) {
	if (!str) return ''
	const s = String(str)
	return s.length <= n ? s : `${s.slice(0, n - 1)}…`
}

function pushTypeHint(data) {
	if (!data || typeof data !== 'object') return ''
	const t = data.type
	const hints = {
		chat: 'Czat',
		task: 'Zadanie',
		'task-comment': 'Komentarz do zadania',
		leave: 'Urlop',
		announcement: 'Komunikat',
	}
	return hints[t] || ''
}

function enrichPushBodyText(main, data) {
	const base = String(main || '').trim()
	const hint = pushTypeHint(data)
	if (!hint) return base
	if (base.includes(hint)) return base
	if (!base) return hint
	return `${base}\n· ${hint}`
}

/**
 * Zapis powiadomienia po wysłanym pushu (tylko gdy faktycznie wysłano coś na urządzenie).
 */
async function recordPushNotification(userId, teamId, payload) {
	try {
		if (!userId || !teamId) return
		let title = 'Planopia'
		let body = ''
		let link = null
		if (payload && typeof payload === 'object') {
			title = truncate(payload.title || payload.notification?.title || title, 400)
			const rawBody = payload.body || payload.message || payload.notification?.body || ''
			body = truncate(enrichPushBodyText(rawBody, payload.data), MAX_BODY)
			if (!body && title) body = truncate(title, MAX_BODY)
			link = payload.url || payload.link || payload.data?.url || null
		}
		await UserNotification.create({
			userId,
			teamId,
			channel: 'push',
			category: payload?.category || 'general',
			title,
			body,
			link: link ? String(link).slice(0, 2000) : null,
		})
		await trimOldForUser(userId)
	} catch (e) {
		console.error('[userNotification] recordPush:', e.message)
	}
}

async function trimOldForUser(userId) {
	const count = await UserNotification.countDocuments({ userId })
	if (count <= 200) return
	const excess = count - 200
	const old = await UserNotification.find({ userId })
		.sort({ createdAt: 1 })
		.limit(excess)
		.select('_id')
		.lean()
	if (old.length) {
		await UserNotification.deleteMany({ _id: { $in: old.map(o => o._id) } })
	}
}

/**
 * Powiadomienia w skrzynce po mailu do użytkowników Planopii (dopasowanie po username = adres odbiorcy).
 */
async function recordEmailNotificationsForTeam(teamId, recipientAddresses, { subject, link, preview }) {
	try {
		if (!teamId || !recipientAddresses?.length) return
		const tid = mongoose.Types.ObjectId.isValid(teamId) ? new mongoose.Types.ObjectId(teamId) : teamId
		const normalized = [...new Set(recipientAddresses.map(a => String(a).trim().toLowerCase()).filter(Boolean))]
		if (normalized.length === 0) return

		const users = await User.find({
			teamId: tid,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		})
			.select('_id username')
			.lean()

		const title = truncate(subject || 'E-mail', 400)
		const bodyPreview = truncate(
			(preview && String(preview).trim()) || '',
			MAX_BODY
		)

		for (const u of users) {
			const un = String(u.username || '').toLowerCase()
			if (!un || !normalized.includes(un)) continue
			await UserNotification.create({
				userId: u._id,
				teamId: tid,
				channel: 'email',
				category: 'email',
				title,
				body: bodyPreview,
				link: link ? String(link).slice(0, 2000) : null,
			})
			await trimOldForUser(u._id)
		}
	} catch (e) {
		console.error('[userNotification] recordEmail:', e.message)
	}
}

async function listForUser(userId, teamId, { limit = 40 } = {}) {
	const uid = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId
	const tid = mongoose.Types.ObjectId.isValid(teamId) ? new mongoose.Types.ObjectId(teamId) : teamId
	const items = await UserNotification.find({ userId: uid, teamId: tid })
		.sort({ createdAt: -1 })
		.limit(Math.min(Number(limit) || 40, LIST_LIMIT))
		.lean()
	return items
}

async function unreadCountForUser(userId, teamId) {
	const uid = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId
	const tid = mongoose.Types.ObjectId.isValid(teamId) ? new mongoose.Types.ObjectId(teamId) : teamId
	return UserNotification.countDocuments({ userId: uid, teamId: tid, readAt: null })
}

async function markRead(userId, teamId, notificationId) {
	const uid = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId
	const tid = mongoose.Types.ObjectId.isValid(teamId) ? new mongoose.Types.ObjectId(teamId) : teamId
	const nid = mongoose.Types.ObjectId.isValid(notificationId)
		? new mongoose.Types.ObjectId(notificationId)
		: notificationId
	const res = await UserNotification.updateOne(
		{ _id: nid, userId: uid, teamId: tid },
		{ $set: { readAt: new Date() } }
	)
	return res.modifiedCount > 0 || res.matchedCount > 0
}

async function markAllRead(userId, teamId) {
	const uid = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId
	const tid = mongoose.Types.ObjectId.isValid(teamId) ? new mongoose.Types.ObjectId(teamId) : teamId
	await UserNotification.updateMany(
		{ userId: uid, teamId: tid, readAt: null },
		{ $set: { readAt: new Date() } }
	)
}

/**
 * Jedno zdarzenie push dla wielu użytkowników (np. czat) — po jednym wpisie na usera, bez duplikatów przy wielu subskrypcjach.
 */
async function recordPushForUserIds(userIds, payload) {
	try {
		if (!userIds?.length || !payload) return
		const unique = [
			...new Set(
				userIds.map((id) => (id && id.toString ? id.toString() : String(id))).filter(Boolean)
			),
		]
		if (!unique.length) return
		const oids = unique
			.filter((id) => mongoose.Types.ObjectId.isValid(id))
			.map((id) => new mongoose.Types.ObjectId(id))
		if (!oids.length) return
		const users = await User.find({ _id: { $in: oids } })
			.select('_id teamId')
			.lean()
		for (const u of users) {
			if (u.teamId) await recordPushNotification(u._id, u.teamId, payload)
		}
	} catch (e) {
		console.error('[userNotification] recordPushForUserIds:', e.message)
	}
}

module.exports = {
	recordPushNotification,
	recordPushForUserIds,
	recordEmailNotificationsForTeam,
	listForUser,
	unreadCountForUser,
	markRead,
	markAllRead,
}
