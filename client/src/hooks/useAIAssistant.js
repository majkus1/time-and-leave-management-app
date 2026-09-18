import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'
import { buildReportFilename } from '../utils/export/reportFilename'

export function useAIAssistantStatus({ enabled = true } = {}) {
	return useQuery({
		queryKey: ['ai-assistant-status'],
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/ai-assistant/status`, {
				withCredentials: true,
			})
			return data
		},
		staleTime: 30 * 1000,
		enabled,
	})
}

/** Moduły trybu „Jak działa Planopia” (chipy + podpowiedzi); treść wiedzy zostaje na serwerze. */
export function useAIHelpModules(locale, { enabled = true } = {}) {
	const loc = locale === 'en' ? 'en' : 'pl'
	return useQuery({
		queryKey: ['ai-help-modules', loc],
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/ai-help/modules`, {
				params: { locale: loc },
				withCredentials: true,
			})
			return data
		},
		staleTime: 60 * 60 * 1000,
		enabled,
	})
}

async function fetchCsrfToken(signal) {
	const csrfRes = await fetch(`${API_URL}/api/csrf-token`, {
		credentials: 'include',
		signal,
	})
	if (!csrfRes.ok) {
		throw new Error('CSRF token request failed')
	}
	const { csrfToken } = await csrfRes.json()
	return csrfToken
}

async function throwStreamHttpError(res) {
	let message = res.statusText || 'Request failed'
	let code
	const ct = res.headers.get('content-type')
	try {
		if (ct && ct.includes('application/json')) {
			const j = await res.json()
			message = j.error || message
			code = j.code
		} else {
			const t = await res.text()
			if (t) message = t
		}
	} catch {
		/* keep message */
	}
	const e = new Error(message)
	if (code) e.code = code
	throw e
}

function dispatchSseEvent(data, { onMeta, onDelta, onEnd, onExportOffer, onLinks }) {
	if (data.type === 'meta' && data.meta != null) {
		onMeta?.(data.meta)
	} else if (data.type === 'delta' && typeof data.text === 'string') {
		onDelta?.(data.text)
	} else if (data.type === 'end') {
		onEnd?.(data.model)
	} else if (data.type === 'exportOffer' && data.offer) {
		onExportOffer?.(data.offer)
	} else if (data.type === 'links' && Array.isArray(data.links)) {
		onLinks?.(data.links)
	} else if (data.type === 'error') {
		const e = new Error(data.message || 'Stream error')
		if (data.code) e.code = data.code
		throw e
	}
}

/**
 * Wspólny parser SSE (`data: {...}` rozdzielane pustą linią) dla czatu z danymi i trybu pomocy.
 * @param {Response} res
 * @param {{ onMeta?, onDelta?, onEnd?, onExportOffer?, onLinks? }} handlers
 */
export async function readSseStream(res, handlers = {}) {
	if (!res.body) {
		throw new Error('Empty response body')
	}
	const reader = res.body.getReader()
	const decoder = new TextDecoder()
	let buffer = ''

	const handleRaw = raw => {
		const line = raw
			.split('\n')
			.map(l => l.replace(/\r$/, ''))
			.find(l => l.startsWith('data: '))
		if (!line) return
		let data
		try {
			data = JSON.parse(line.slice(6).trim())
		} catch {
			return
		}
		dispatchSseEvent(data, handlers)
	}

	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		buffer += decoder.decode(value, { stream: true })

		let sep
		while ((sep = buffer.indexOf('\n\n')) !== -1) {
			const raw = buffer.slice(0, sep)
			buffer = buffer.slice(sep + 2)
			handleRaw(raw)
		}
	}

	if (buffer.trim()) handleRaw(buffer)
}

/**
 * Tryb „Jak działa Planopia” — SSE bez limitu wiadomości AI.
 * @param {{ messages: Array, locale?: string, module?: string|null }} body
 * @param {{ signal?: AbortSignal, onMeta?, onDelta?, onEnd?, onLinks? }} handlers — onLinks: przyciski „otwórz w aplikacji” do odpowiedzi
 */
export async function streamAIHelpChat(body, handlers = {}) {
	const { signal } = handlers
	const csrfToken = await fetchCsrfToken(signal)
	const res = await fetch(`${API_URL}/api/ai-help/chat/stream`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRF-Token': csrfToken,
		},
		body: JSON.stringify({
			messages: body.messages,
			locale: body.locale || 'pl',
			module: body.module || null,
		}),
		signal,
	})
	if (!res.ok) await throwStreamHttpError(res)
	await readSseStream(res, handlers)
}

/**
 * @param {object} opts
 * @param {string} opts.locale - 'pl' | 'en'
 */
export function useAIAssistantChatMutation() {
	return useMutation({
		mutationFn: async ({ messages, periodPreset, dateFrom, dateTo, locale }) => {
			const { data } = await axios.post(
				`${API_URL}/api/ai-assistant/chat`,
				{
					messages,
					periodPreset: periodPreset || 'month',
					dateFrom: dateFrom || undefined,
					dateTo: dateTo || undefined,
					locale: locale || 'pl',
				},
				{ withCredentials: true, timeout: 120000 }
			)
			return data
		},
	})
}

