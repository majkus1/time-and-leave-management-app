/**
 * Zgłoszenie do programu partnerskiego (/program-partnerski → /api/public/partner-application).
 * Czysta walidacja bez importów — testowana przez node --experimental-strip-types.
 */

export const PARTNER_ROLES = ['Biuro rachunkowe', 'Biuro kadrowo-płacowe', 'Doradca lub handlowiec', 'Firma IT', 'Inne'] as const
export const PARTNER_COMPANY_RANGES = ['1–5', '6–20', '21–50', 'Ponad 50'] as const

export const PARTNER_LIMITS = { name: 120, email: 320, phone: 40, company: 200, message: 4000 }

export type PartnerApplication = {
	name: string
	email: string
	phone: string | null
	company: string | null
	role: string | null
	companies: string | null
	message: string | null
}

export type PartnerApplicationResult =
	| { ok: true; spam: boolean; value: PartnerApplication }
	| { ok: false; message: string }

const NUL = String.fromCharCode(0)

function clean(value: unknown): string {
	return typeof value === 'string' ? value.split(NUL).join('').trim() : ''
}

function optional(value: unknown, max: number): { ok: boolean; value: string | null } {
	const text = clean(value)
	if (!text) return { ok: true, value: null }
	return text.length > max ? { ok: false, value: null } : { ok: true, value: text }
}

function fromList(value: unknown, list: readonly string[]): { ok: boolean; value: string | null } {
	const text = clean(value)
	if (!text) return { ok: true, value: null }
	return list.includes(text) ? { ok: true, value: text } : { ok: false, value: null }
}

export function validatePartnerApplication(body: Record<string, unknown> | null | undefined): PartnerApplicationResult {
	if (!body || typeof body !== 'object') return { ok: false, message: 'Nieprawidłowe żądanie.' }

	const name = clean(body.name)
	if (name.length < 2 || name.length > PARTNER_LIMITS.name) {
		return { ok: false, message: 'Podaj imię i nazwisko.' }
	}

	const email = clean(body.email)
	if (!email || email.length > PARTNER_LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return { ok: false, message: 'Podaj poprawny adres e-mail.' }
	}

	const phone = optional(body.phone, PARTNER_LIMITS.phone)
	const company = optional(body.company, PARTNER_LIMITS.company)
	const message = optional(body.message, PARTNER_LIMITS.message)
	if (!phone.ok || !company.ok || !message.ok) {
		return { ok: false, message: 'Któreś z pól jest za długie.' }
	}

	const role = fromList(body.role, PARTNER_ROLES)
	const companies = fromList(body.companies, PARTNER_COMPANY_RANGES)
	if (!role.ok || !companies.ok) return { ok: false, message: 'Nieprawidłowa wartość w formularzu.' }

	// Pole-pułapka niewidoczne dla ludzi — bot dostaje „sukces”, ale mail nie wychodzi
	const spam = clean(body.website).length > 0

	return {
		ok: true,
		spam,
		value: { name, email, phone: phone.value, company: company.value, role: role.value, companies: companies.value, message: message.value },
	}
}
