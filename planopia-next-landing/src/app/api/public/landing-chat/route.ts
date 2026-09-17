import { NextRequest, NextResponse } from 'next/server'
import { buildLandingChatSystemPrompt, type LandingChatLocale } from '@/lib/landingChat/knowledge'
import { productKnowledgeModules } from '@/data/productKnowledge.generated'
import { landingChatGlobalBudget, landingChatRateLimit } from '@/lib/landingChat/rateLimit'
import { isAllowedLandingOrigin } from '@/lib/landingChat/origin'
import { trimLandingHistory, type LandingChatMessage } from '@/lib/landingChat/history'
import { extractCtaMarkers } from '@/lib/landingChat/cta'
import {
	buildChatCompletionBody,
	estimateCostUsd,
	normalizeUsage,
	resolveLandingModel,
	resolveLandingReasoningEffort,
	type OpenAiUsage,
} from '@/lib/landingChat/openai'

/** Streaming SSE nie może być cache'owany ani prerenderowany; limit czasu funkcji pod dłuższe odpowiedzi. */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Wejście przycinamy zamiast odrzucać (patrz trimLandingHistory); tu tylko twarde górne granice. */
const MAX_INCOMING_MESSAGES = 60
const MAX_CONTENT_LEN = 2500
const HISTORY_MAX_TURNS = 12
const HISTORY_MAX_CHARS = 12000
const MAX_COMPLETION_TOKENS = 900

const KNOWN_MODULE_IDS = new Set<string>(productKnowledgeModules.map(m => m.id))

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

function sanitizeModuleId(raw: unknown): string | null {
	return typeof raw === 'string' && KNOWN_MODULE_IDS.has(raw) ? raw : null
}

function validateMessages(raw: unknown): LandingChatMessage[] | null {
	if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_INCOMING_MESSAGES) return null
	const out: LandingChatMessage[] = []
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
	return out
}

type UsageLog = {
	model: string
	locale: LandingChatLocale
	module: string | null
	knowledgeModules: string[]
	legal: boolean
	trimmed: boolean
	stream: boolean
	usage: OpenAiUsage | undefined
	startedAt: number
}

/* Landing nie ma bazy — użycie tokenów idzie do logów Vercela (bez treści rozmowy). */
function logUsage(p: UsageLog) {
	console.info('[landing-chat] usage', {
		model: p.model,
		locale: p.locale,
		module: p.module,
		knowledgeModules: p.knowledgeModules,
		legal: p.legal,
		trimmed: p.trimmed,
		stream: p.stream,
		...normalizeUsage(p.usage),
		estimatedCostUsd: estimateCostUsd(p.model, p.usage),
		durationMs: Date.now() - p.startedAt,
	})
}

function sseLine(obj: unknown): string {
	return `data: ${JSON.stringify(obj)}\n\n`
}

/** Parser SSE OpenAI: linie `data: {...}` rozdzielone pustą linią; ostatni chunk (z `usage`) ma puste `choices`. */
async function* iterateOpenAiStream(res: Response) {
	const reader = res.body!.getReader()
	const decoder = new TextDecoder()
	let buffer = ''
	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		buffer += decoder.decode(value, { stream: true })
		let sep: number
		while ((sep = buffer.indexOf('\n\n')) !== -1) {
			const raw = buffer.slice(0, sep)
			buffer = buffer.slice(sep + 2)
			for (const line of raw.split('\n')) {
				const l = line.replace(/\r$/, '')
				if (!l.startsWith('data: ')) continue
				const payload = l.slice(6).trim()
				if (payload === '[DONE]') return
				try {
					yield JSON.parse(payload) as {
						model?: string
						usage?: OpenAiUsage
						choices?: { delta?: { content?: string } }[]
					}
				} catch {
					/* niepełny JSON — pomijamy */
				}
			}
		}
	}
}

