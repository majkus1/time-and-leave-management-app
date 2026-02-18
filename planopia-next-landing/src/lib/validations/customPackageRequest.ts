/**
 * Validation schemas for custom package request
 * Single Responsibility: Only handles validation logic
 */

import { AVAILABLE_FEATURES } from '../pricing/customPackage'

export interface CustomPackageRequestInput {
	packageType: string
	usersCount: number
	selectedFeatures: string[]
	totalPrice: string
	companyName: string
	email: string
	phone?: string
	message?: string
}

export function validateCustomPackageRequest(data: Partial<CustomPackageRequestInput>): {
	isValid: boolean
	errors: string[]
} {
	const errors: string[] = []

	if (!data.email || !data.email.trim()) {
		errors.push('Email jest wymagany')
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
		errors.push('Nieprawidłowy format email')
	}

	if (!data.companyName || !data.companyName.trim()) {
		errors.push('Nazwa firmy jest wymagana')
	}

	if (!data.usersCount || data.usersCount < 7) {
		errors.push('Liczba użytkowników musi być co najmniej 7 (aplikacja jest darmowa do 6 użytkowników)')
	}

	if (!data.packageType || !data.packageType.trim()) {
		errors.push('Typ pakietu jest wymagany')
	}

	if (!data.selectedFeatures || !Array.isArray(data.selectedFeatures) || data.selectedFeatures.length === 0) {
		errors.push('Wybierz przynajmniej jedną funkcję')
	} else {
		// Validate that selected features are valid
		const validFeatureIds = AVAILABLE_FEATURES.map(f => f.id)
		const invalidFeatures = data.selectedFeatures.filter(id => !validFeatureIds.includes(id))
		if (invalidFeatures.length > 0) {
			errors.push('Wybrano nieprawidłowe funkcje')
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}
