import { NextRequest, NextResponse } from 'next/server'
import { landingChatMailRateLimit } from '@/lib/landingChat/rateLimit'
import {
	OFFICE_TO,
	createLandingTransporter,
	escapeHtml,
	getClientIp,
	isMailEnabled,
} from '@/lib/landingMail'

const MAX_MESSAGE = 4000
/** Transkrypt rozmowy z asystentem dołączany do maila — ograniczony, żeby mail nie urósł do megabajtów. */
const MAX_TRANSCRIPT_ENTRIES = 30
const MAX_TRANSCRIPT_CHARS = 12000
const MAX_TRANSCRIPT_ENTRY_CHARS = 2500
/** Dodatkowa kopia tej samej wiadomości z czatu (oprócz biura). */
const CHAT_MAIL_COPY_TO = 'michalipka1@gmail.com'

type TranscriptEntry = { role: 'user' | 'assistant'; content: string }

/** Ostatnie wpisy rozmowy (od końca), po odcięciu bajtów zerowych; nieprawidłowe elementy pomijamy. */
function sanitizeTranscript(raw: unknown): TranscriptEntry[] {
	if (!Array.isArray(raw)) return []
	const out: TranscriptEntry[] = []
	let total = 0
	for (let i = raw.length - 1; i >= 0 && out.length < MAX_TRANSCRIPT_ENTRIES; i--) {
		const item = raw[i]
		if (!item || typeof item !== 'object') continue
		const role = (item as { role?: unknown }).role
		const content = (item as { content?: unknown }).content
		if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue
		const text = content.replace(/\u0000/g, '').trim().slice(0, MAX_TRANSCRIPT_ENTRY_CHARS)
		if (!text) continue
		if (total + text.length > MAX_TRANSCRIPT_CHARS) break
		total += text.length
		out.unshift({ role, content: text })
	}
	return out
}

function sanitizeModule(raw: unknown): string | null {
	return typeof raw === 'string' && /^[a-zA-Z]{1,40}$/.test(raw) ? raw : null
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

	let body: {
		message?: unknown
		replyEmail?: unknown
		locale?: unknown
		pageUrl?: unknown
		transcript?: unknown
		module?: unknown
	}
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
	const transcript = sanitizeTranscript(body.transcript)
	const moduleId = sanitizeModule(body.module)

	const transcriptHtml = transcript.length
		? `<hr />
<p><strong>Rozmowa z asystentem na stronie (${transcript.length} wpisów${moduleId ? `, moduł: ${escapeHtml(moduleId)}` : ''}):</strong></p>
<blockquote style="border-left:3px solid #cbd5e1;margin:0;padding:4px 12px;color:#334155;">
${transcript
	.map(
		t =>
			`<p style="margin:6px 0;"><strong>${t.role === 'user' ? 'Odwiedzający' : 'Asystent'}:</strong> <span style="white-space:pre-wrap;">${escapeHtml(t.content)}</span></p>`,
	)
	.join('')}
</blockquote>`
		: ''

	try {
		const transporter = createLandingTransporter()

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
${transcriptHtml}
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

