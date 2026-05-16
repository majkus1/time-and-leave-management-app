/** Legacy global key (pre–per-user isolation). */
export const LEGACY_AI_SESSIONS_STORAGE_KEY = 'planopia-ai-sessions-v1'

/** Records which userId received a one-time import from legacy v1 on this browser. */
export const LEGACY_AI_SESSIONS_MIGRATION_FLAG_KEY = 'planopia-ai-v1-migrated-to'

const STORAGE_KEY_PREFIX = 'planopia-ai-sessions-v2:'

export function aiSessionsStorageKey(userId) {
	if (userId == null || userId === '') return null
	return `${STORAGE_KEY_PREFIX}${String(userId)}`
}

export function defaultDates() {
	const now = new Date()
	const from = new Date(now.getFullYear(), now.getMonth(), 1)
	const fmt = d =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
	return { dateFrom: fmt(from), dateTo: fmt(now) }
}

export function createEmptySession() {
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

export function createEmptyStore() {
	const s = createEmptySession()
	return { sessions: [s], activeId: s.id }
}

/**
 * @param {unknown} parsed
 * @returns {null | { sessions: unknown[], activeId: string }}
 */
export function parseSessionsStore(parsed) {
	if (!parsed || typeof parsed !== 'object') return null
	const { sessions, activeId } = parsed
	if (!Array.isArray(sessions) || sessions.length === 0 || typeof activeId !== 'string') {
		return null
	}
	return { sessions, activeId }
}

/**
 * Strip fields that must not persist locally (mirrors prior hook behaviour).
 * @param {{ sessions: unknown[], activeId: string }} data
 */
export function sanitizeSessionsStoreForPersistence(data) {
	return {
		...data,
		sessions: data.sessions.map(s => ({
			...s,
			messages: (s.messages || []).map(m => {
				if (m.role === 'user' && m.promptForApi != null) {
					return Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'promptForApi'))
				}
				return m
			}),
		})),
	}
}

function readRawStore(storage, key) {
	try {
		const raw = storage.getItem(key)
		if (!raw) return null
		return parseSessionsStore(JSON.parse(raw))
	} catch {
		return null
	}
}

/**
 * One-time legacy import: only the first userId on this browser gets v1;
 * later users must not inherit another account's chats.
 * @param {Storage} storage
 * @param {string} userId
 */
function tryMigrateLegacyStore(storage, userId) {
	const uid = String(userId)
	const legacy = readRawStore(storage, LEGACY_AI_SESSIONS_STORAGE_KEY)
	if (!legacy) return null

	const migratedTo = storage.getItem(LEGACY_AI_SESSIONS_MIGRATION_FLAG_KEY)
	if (migratedTo && migratedTo !== uid) {
		return null
	}

	writeRawStore(storage, aiSessionsStorageKey(uid), legacy)
	if (!migratedTo) {
		storage.setItem(LEGACY_AI_SESSIONS_MIGRATION_FLAG_KEY, uid)
	}
	return legacy
}

function writeRawStore(storage, key, data) {
	if (!key) return
	const sanitized = sanitizeSessionsStoreForPersistence(data)
	storage.setItem(key, JSON.stringify(sanitized))
}

/**
 * @param {string} userId
 * @param {Storage} [storage]
 */
export function loadAiSessionsStore(userId, storage = localStorage) {
	const key = aiSessionsStorageKey(userId)
	if (!key) return createEmptyStore()

	const scoped = readRawStore(storage, key)
	if (scoped) return scoped

	const migrated = tryMigrateLegacyStore(storage, userId)
	if (migrated) return migrated

	return createEmptyStore()
}

/**
 * @param {string} userId
 * @param {{ sessions: unknown[], activeId: string }} data
 * @param {Storage} [storage]
 */
export function saveAiSessionsStore(userId, data, storage = localStorage) {
	const key = aiSessionsStorageKey(userId)
	if (!key || !data?.sessions?.length) return
	try {
		writeRawStore(storage, key, data)
	} catch {
		/* quota */
	}
}
