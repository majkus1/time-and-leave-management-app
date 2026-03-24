/**
 * Validation schemas for package request
 * Single Responsibility: Only handles validation logic
 */

export interface PackageRequestInput {
	packageType: string
	usersCount: number
	totalPrice: string
	companyName: string
	email: string
	phone?: string
	message?: string
}

export function validatePackageRequest(data: Partial<PackageRequestInput>): {
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

	if (!data.usersCount || data.usersCount < 5) {
		errors.push(
			'Liczba użytkowników musi być co najmniej 5 (płatne plany; okres próbny: do 5 użytkowników przez 30 dni)',
		)
	}

	if (!data.packageType || !data.packageType.trim()) {
		errors.push('Typ pakietu jest wymagany')
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}
