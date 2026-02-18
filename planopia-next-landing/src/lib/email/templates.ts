/**
 * Email templates
 * Single Responsibility: Only handles email template generation
 */

import { AVAILABLE_FEATURES } from '../pricing/customPackage'

export interface PackageRequestData {
	packageType: string
	usersCount: number
	totalPrice: string
	companyName: string
	email: string
	phone?: string
	message?: string
}

export interface CustomPackageRequestData {
	packageType: string
	usersCount: number
	selectedFeatures: string[]
	totalPrice: string
	companyName: string
	email: string
	phone?: string
	message?: string
}

export function generatePackageRequestEmail(data: PackageRequestData): string {
	const { packageType, usersCount, totalPrice, companyName, email, phone, message } = data

	return `
		<h2 style="color: #2563eb; margin-bottom: 20px;">Nowe zgłoszenie pakietu</h2>
		<div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
			<p style="margin: 8px 0;"><strong>Wybrany pakiet:</strong> ${packageType}</p>
			<p style="margin: 8px 0;"><strong>Liczba użytkowników:</strong> ${usersCount}</p>
			<p style="margin: 8px 0;"><strong>Kwota do zapłaty:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">${totalPrice}</span></p>
		</div>
		<div style="margin-top: 20px;">
			<p style="margin: 8px 0;"><strong>Nazwa firmy/zespołu:</strong> ${companyName}</p>
			<p style="margin: 8px 0;"><strong>Email kontaktowy:</strong> ${email}</p>
			${phone ? `<p style="margin: 8px 0;"><strong>Telefon:</strong> ${phone}</p>` : ''}
			${message && message.trim() !== '' ? `<p style="margin: 8px 0;"><strong>Wiadomość:</strong></p><blockquote style="background-color: #f3f4f6; padding: 12px; border-left: 4px solid #2563eb; margin: 12px 0;">${message.trim()}</blockquote>` : ''}
		</div>
	`
}

export function generateCustomPackageRequestEmail(data: CustomPackageRequestData): string {
	const { packageType, usersCount, selectedFeatures, totalPrice, companyName, email, phone, message } = data

	// Map feature IDs to names
	const featureNames = selectedFeatures.map(featureId => {
		const feature = AVAILABLE_FEATURES.find(f => f.id === featureId)
		return feature ? feature.name.pl : featureId
	}).join(', ')

	return `
		<h2 style="color: #2563eb; margin-bottom: 20px;">Nowe zgłoszenie pakietu niestandardowego</h2>
		<div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
			<p style="margin: 8px 0;"><strong>Wybrany pakiet:</strong> ${packageType}</p>
			<p style="margin: 8px 0;"><strong>Liczba użytkowników:</strong> ${usersCount}</p>
			<p style="margin: 8px 0;"><strong>Wybrane funkcje:</strong> ${featureNames}</p>
			<p style="margin: 8px 0;"><strong>Kwota do zapłaty:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">${totalPrice}</span></p>
		</div>
		<div style="margin-top: 20px;">
			<p style="margin: 8px 0;"><strong>Nazwa firmy/zespołu:</strong> ${companyName}</p>
			<p style="margin: 8px 0;"><strong>Email kontaktowy:</strong> ${email}</p>
			${phone ? `<p style="margin: 8px 0;"><strong>Telefon:</strong> ${phone}</p>` : ''}
			${message && message.trim() !== '' ? `<p style="margin: 8px 0;"><strong>Wiadomość:</strong></p><blockquote style="background-color: #f3f4f6; padding: 12px; border-left: 4px solid #2563eb; margin: 12px 0;">${message.trim()}</blockquote>` : ''}
		</div>
	`
}
