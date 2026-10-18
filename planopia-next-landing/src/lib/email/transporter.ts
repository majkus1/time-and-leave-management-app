/**
 * Email transporter configuration
 * Single Responsibility: Only handles SMTP configuration
 * DRY: Reusable across all email endpoints
 */

import nodemailer, { type Transporter } from 'nodemailer'
import { smtpTransportOptions } from '@/lib/landingMail'

let transporter: Transporter | null = null

export function getEmailTransporter(): Transporter {
	if (transporter) {
		return transporter
	}

	const options = smtpTransportOptions()
	if (!options.auth.user || !options.auth.pass) {
		throw new Error('SMTP_USER/SMTP_PASS (or EMAIL_USER/EMAIL_PASS) must be set in environment variables')
	}

	transporter = nodemailer.createTransport(options)

	return transporter
}
