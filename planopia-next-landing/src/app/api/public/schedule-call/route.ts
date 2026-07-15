import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email, datetime, message } = await request.json()

    if (!email || (!datetime && (!message || message.trim() === ''))) {
      return NextResponse.json(
        { message: 'Wymagany jest termin lub wiadomość oraz adres email.' },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Build HTML content
    let htmlContent = `<p>Email klienta: <strong>${email}</strong></p>`

    if (datetime) {
      htmlContent += `<p>Wybrany termin: <strong>${new Date(datetime).toLocaleString('pl-PL')}</strong></p>`
    }

    if (message && message.trim() !== '') {
      htmlContent += `<p>Wiadomość od klienta:</p><blockquote>${message.trim()}</blockquote>`
    }

    // Send email
    await transporter.sendMail({
      from: `"Planopia" <${process.env.EMAIL_USER}>`,
      to: 'biuro@planopia.pl',
      subject: 'Nowe zgłoszenie kontaktowe',
      html: htmlContent,
    })

    return NextResponse.json(
      { message: 'Email wysłany pomyślnie' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { message: 'Błąd serwera przy wysyłce emaila' },
      { status: 500 }
    )
  }
}
