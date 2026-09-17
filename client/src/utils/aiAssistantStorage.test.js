import { describe, it, expect, beforeEach } from 'vitest'
import {
	LEGACY_AI_SESSIONS_STORAGE_KEY,
	LEGACY_AI_SESSIONS_MIGRATION_FLAG_KEY,
	loadAiSessionsStore,
	saveAiSessionsStore,
	createEmptyStore,
	parseSessionsStore,
} from './aiAssistantStorage.js'

function makeStore(data) {
	return { sessions: [{ id: 's1', messages: data.messages || [], title: 't' }], activeId: 's1' }
}

describe('aiAssistantStorage', () => {
	/** @type {Storage} */
	let storage

	beforeEach(() => {
		storage = {
			_map: new Map(),
			getItem(k) {
				return this._map.has(k) ? this._map.get(k) : null
			},
			setItem(k, v) {
				this._map.set(k, v)
			},
			removeItem(k) {
				this._map.delete(k)
			},
		}
	})

	it('loads empty store for unknown user', () => {
		const s = loadAiSessionsStore('user-a', storage)
		expect(s.sessions).toHaveLength(1)
		expect(s.activeId).toBeTruthy()
	})

	it('migrates legacy v1 only for first user on browser', () => {
		const legacy = makeStore({ messages: [{ role: 'user', content: 'hello' }] })
		storage.setItem(LEGACY_AI_SESSIONS_STORAGE_KEY, JSON.stringify(legacy))

		const a = loadAiSessionsStore('user-a', storage)
		expect(a.sessions[0].messages[0].content).toBe('hello')
		expect(storage.getItem(LEGACY_AI_SESSIONS_MIGRATION_FLAG_KEY)).toBe('user-a')

		const b = loadAiSessionsStore('user-b', storage)
		expect(b.sessions[0].messages).toEqual([])
	})

	it('does not give user-b legacy data after user-a migrated', () => {
		const legacy = makeStore({ messages: [{ role: 'user', content: 'secret' }] })
		storage.setItem(LEGACY_AI_SESSIONS_STORAGE_KEY, JSON.stringify(legacy))
		loadAiSessionsStore('user-a', storage)

		const b = loadAiSessionsStore('user-b', storage)
		expect(parseSessionsStore(b)?.sessions[0].messages).toEqual([])
	})

	it('persists per-user scoped key', () => {
		const custom = createEmptyStore()
		custom.sessions[0].title = 'My chat'
		saveAiSessionsStore('user-x', custom, storage)

		const loaded = loadAiSessionsStore('user-x', storage)
		expect(loaded.sessions[0].title).toBe('My chat')

		const other = loadAiSessionsStore('user-y', storage)
		expect(other.sessions[0].title).not.toBe('My chat')
	})

	it('strips promptForApi on save', () => {
		const store = makeStore({
			messages: [{ role: 'user', content: 'short', promptForApi: 'long prompt' }],
		})
		saveAiSessionsStore('u1', store, storage)
		const raw = JSON.parse(storage.getItem('planopia-ai-sessions-v2:u1'))
		expect(raw.sessions[0].messages[0].promptForApi).toBeUndefined()
		expect(raw.sessions[0].messages[0].content).toBe('short')
	})
})

describe('aiAssistantStorage — tryb sesji (pomoc „Jak działa Planopia”)', () => {
	it('nowa sesja startuje w trybie chat bez modułu; nadpisania działają', () => {
		const { createEmptySession } = require('./aiAssistantStorage.js')
		expect(createEmptySession().mode).toBe('chat')
		expect(createEmptySession().helpModule).toBeNull()
		const help = createEmptySession({ mode: 'help', helpModule: 'qr' })
		expect(help.mode).toBe('help')
		expect(help.helpModule).toBe('qr')
	})

	it('stare sesje bez pola mode są czytane jako chat, nieznany tryb wraca do chat', () => {
		const parsed = parseSessionsStore({
			sessions: [
				{ id: 'a', messages: [] },
				{ id: 'b', messages: [], mode: 'help', helpModule: 'leave' },
				{ id: 'c', messages: [], mode: 'weird', helpModule: 42 },
			],
			activeId: 'a',
		})
		expect(parsed.sessions.map(s => s.mode)).toEqual(['chat', 'help', 'chat'])
		expect(parsed.sessions.map(s => s.helpModule)).toEqual([null, 'leave', null])
	})
})