/**
 * Stream assistant reply (SSE). Calls onMeta once, onDelta for each token chunk, onEnd when finished.
 * @param {object} body - messages, periodPreset, dateFrom, dateTo, locale
 * @param {object} handlers
 * @param {AbortSignal} [handlers.signal]
 * @param {(offer: object) => void} [handlers.onExportOffer] — server detected export request; file is built from DB on download.
 */
export async function streamAIAssistantChat(body, handlers = {}) {
	const { signal } = handlers
	const csrfToken = await fetchCsrfToken(signal)

	const res = await fetch(`${API_URL}/api/ai-assistant/chat/stream`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRF-Token': csrfToken,
		},
		body: JSON.stringify({
			messages: body.messages,
			periodPreset: body.periodPreset || 'month',
			dateFrom: body.dateFrom || undefined,
			dateTo: body.dateTo || undefined,
			locale: body.locale || 'pl',
		}),
		signal,
	})

	if (!res.ok) await throwStreamHttpError(res)
	await readSseStream(res, handlers)
}

/**
 * Download Excel/PDF using validated offer + current period (same as chat context).
 * @param {'excel' | 'pdf'} format
 * @param {object} payload - offer from assistant + periodPreset, dateFrom, dateTo, locale
 */
export async function downloadAiIntentExport(format, payload) {
	const sub = format === 'pdf' ? 'pdf' : 'xlsx'
	try {
		const res = await axios.post(
			`${API_URL}/api/ai-assistant/export/from-intent`,
			{
				format: sub,
				periodPreset: payload.periodPreset || 'month',
				dateFrom: payload.dateFrom,
				dateTo: payload.dateTo,
				locale: payload.locale || 'pl',
				reportType: payload.reportType,
				leaveStatuses: payload.leaveStatuses,
				scopeTarget: payload.scopeTarget,
				departmentHint: payload.departmentHint,
			},
			{ responseType: 'blob', withCredentials: true, timeout: 120000 }
		)
		const cd = res.headers['content-disposition'] || res.headers['Content-Disposition']
		let filename = buildReportFilename({
			locale: payload.locale || 'pl',
			pl: 'raport-planopia',
			en: 'planopia-report',
			parts: [payload.reportType, payload.dateFrom, payload.dateTo].filter(Boolean),
			extension: sub,
		})
		if (cd) {
			const star = /filename\*=UTF-8''([^;]+)/i.exec(cd)
			const quoted = /filename="([^"]+)"/i.exec(cd)
			if (star) {
				try {
					filename = decodeURIComponent(star[1])
				} catch {
					filename = star[1]
				}
			} else if (quoted) filename = quoted[1]
		}
		const url = URL.createObjectURL(res.data)
		const a = document.createElement('a')
		a.href = url
		a.download = filename
		document.body.appendChild(a)
		a.click()
		a.remove()
		URL.revokeObjectURL(url)
	} catch (e) {
		const blob = e.response?.data
		if (blob instanceof Blob) {
			const text = await blob.text()
			try {
				const j = JSON.parse(text)
				throw new Error(j.error || 'Export failed')
			} catch (err) {
				if (err instanceof SyntaxError) {
					throw new Error(text.slice(0, 300) || 'Export failed')
				}
				throw err
			}
		}
		throw new Error(e.response?.data?.error || e.message || 'Export failed')
	}
}

export function buildExportText(messages, meta) {
	const lines = []
	if (meta?.periodFrom && meta?.periodTo) {
		lines.push(`Period: ${meta.periodFrom} — ${meta.periodTo} (scope: ${meta.scope || 'n/a'})`)
		lines.push('')
	}
	for (const m of messages) {
		lines.push(m.role === 'user' ? 'User:' : 'Assistant:')
		lines.push(m.content)
		lines.push('')
	}
	return lines.join('\n')
}

/** User bubble may show short `content` while `promptForApi` is sent to the assistant API. */
export function messagesForApi(messages) {
	return messages.map(m =>
		m.role === 'user' && m.promptForApi != null
			? { role: m.role, content: m.promptForApi }
			: { role: m.role, content: m.content }
	)
}

/**
 * Draft leave request from natural language (server validates; user confirms before real POST).
 * @param {{ messages: Array<{role:string,content:string}>, locale?: string }} body
 */
export async function postAiLeaveDraft(body) {
	const { data } = await axios.post(`${API_URL}/api/ai-assistant/leave-draft`, body, {
		withCredentials: true,
		timeout: 120000,
	})
	return data
}

/**
 * Draft work time log entry from natural language (server validates; user confirms before POST /api/workdays).
 * @param {{ messages: Array<{role:string,content:string}>, locale?: string }} body
 */
export async function postAiWorkdayDraft(body) {
	const { data } = await axios.post(`${API_URL}/api/ai-assistant/workday-draft`, body, {
		withCredentials: true,
		timeout: 120000,
	})
	return data
}
