import { NextRequest, NextResponse } from 'next/server'
import { landingContactRateLimit } from '@/lib/landingChat/rateLimit'
import { OFFICE_TO, createLandingTransporter, escapeHtml, getClientIp, isMailEnabled } from '@/lib/landingMail'
import { validatePartnerApplication } from '@/lib/validations/partnerApplication'

/** Wiersz maila tylko wtedy, gdy pole faktycznie przyszło */
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

	const parsed = validatePartnerApplication(body)
	if (!parsed.ok) return NextResponse.json({ message: parsed.message }, { status: 400 })
	// Bot dostaje zwykłą odpowiedź, żeby nie uczył się omijać pułapki
	if (parsed.spam) return NextResponse.json({ message: 'Zgłoszenie wysłane' }, { status: 200 })

	const a = parsed.value
	try {
		const html = [
			row('Imię i nazwisko', a.name),
			row('E-mail', a.email),
			row('Telefon', a.phone),
			row('Biuro / firma', a.company),
			row('Kim jest', a.role),
			row('Ile firm może polecić', a.companies),
			a.message
				? `<hr /><p><strong>Wiadomość:</strong></p><pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(a.message)}</pre>`
				: '',
			`<p style="font-size:12px;color:#666">Formularz: planopia.pl/program-partnerski · IP: ${escapeHtml(ip)}</p>`,
		]
			.filter(Boolean)
			.join('\n')

		await createLandingTransporter().sendMail({
			from: `"Planopia (formularz)" <${process.env.EMAIL_USER}>`,
			to: OFFICE_TO,
			replyTo: a.email,
			subject: `Program partnerski — zgłoszenie: ${a.company ?? a.name}`.replace(/[\r\n]+/g, ' '),
			html,
		})

		return NextResponse.json({ message: 'Zgłoszenie wysłane' }, { status: 200 })
	} catch (error: unknown) {
		const detail = error instanceof Error ? error.message : String(error)
		console.error('[partner-application]', detail)
		return NextResponse.json({ message: 'Błąd serwera przy wysyłce zgłoszenia' }, { status: 500 })
	}
}
