import { NextRequest, NextResponse } from 'next/server'
import { getEmailTransporter } from '@/lib/email/transporter'
import { generateCustomPackageRequestEmail } from '@/lib/email/templates'
import { validateCustomPackageRequest } from '@/lib/validations/customPackageRequest'

/**
 * API Route for custom package request submissions
 * Single Responsibility: Only handles HTTP request/response
 * Uses dependency injection for email service and validation
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validation
    const validation = validateCustomPackageRequest(data)
    if (!validation.isValid) {
      return NextResponse.json(
        { message: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Get email transporter (singleton pattern)
    const transporter = getEmailTransporter()

    // Generate email content
    const htmlContent = generateCustomPackageRequestEmail({
      packageType: data.packageType,
      usersCount: data.usersCount,
      selectedFeatures: data.selectedFeatures,
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
      to: 'michalipka1@gmail.com',
      subject: `Nowe zgłoszenie pakietu niestandardowego: ${data.packageType}`,
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
