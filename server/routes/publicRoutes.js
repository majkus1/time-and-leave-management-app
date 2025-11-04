require('dotenv').config()
const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')
const userController = require('../controllers/userController')
const { resetPasswordLimiter } = require('../utils/rateLimiters')

router.post('/request-demo', async (req, res) => {
	const { email } = req.body
	if (!email) return res.status(400).json({ message: 'Email is required' })

	try {
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		})

		await transporter.sendMail({
			from: `"Planopia" <${process.env.EMAIL_USER}>`,
			to: 'michalipka1@gmail.com',
			subject: 'Demo account request',
			html: `<p>Email użytkownika: <strong>${email}</strong></p><p>Poproszono o konto testowe.</p>`,
		})

		res.status(200).json({ message: 'Email sent successfully' })
	} catch (error) {
		console.error('Email send error:', error)
		res.status(500).json({ message: 'Server error while sending email' })
	}
})

router.post('/schedule-call', async (req, res) => {
	const { email, datetime, message } = req.body

	if (!email || (!datetime && (!message || message.trim() === ''))) {
		return res.status(400).json({ message: 'Wymagany jest termin lub wiadomość oraz adres email.' })
	}

	try {
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		})

		let htmlContent = `<p>Email klienta: <strong>${email}</strong></p>`

		if (datetime) {
			htmlContent += `<p>Wybrany termin: <strong>${new Date(datetime).toLocaleString('pl-PL')}</strong></p>`
		}

		if (message && message.trim() !== '') {
			htmlContent += `<p>Wiadomość od klienta:</p><blockquote>${message.trim()}</blockquote>`
		}

		await transporter.sendMail({
			from: `"Planopia" <${process.env.EMAIL_USER}>`,
			to: 'michalipka1@gmail.com',
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
