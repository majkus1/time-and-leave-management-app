require('dotenv').config()
const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { resetPasswordLimiter } = require('../utils/rateLimiters')
const { sendMail, escapeHtml } = require('../services/emailService')
const { founderNotifyEmail } = require('../services/founderOutreachService')

// Dane z publicznego formularza trafiają do HTML maila — zawsze jako tekst (escape), nigdy jako znaczniki
const asText = (value, max) => String(value ?? '').trim().slice(0, max)
const looksLikeEmail = value => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(value)

router.post('/request-demo', async (req, res) => {
	const email = asText(req.body?.email, 320)
	if (!email) return res.status(400).json({ message: 'Email is required' })

	try {
		await sendMail({
			to: founderNotifyEmail(),
			...(looksLikeEmail(email) ? { replyTo: email } : {}),
			subject: 'Demo account request',
			html: `<p>Email użytkownika: <strong>${escapeHtml(email)}</strong></p><p>Poproszono o konto testowe.</p>`,
		})

		res.status(200).json({ message: 'Email sent successfully' })
	} catch (error) {
		console.error('Email send error:', error)
		res.status(500).json({ message: 'Server error while sending email' })
	}
})

router.post('/schedule-call', async (req, res) => {
	const email = asText(req.body?.email, 320)
	const datetime = req.body?.datetime
	const message = asText(req.body?.message, 4000)

	if (!email || (!datetime && !message)) {
		return res.status(400).json({ message: 'Wymagany jest termin lub wiadomość oraz adres email.' })
	}

	try {
		let htmlContent = `<p>Email klienta: <strong>${escapeHtml(email)}</strong></p>`

		const when = datetime ? new Date(datetime) : null
		if (when && !Number.isNaN(when.getTime())) {
			htmlContent += `<p>Wybrany termin: <strong>${escapeHtml(when.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' }))}</strong></p>`
		}

		if (message) {
			htmlContent += `<p>Wiadomość od klienta:</p><blockquote style="white-space:pre-wrap">${escapeHtml(message)}</blockquote>`
		}

		await sendMail({
			to: founderNotifyEmail(),
			...(looksLikeEmail(email) ? { replyTo: email } : {}),
			subject: 'Nowe zgłoszenie kontaktowe',
			html: htmlContent,
		})

		res.status(200).json({ message: 'Email wysłany pomyślnie' })
	} catch (error) {
		console.error('Email send error:', error)
		res.status(500).json({ message: 'Błąd serwera przy wysyłce emaila' })
	}
})

// Publiczne endpointy do resetowania i ustawiania hasła (bez CSRF)
router.post('/reset-password-request', resetPasswordLimiter, userController.resetPasswordRequest)
router.post('/set-password/:token', userController.setPassword)
router.post('/new-password', userController.resetPassword)

module.exports = router
