import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'planopia-ai-sessions-v1'
const MAX_SESSIONS = 40

function defaultDates() {
	const now = new Date()
	const from = new Date(now.getFullYear(), now.getMonth(), 1)
	const fmt = d =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
	return { dateFrom: fmt(from), dateTo: fmt(now) }
}

function createEmptySession() {
	const { dateFrom, dateTo } = defaultDates()
	return {
		id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
		title: '',
		messages: [],
		lastMeta: null,
		periodPreset: 'month',
		dateFrom,
		dateTo,
		updatedAt: Date.now(),
	}
}

function loadStore() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) {
			const parsed = JSON.parse(raw)
			if (parsed?.sessions?.length && parsed.activeId) return parsed
		}
	} catch {
		/* ignore */
	}
	const s = createEmptySession()
	return { sessions: [s], activeId: s.id }
}

/**
 * ChatGPT-style local session storage (localStorage).
 */
export function useAIAssistantSessions() {
	const [data, setData] = useState(loadStore)

	useEffect(() => {
		try {
			const sanitized = {
				...data,
				sessions: data.sessions.map(s => ({
					...s,
					messages: (s.messages || []).map(m => {
						if (m.role === 'user' && m.promptForApi != null) {
							return Object.fromEntries(
								Object.entries(m).filter(([k]) => k !== 'promptForApi')
							)
						}
						return m
					}),
				})),
			}
			localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
		} catch {
			/* quota */
		}
	}, [data])

	const activeSession = useMemo(() => {
		const s = data.sessions.find(x => x.id === data.activeId)
		return s || data.sessions[0] || createEmptySession()
	}, [data.sessions, data.activeId])

	const patchActive = useCallback(updates => {
		setData(d => {
			const id = d.activeId
			return {
				...d,
				sessions: d.sessions.map(s =>
					s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
				),
			}
		})
	}, [])

	const setMessages = useCallback(updater => {
		setData(d => ({
			...d,
			sessions: d.sessions.map(s => {
				if (s.id !== d.activeId) return s
				const next = typeof updater === 'function' ? updater(s.messages) : updater
				return { ...s, messages: next, updatedAt: Date.now() }
			}),
		}))
	}, [])

	const setLastMeta = useCallback(meta => {
		patchActive({ lastMeta: meta })
	}, [patchActive])

	const setPeriodPreset = useCallback(v => patchActive({ periodPreset: v }), [patchActive])
	const setDateFrom = useCallback(v => patchActive({ dateFrom: v }), [patchActive])
	const setDateTo = useCallback(v => patchActive({ dateTo: v }), [patchActive])

	const newSession = useCallback(() => {
		const s = createEmptySession()
		setData(d => {
			const next = [s, ...d.sessions].slice(0, MAX_SESSIONS)
			return { activeId: s.id, sessions: next }
		})
	}, [])

	const selectSession = useCallback(id => {
		setData(d => ({ ...d, activeId: id }))
	}, [])

	const deleteSession = useCallback(id => {
		setData(d => {
			let sessions = d.sessions.filter(s => s.id !== id)
			if (sessions.length === 0) {
				const s = createEmptySession()
				sessions = [s]
				return { activeId: s.id, sessions }
			}
			let activeId = d.activeId
			if (activeId === id) activeId = sessions[0].id
			return { activeId, sessions }
		})
	}, [])

	const setSessionTitle = useCallback((id, title) => {
		setData(d => ({
			...d,
			sessions: d.sessions.map(s => (s.id === id ? { ...s, title, updatedAt: Date.now() } : s)),
		}))
	}, [])

	const sessionsSorted = useMemo(
		() => [...data.sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
		[data.sessions]
	)

	return {
		activeId: data.activeId,
		activeSession,
		messages: activeSession.messages,
		setMessages,
		lastMeta: activeSession.lastMeta,
		setLastMeta,
		periodPreset: activeSession.periodPreset || 'month',
		setPeriodPreset,
		dateFrom: activeSession.dateFrom || defaultDates().dateFrom,
		dateTo: activeSession.dateTo || defaultDates().dateTo,
		setDateFrom,
		setDateTo,
		sessionsSorted,
		newSession,
		selectSession,
		deleteSession,
		setSessionTitle,
		patchActive,
	}
}
