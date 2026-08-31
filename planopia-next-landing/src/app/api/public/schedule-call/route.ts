import { NextRequest, NextResponse } from 'next/server'
import { landingContactRateLimit } from '@/lib/landingChat/rateLimit'
import {
	OFFICE_TO,
	createLandingTransporter,
	escapeHtml,
	getClientIp,
	isMailEnabled,
	isValidEmail,
	optionalText,
	sanitizeText,
} from '@/lib/landingMail'

const MAX_MESSAGE = 4000
const MAX_COMPANY = 200
const MAX_PHONE = 40
const MAX_TEAM_SIZE = 40

/** Wiersz maila tylko wtedy, gdy pole faktycznie przyszło — pusty wiersz to szum dla czytającego. */
function row(label: string, value: string | null): string {
	return value ? `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>` : ''
}

export async function POST(request: NextRequest) {
	if (!isMailEnabled()) {
		return NextResponse.json({ message: 'Wysyłka maili jest wyłączona.' }, { status: 503 })
	}

	const ip = getClientIp(request)
	const limit = landingContactRateLimit(ip)
	if (!limit.ok) {
		return NextResponse.json(
			{ message: 'Zbyt wiele zgłoszeń. Spróbuj ponownie za chwilę.' },
			{ status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
		)
	}

	let body: Record<string, unknown>
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ message: 'Nieprawidłowe żądanie.' }, { status: 400 })
	}

	const email = isValidEmail(body.email)
	if (!email) {
		return NextResponse.json({ message: 'Podaj poprawny adres e-mail.' }, { status: 400 })
	}

	const message = body.message === undefined || body.message === '' ? null : sanitizeText(body.message, MAX_MESSAGE)
	const datetime = typeof body.datetime === 'string' && body.datetime.trim() !== '' ? body.datetime.trim() : null

	// Zachowana dotychczasowa regula: sam e-mail nie wystarczy — potrzebny termin albo tresc.
	if (!datetime && !message) {
		return NextResponse.json(
			{ message: 'Wymagany jest termin lub wiadomość oraz adres e-mail.' },
			{ status: 400 }
		)
	}

	const company = optionalText(body.companyName, MAX_COMPANY)
	const phone = optionalText(body.phone, MAX_PHONE)
	const teamSize = optionalText(body.teamSize, MAX_TEAM_SIZE)
	if (!company.ok || !phone.ok || !teamSize.ok) {
		return NextResponse.json({ message: 'Któreś z pól jest za długie.' }, { status: 400 })
	}

	let scheduledLabel: string | null = null
	if (datetime) {
		const parsed = new Date(datetime)
		if (Number.isNaN(parsed.getTime())) {
			return NextResponse.json({ message: 'Nieprawidłowy termin.' }, { status: 400 })
		}
		scheduledLabel = parsed.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })
	}

	try {
		const html = [
			row('E-mail klienta', email),
			row('Firma', company.value),
			row('Telefon', phone.value),
			row('Wielkość zespołu', teamSize.value),
			row('Wybrany termin', scheduledLabel),
			message
				? `<hr /><p><strong>Wiadomość:</strong></p><pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(message)}</pre>`
				: '',
			`<p style="font-size:12px;color:#666">IP: ${escapeHtml(ip)}</p>`,
		]
			.filter(Boolean)
			.join('\n')

		await createLandingTransporter().sendMail({
			from: `"Planopia (formularz)" <${process.env.EMAIL_USER}>`,
			to: OFFICE_TO,
			replyTo: email,
			subject: scheduledLabel ? 'Prośba o rozmowę — formularz' : 'Nowe zgłoszenie kontaktowe',
			html,
		})

		return NextResponse.json({ message: 'Email wysłany pomyślnie' }, { status: 200 })
	} catch (error: unknown) {
		const detail = error instanceof Error ? error.message : String(error)
		console.error('[schedule-call]', detail, error)
		return NextResponse.json({ message: 'Błąd serwera przy wysyłce emaila' }, { status: 500 })
	}
}
