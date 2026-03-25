// controllers/ticketController.js
const { centralTicketConnection, firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const Ticket = centralTicketConnection ? require('../models/Ticket')(centralTicketConnection) : null
const { notifyTicketReporter, notifyHelpCenterStaff } = require('../services/emailService')

function ticketsDisabled(res) {
	res.status(503).json({ error: 'Baza zgłoszeń jest niedostępna' })
}

function getCompanyFromHost(req) {
	const host = req.headers.host
	const subdomain = host.split('.')[0]
	return subdomain === 'planopia' ? null : subdomain
}

/** Centrum pomocy Planopia: ten zespół + wskazany e-mail widzą wszystkie zgłoszenia z całej bazy. */
const PLATFORM_SUPPORT_TEAM_NAME = 'OficjalnyAdminowy'
const PLATFORM_SUPPORT_EMAIL = 'michalipka1@gmail.com'

function normalizedEmail(email) {
	return (email || '').trim().toLowerCase()
}

function emailsEqual(a, b) {
	return normalizedEmail(a) === normalizedEmail(b)
}

/** Lista zgłoszeń członka zespołu: company jak w Team, userEmail bez rozróżniania wielkości liter (JWT vs Mongo). */
function ticketsForTeamMemberFilter(teamName, userEmail) {
	const lower = normalizedEmail(userEmail)
	return {
		company: teamName,
		$expr: {
			$eq: [{ $toLower: { $trim: { input: { $ifNull: ['$userEmail', ''] } } } }, lower],
		},
	}
}

function isPlatformSupportUser(team, userEmail) {
	if (!team || (team.name || '').trim() !== PLATFORM_SUPPORT_TEAM_NAME) return false
	if (!userEmail || typeof userEmail !== 'string') return false
	return normalizedEmail(userEmail) === normalizedEmail(PLATFORM_SUPPORT_EMAIL)
}

/** Dostęp do pojedynczego zgłoszenia (poza kontem wsparcia): tylko autor i ten sam „company” co zespół / host. */
function assertNonSupportTicketAccess({ ticket, userEmail, teamId, team, req }) {
	if (!emailsEqual(ticket.userEmail, userEmail)) {
		return { ok: false, status: 403, body: { error: 'Brak uprawnień' } }
	}
	if (teamId && team) {
		if ((ticket.company || '').trim() !== (team.name || '').trim()) {
			return { ok: false, status: 403, body: { error: 'Brak dostępu do tego zgłoszenia' } }
		}
	} else {
		const company = req.body.frontendUrl || getCompanyFromHost(req)
		if (ticket.company !== company) {
			return { ok: false, status: 403, body: { error: 'Brak dostępu do tego zgłoszenia' } }
		}
	}
	return { ok: true }
}

exports.createTicket = async (req, res) => {
	if (!Ticket) return ticketsDisabled(res)
	const { topic, message } = req.body
	const attachments = req.files ? req.files.map(f => f.filename) : []
	const userEmail = req.user.username
	const teamId = req.user.teamId
	
	try {
		let company
		
		if (teamId) {
			const team = await Team.findById(teamId)
			if (!team) {
				return res.status(404).json({ error: 'Zespół nie został znaleziony' })
			}
			company = team.name
		} else {
			company = req.body.frontendUrl || getCompanyFromHost(req)
		}

		const ticket = await Ticket.create({
			company,
			userEmail,
			topic,
			status: 'Otwarte',
			messages: [{ sender: 'user', author: userEmail, content: message, files: attachments }],
		})

		void notifyHelpCenterStaff({
			kind: 'new_ticket',
			ticket,
			messagePreview: message,
			authorEmail: userEmail,
		})

		res.status(201).json({ message: 'Ticket created', ticket })
	} catch (err) {
		res.status(500).json({ error: 'Nie udało się utworzyć zgłoszenia' })
	}
}

exports.getMyTickets = async (req, res) => {
	if (!Ticket) return ticketsDisabled(res)
	const userEmail = req.user.username
	const teamId = req.user.teamId

	if (teamId) {
		const team = await Team.findById(teamId)
		if (team) {
			if (isPlatformSupportUser(team, userEmail)) {
				const tickets = await Ticket.find().sort({ createdAt: -1 })
				return res.json(tickets)
			}
			const tickets = await Ticket.find(ticketsForTeamMemberFilter(team.name, userEmail)).sort({
				createdAt: -1,
			})
			return res.json(tickets)
		}
	}

	const company = req.body.frontendUrl || getCompanyFromHost(req)
	const tickets = await Ticket.find({
		company,
		$expr: {
			$eq: [{ $toLower: { $trim: { input: { $ifNull: ['$userEmail', ''] } } } }, normalizedEmail(userEmail)],
		},
	}).sort({ createdAt: -1 })
	res.json(tickets)
}

exports.getAllTickets = async (req, res) => {
	if (!Ticket) return ticketsDisabled(res)
	if (!req.user.roles.includes('Admin')) return res.status(403).send('Brak uprawnień')

	const userEmail = req.user.username
	const teamId = req.user.teamId

	if (teamId) {
		const team = await Team.findById(teamId)
		if (team) {
			if (isPlatformSupportUser(team, userEmail)) {
				const tickets = await Ticket.find().sort({ createdAt: -1 })
				return res.json(tickets)
			}
			const tickets = await Ticket.find({ company: team.name }).sort({ createdAt: -1 })
			return res.json(tickets)
		}
	}

	const company = req.body.frontendUrl || getCompanyFromHost(req)
	const tickets = await Ticket.find({ company }).sort({ createdAt: -1 })
	res.json(tickets)
}

exports.replyToTicket = async (req, res) => {
	if (!Ticket) return ticketsDisabled(res)
	const { id } = req.params
	const { message } = req.body
	const attachments = req.files ? req.files.map(f => f.filename) : []
	const userEmail = req.user.username
	const teamId = req.user.teamId

	const ticket = await Ticket.findById(id)
	if (!ticket) return res.status(404).json({ error: 'Ticket nie znaleziony' })

	const team = teamId ? await Team.findById(teamId) : null
	if (!isPlatformSupportUser(team, userEmail)) {
		const check = assertNonSupportTicketAccess({ ticket, userEmail, teamId, team, req })
		if (!check.ok) return res.status(check.status).json(check.body)
	}

	const isStaffSender =
		req.user.roles.includes('Admin') || isPlatformSupportUser(team, userEmail)
	const sender = isStaffSender ? 'admin' : 'user'

	ticket.messages.push({
		sender,
		author: userEmail,
		content: message,
		files: attachments,
	})
	await ticket.save()

	void notifyHelpCenterStaff({
		kind: 'reply',
		ticket,
		messagePreview: message,
		authorEmail: userEmail,
		isStaffMessage: isStaffSender,
	})

	if (isStaffSender && !emailsEqual(ticket.userEmail, userEmail)) {
		void notifyTicketReporter({
			recipientEmail: ticket.userEmail,
			kind: 'reply',
			topic: ticket.topic,
			extra: { messagePreview: message },
		})
	}

	res.json({ message: 'Odpowiedź dodana', ticket })
}

exports.updateTicketStatus = async (req, res) => {
	if (!Ticket) return ticketsDisabled(res)
	const { id } = req.params
	const { status } = req.body
	const userEmail = req.user.username
	const teamId = req.user.teamId
	const team = teamId ? await Team.findById(teamId) : null
	const isSupport = isPlatformSupportUser(team, userEmail)

	if (!isSupport && !req.user.roles.includes('Admin')) {
		return res.status(403).send('Brak uprawnień')
	}

	const ticket = await Ticket.findById(id)
	if (!ticket) return res.status(404).json({ error: 'Ticket nie znaleziony' })

	if (!isSupport) {
		const check = assertNonSupportTicketAccess({ ticket, userEmail, teamId, team, req })
		if (!check.ok) return res.status(check.status).json(check.body)
	}

	const prevStatus = ticket.status
	ticket.status = status
	await ticket.save()

	if (prevStatus !== status && !emailsEqual(ticket.userEmail, userEmail)) {
		void notifyTicketReporter({
			recipientEmail: ticket.userEmail,
			kind: 'status',
			topic: ticket.topic,
			extra: { newStatus: status },
		})
	}

	res.json({ message: 'Status updated', ticket })
}

exports.getTicketById = async (req, res) => {
	if (!Ticket) return ticketsDisabled(res)
	const { id } = req.params
	const userEmail = req.user.username
	const teamId = req.user.teamId

	const ticket = await Ticket.findById(id)
	if (!ticket) return res.status(404).json({ error: 'Ticket nie znaleziony' })

	const team = teamId ? await Team.findById(teamId) : null
	if (!isPlatformSupportUser(team, userEmail)) {
		const check = assertNonSupportTicketAccess({ ticket, userEmail, teamId, team, req })
		if (!check.ok) return res.status(check.status).json(check.body)
	}

	res.json(ticket)
}
