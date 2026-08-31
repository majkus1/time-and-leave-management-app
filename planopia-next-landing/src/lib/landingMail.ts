/**
 * Wspólne funkcje dla publicznych endpointów mailowych landingu
 * (`landing-chat-mail`, `schedule-call`).
 *
 * Powstało z kodu, który był skopiowany w kilku trasach — każda kopia to kolejne
 * miejsce, w którym można zapomnieć o escapowaniu treści od użytkownika.
 */
import type { NextRequest } from 'next/server'
import nodemailer from 'nodemailer'

export const OFFICE_TO = 'biuro@planopia.pl'

/** Bajt zerowy potrafi uciąć nagłówek maila, więc wycinamy go z każdego pola. */
const NUL = String.fromCharCode(0)

/** Za proxy (Vercel) prawdziwe IP jest w nagłówku, nie w gnieździe. */
export function getClientIp(request: NextRequest): string {
	const forwarded = request.headers.get('x-forwarded-for')
	if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
	return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/**
 * Escapowanie do treści maila. Bez tego każde pole z formularza może wstrzyknąć
 * dowolny HTML — łącznie z linkiem podszywającym się pod naszą aplikację.
 */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

export function isMailEnabled(): boolean {
	if (process.env.LANDING_CHAT_MAIL_ENABLED === 'false') return false
	return Boolean(process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim())
}

export function createLandingTransporter() {
	return nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	})
}

/** Zwraca przycięty tekst albo null, gdy pusty lub dłuższy niż `maxLength`. */
export function sanitizeText(value: unknown, maxLength: number): string | null {
	if (typeof value !== 'string') return null
	const trimmed = value.split(NUL).join('').trim()
	if (trimmed.length === 0 || trimmed.length > maxLength) return null
	return trimmed
}

/** Prosta walidacja RFC-ish — odsiewa literówki, nie udaje pełnej zgodności ze standardem. */
export function isValidEmail(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	if (trimmed.length === 0 || trimmed.length > 320) return null
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null
	return trimmed
}

/** Pole opcjonalne: brak wartości to nie błąd, ale wartość błędna już tak. */
export function optionalText(value: unknown, maxLength: number): { ok: true; value: string | null } | { ok: false } {
	if (value === undefined || value === null || value === '') return { ok: true, value: null }
	const parsed = sanitizeText(value, maxLength)
	return parsed === null ? { ok: false } : { ok: true, value: parsed }
}
