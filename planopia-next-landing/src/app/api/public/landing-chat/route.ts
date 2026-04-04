import { NextRequest, NextResponse } from 'next/server'
import { buildLandingChatSystemPrompt, type LandingChatLocale } from '@/lib/landingChat/knowledge'
import { landingChatRateLimit } from '@/lib/landingChat/rateLimit'

const MAX_MESSAGES = 20
const MAX_CONTENT_LEN = 2500
const MAX_TOTAL_INPUT_CHARS = 12000
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
const MAX_COMPLETION_TOKENS = 900

type ChatRole = 'user' | 'assistant'

type IncomingMessage = { role: ChatRole; content: string }

function getClientIp(request: NextRequest): string {
	const xf = request.headers.get('x-forwarded-for')
	if (xf) return xf.split(',')[0]?.trim() || 'unknown'
	return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function isLandingChatEnabled(): boolean {
	if (process.env.LANDING_CHAT_ENABLED === 'false') return false
	return Boolean(process.env.OPENAI_API_KEY?.trim())
}

function sanitizeContent(s: unknown): string | null {
	if (typeof s !== 'string') return null
	const t = s.replace(/\u0000/g, '').trim()
	if (t.length === 0) return null
	if (t.length > MAX_CONTENT_LEN) return null
	return t
}

function validateMessages(raw: unknown): IncomingMessage[] | null {
	if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null
	const out: IncomingMessage[] = []
	for (const m of raw) {
		if (!m || typeof m !== 'object') return null
		const role = (m as { role?: string }).role
		const content = sanitizeContent((m as { content?: unknown }).content)
		if (!content) return null
		if (role !== 'user' && role !== 'assistant') return null
		out.push({ role, content })
	}
	/* Ostatnia wiadomość musi być od użytkownika (nowy zwrot) */
	if (out[out.length - 1]?.role !== 'user') return null
	let total = 0
	for (const m of out) total += m.content.length
	if (total > MAX_TOTAL_INPUT_CHARS) return null
	return out
}

export async function POST(request: NextRequest) {
	if (!isLandingChatEnabled()) {
		return NextResponse.json(
			{ error: 'chat_disabled', message: 'Chat is not configured.' },
			{ status: 503 }
		)
	}

	const ip = getClientIp(request)
	const rl = landingChatRateLimit(ip)
	if (!rl.ok) {
		return NextResponse.json(
			{ error: 'rate_limit', retryAfterSec: rl.retryAfterSec },
			{ status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
		)
	}

	let body: { messages?: unknown; locale?: string }
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
	}

	const locale: LandingChatLocale = body.locale === 'en' ? 'en' : 'pl'
	const messages = validateMessages(body.messages)
	if (!messages) {
		return NextResponse.json({ error: 'invalid_messages' }, { status: 400 })
	}

	const apiKey = process.env.OPENAI_API_KEY!.trim()
	const system = buildLandingChatSystemPrompt(locale)

	const openaiMessages = [
		{ role: 'system' as const, content: system },
		...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
	]

	const res = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: MODEL,
			messages: openaiMessages,
			max_tokens: MAX_COMPLETION_TOKENS,
			temperature: 0.35,
		}),
	})

	if (!res.ok) {
		const errText = await res.text().catch(() => '')
		console.error('[landing-chat] OpenAI error', res.status, errText.slice(0, 500))
		return NextResponse.json({ error: 'upstream', message: 'Assistant temporarily unavailable.' }, { status: 502 })
	}

	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[]
	}

	const text = data.choices?.[0]?.message?.content?.trim()
	if (!text) {
		return NextResponse.json({ error: 'empty_response' }, { status: 502 })
	}

	return NextResponse.json({ message: text })
}