export async function POST(request: NextRequest) {
	if (!isLandingChatEnabled()) {
		return NextResponse.json({ error: 'chat_disabled', message: 'Chat is not configured.' }, { status: 503 })
	}
	if (!isAllowedLandingOrigin(request.headers)) {
		return NextResponse.json({ error: 'forbidden_origin' }, { status: 403 })
	}

	const ip = getClientIp(request)
	const rl = landingChatRateLimit(ip)
	if (!rl.ok) {
		return NextResponse.json(
			{ error: 'rate_limit', retryAfterSec: rl.retryAfterSec },
			{ status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
		)
	}
	const budget = landingChatGlobalBudget()
	if (!budget.ok) {
		console.warn('[landing-chat] dobowy budżet globalny wyczerpany — czat wstrzymany do północy UTC')
		return NextResponse.json(
			{ error: 'chat_paused', message: 'Chat is temporarily unavailable.' },
			{ status: 503, headers: { 'Retry-After': String(budget.retryAfterSec) } },
		)
	}

	let body: { messages?: unknown; locale?: string; module?: unknown; stream?: unknown }
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
	}

	const locale: LandingChatLocale = body.locale === 'en' ? 'en' : 'pl'
	const validated = validateMessages(body.messages)
	if (!validated) {
		return NextResponse.json({ error: 'invalid_messages' }, { status: 400 })
	}
	const { messages, trimmed } = trimLandingHistory(validated, { maxTurns: HISTORY_MAX_TURNS, maxChars: HISTORY_MAX_CHARS })
	const wantStream = body.stream === true

	const apiKey = process.env.OPENAI_API_KEY!.trim()
	const moduleId = sanitizeModuleId(body.module)
	const lastUserText = messages[messages.length - 1].content
	const prompt = buildLandingChatSystemPrompt(locale, { moduleId, lastUserText })

	const openaiMessages = [
		{ role: 'system' as const, content: prompt.system },
		...messages.map(m => ({ role: m.role, content: m.content })),
	]

	const model = resolveLandingModel()
	const startedAt = Date.now()
	const requestBody = buildChatCompletionBody({
		model,
		messages: openaiMessages,
		temperature: 0.35,
		maxOutputTokens: MAX_COMPLETION_TOKENS,
		reasoningEffort: resolveLandingReasoningEffort(),
		verbosity: 'low',
		promptCacheKey: prompt.promptCacheKey,
		stream: wantStream,
	})

	let res: Response
	try {
		res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
			body: JSON.stringify(requestBody),
			signal: AbortSignal.timeout(55_000),
		})
	} catch (e) {
		console.error('[landing-chat] OpenAI fetch failed', e instanceof Error ? e.message : e)
		return NextResponse.json({ error: 'upstream', message: 'Assistant temporarily unavailable.' }, { status: 502 })
	}

	if (!res.ok) {
		const errText = await res.text().catch(() => '')
		console.error('[landing-chat] OpenAI error', res.status, errText.slice(0, 500))
		return NextResponse.json({ error: 'upstream', message: 'Assistant temporarily unavailable.' }, { status: 502 })
	}

	const meta = {
		modules: prompt.moduleIds,
		module: moduleId,
		trimmed,
		knowledgeVersion: prompt.promptCacheKey.split(':').pop(),
	}

	if (!wantStream || !res.body) {
		const data = (await res.json()) as {
			model?: string
			usage?: OpenAiUsage
			choices?: { message?: { content?: string } }[]
		}
		const raw = data.choices?.[0]?.message?.content?.trim()
		if (!raw) {
			return NextResponse.json({ error: 'empty_response' }, { status: 502 })
		}
		const usedModel = data.model || model
		logUsage({ model: usedModel, locale, module: moduleId, knowledgeModules: prompt.moduleIds, legal: prompt.includesLegal, trimmed, stream: false, usage: data.usage, startedAt })
		const { text, cta } = extractCtaMarkers(raw)
		return NextResponse.json({ message: text, cta, meta })
	}

	/* SSE do przeglądarki: meta → delta* → (cta) → end. Znaczniki CTA usuwane z tekstu po stronie serwera. */
	const upstream = res
	const encoder = new TextEncoder()
	let clientGone = false
	const stream = new ReadableStream<Uint8Array>({
		cancel() {
			// Odwiedzający zamknął kartę / przerwał — nie ma komu pisać, ale odczyt z OpenAI dokańczamy dla logu użycia.
			clientGone = true
		},
		async start(controller) {
			const push = (obj: unknown) => {
				if (clientGone) return
				try {
					controller.enqueue(encoder.encode(sseLine(obj)))
				} catch {
					clientGone = true
				}
			}
			push({ type: 'meta', meta })
			let full = ''
			let sent = 0
			let usedModel = model
			let usage: OpenAiUsage | undefined
			try {
				for await (const chunk of iterateOpenAiStream(upstream)) {
					if (chunk.model) usedModel = chunk.model
					if (chunk.usage) usage = chunk.usage
					const delta = chunk.choices?.[0]?.delta?.content
					if (typeof delta !== 'string' || delta.length === 0) continue
					full += delta
					// Nie wypuszczamy tekstu, który może być początkiem znacznika [[CTA:…]] — dosyłamy go, gdy wiadomo, czym jest.
					const safeUpTo = safeVisibleLength(full)
					if (safeUpTo > sent) {
						push({ type: 'delta', text: full.slice(sent, safeUpTo) })
						sent = safeUpTo
					}
				}
				const { text, cta } = extractCtaMarkers(full)
				if (text.length > sent) push({ type: 'delta', text: text.slice(sent) })
				if (cta) push({ type: 'cta', cta })
				push({ type: 'end', model: usedModel })
				logUsage({ model: usedModel, locale, module: moduleId, knowledgeModules: prompt.moduleIds, legal: prompt.includesLegal, trimmed, stream: true, usage, startedAt })
			} catch (e) {
				console.error('[landing-chat] stream error', e instanceof Error ? e.message : e)
				push({ type: 'error', message: 'Assistant temporarily unavailable.' })
			} finally {
				if (!clientGone) {
					try {
						controller.close()
					} catch {
						/* już zamknięty */
					}
				}
			}
		},
	})

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no',
		},
	})
}

/**
 * Długość prefiksu bez ryzyka: wszystko przed ostatnim „[[” — znacznik CTA może nadejść w kilku fragmentach,
 * a po zamknięciu „]]” jest ostatnią linią odpowiedzi, więc tekst za nim i tak nie istnieje.
 */
function safeVisibleLength(full: string): number {
	const open = full.lastIndexOf('[[')
	return open === -1 ? full.length : open
}
