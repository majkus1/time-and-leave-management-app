import { NextRequest, NextResponse } from 'next/server'
import { getEmailTransporter } from '@/lib/email/transporter'
import { generatePackageRequestEmail } from '@/lib/email/templates'
import { validatePackageRequest } from '@/lib/validations/packageRequest'

/**
 * API Route for package request submissions
 * Single Responsibility: Only handles HTTP request/response
 * Uses dependency injection for email service and validation
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validation
    const validation = validatePackageRequest(data)
    if (!validation.isValid) {
      return NextResponse.json(
        { message: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Get email transporter (singleton pattern)
    const transporter = getEmailTransporter()

    // Generate email content
    const htmlContent = generatePackageRequestEmail({
      packageType: data.packageType,
      usersCount: data.usersCount,
      totalPrice: data.totalPrice,
      companyName: data.companyName,
      email: data.email,
      phone: data.phone,
      message: data.message,
    })

    // Send email
    const emailUser = process.env.EMAIL_USER
    if (!emailUser) {
      throw new Error('EMAIL_USER not configured')
    }

    await transporter.sendMail({
      from: `"Planopia" <${emailUser}>`,
      to: 'office@ml-devworks.com',
      subject: `Nowe zgłoszenie pakietu: ${data.packageType}`,
      html: htmlContent,
    })

    return NextResponse.json(
      { message: 'Email wysłany pomyślnie' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email send error:', error)
    
    // Better error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Błąd serwera przy wysyłce emaila'
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
