import { NextRequest, NextResponse } from 'next/server'
import { OFFICE_TO, createLandingTransporter, escapeHtml, isMailEnabled, isValidEmail, landingFrom } from '@/lib/landingMail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const email = isValidEmail(body?.email)

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 })
    }
    if (!isMailEnabled()) {
      return NextResponse.json({ message: 'Server error while sending email' }, { status: 500 })
    }

    // Adres z formularza tylko jako tekst — bez escapowania dałoby się wstrzyknąć HTML do maila biura
    await createLandingTransporter().sendMail({
      from: landingFrom('formularz'),
      to: OFFICE_TO,
      replyTo: email,
      subject: 'Demo account request',
      html: `<p>Email użytkownika: <strong>${escapeHtml(email)}</strong></p><p>Poproszono o konto testowe.</p>`,
    })

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ message: 'Server error while sending email' }, { status: 500 })
  }
}
