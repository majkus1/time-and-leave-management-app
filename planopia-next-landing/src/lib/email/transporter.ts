/**
 * Email transporter configuration
 * Single Responsibility: Only handles SMTP configuration
 * DRY: Reusable across all email endpoints
 */

import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

export function getEmailTransporter(): nodemailer.Transporter {
	if (transporter) {
		return transporter
	}

	const emailUser = process.env.EMAIL_USER
	const emailPass = process.env.EMAIL_PASS

	if (!emailUser || !emailPass) {
		throw new Error('EMAIL_USER and EMAIL_PASS must be set in environment variables')
	}

	transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: emailUser,
			pass: emailPass,
		},
	})

	return transporter
}
