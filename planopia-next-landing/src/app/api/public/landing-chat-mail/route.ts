import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { landingChatMailRateLimit } from '@/lib/landingChat/rateLimit'

const MAX_MESSAGE = 4000
const OFFICE_TO = 'office@ml-devworks.com'
/** Dodatkowa kopia tej samej wiadomości z czatu (oprócz biura). */
const CHAT_MAIL_COPY_TO = 'michalipka1@gmail.com'

function getClientIp(request: NextRequest): string {
	const xf = request.headers.get('x-forwarded-for')
	if (xf) return xf.split(',')[0]?.trim() || 'unknown'
	return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function isMailEnabled(): boolean {
	if (process.env.LANDING_CHAT_MAIL_ENABLED === 'false') return false
	return Boolean(process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim())
}

function sanitizeMessage(s: unknown): string | null {
	if (typeof s !== 'string') return null
	const t = s.replace(/\u0000/g, '').trim()
	if (t.length === 0 || t.length > MAX_MESSAGE) return null
	return t
}

function isValidOptionalEmail(s: unknown): string | null {
	if (s === undefined || s === null || s === '') return null
	if (typeof s !== 'string') return null
	const t = s.trim()
	if (t.length > 320) return null
	/* prosty RFC-ish */
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null
	return t
}

export async function POST(request: NextRequest) {
	if (!isMailEnabled()) {
		return NextResponse.json({ error: 'mail_disabled' }, { status: 503 })
	}

	const ip = getClientIp(request)
	const rl = landingChatMailRateLimit(ip)
	if (!rl.ok) {
		return NextResponse.json(
			{ error: 'rate_limit', retryAfterSec: rl.retryAfterSec },
			{ status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
		)
	}

	let body: { message?: unknown; replyEmail?: unknown; locale?: unknown; pageUrl?: unknown }
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
	}

	const message = sanitizeMessage(body.message)
	if (!message) {
		return NextResponse.json({ error: 'invalid_message' }, { status: 400 })
	}

	const replyEmail = isValidOptionalEmail(body.replyEmail)
	if (body.replyEmail && replyEmail === null) {
		return NextResponse.json({ error: 'invalid_reply_email' }, { status: 400 })
	}

	const locale = body.locale === 'en' ? 'en' : 'pl'
	const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 2000) : ''

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

		const subj =
			locale === 'pl'
				? `[Planopia] Zapytanie z czatu na stronie`
				: `[Planopia] Question from landing chat`

		const html = `
<p><strong>Źródło:</strong> widget czatu planopia-next-landing</p>
<p><strong>Język:</strong> ${locale}</p>
${pageUrl ? `<p><strong>Strona:</strong> ${escapeHtml(pageUrl)}</p>` : ''}
${replyEmail ? `<p><strong>Odpowiedź na:</strong> ${escapeHtml(replyEmail)}</p>` : '<p><strong>Odpowiedź na:</strong> (nie podano — odpowiedz tylko wewnętrznie lub przez kontakt z supportem)</p>'}
<hr />
<pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(message)}</pre>
<p style="font-size:12px;color:#666">IP: ${escapeHtml(ip)}</p>
`.trim()

		await transporter.sendMail({
			from: `"Planopia (czat)" <${process.env.EMAIL_USER}>`,
			to: [OFFICE_TO, CHAT_MAIL_COPY_TO],
			replyTo: replyEmail || undefined,
			subject: subj,
			html,
		})

		return NextResponse.json({ ok: true })
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e)
		/* Nodemailer zwykle: Invalid login, bad credentials, connection closed */
		console.error('[landing-chat-mail]', msg, e)
		return NextResponse.json({ error: 'send_failed' }, { status: 500 })
	}
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}
