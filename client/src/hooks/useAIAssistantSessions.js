import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
	createEmptySession,
	createEmptyStore,
	defaultDates,
	loadAiSessionsStore,
	normalizeSessionMode,
	saveAiSessionsStore,
} from '../utils/aiAssistantStorage'

const MAX_SESSIONS = 40

/**
 * Chat sessions in localStorage, isolated per authenticated userId.
 */
export function useAIAssistantSessions() {
	const { userId, isCheckingAuth } = useAuth()
	const [data, setData] = useState(createEmptyStore)
	const skipNextSaveRef = useRef(true)

	useEffect(() => {
		if (isCheckingAuth) return

		if (!userId) {
			skipNextSaveRef.current = true
			setData(createEmptyStore())
			return
		}

		skipNextSaveRef.current = true
		setData(loadAiSessionsStore(userId))
	}, [userId, isCheckingAuth])

	useEffect(() => {
		if (isCheckingAuth || !userId) return
		if (skipNextSaveRef.current) {
			skipNextSaveRef.current = false
			return
		}
		saveAiSessionsStore(userId, data)
	}, [data, userId, isCheckingAuth])

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
	const setMode = useCallback(v => patchActive({ mode: normalizeSessionMode(v) }), [patchActive])
	const setHelpModule = useCallback(v => patchActive({ helpModule: typeof v === 'string' && v ? v : null }), [patchActive])
	const setDateFrom = useCallback(v => patchActive({ dateFrom: v }), [patchActive])
	const setDateTo = useCallback(v => patchActive({ dateTo: v }), [patchActive])

	const newSession = useCallback((overrides = {}) => {
		const s = createEmptySession(overrides)
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
		mode: normalizeSessionMode(activeSession.mode),
		setMode,
		helpModule: typeof activeSession.helpModule === 'string' ? activeSession.helpModule : null,
		setHelpModule,
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
