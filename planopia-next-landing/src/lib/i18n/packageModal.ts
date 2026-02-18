/**
 * Internationalization for package modal
 * Single Responsibility: Only handles translations
 */

export type Language = 'pl' | 'en'

export interface PackageModalTranslations {
	title: string
	packageSelected: string
	pricePerUser: string
	usersCount: string
	companyName: string
	email: string
	phone: string
	message: string
	totalPrice: string
	dedicatedEnvironment: {
		label: string
		description: string
		price: string
	}
	submit: string
	close: string
	required: string
	validation: {
		fillRequired: string
		invalidEmail: string
		invalidUsersCount: string
	}
	messages: {
		success: string
		error: string
		sending: string
	}
}

const baseTranslations: Record<Language, Omit<PackageModalTranslations, 'packageSelected'>> = {
	pl: {
		title: 'Wybierz pakiet',
		pricePerUser: 'za użytkownika',
		usersCount: 'Liczba użytkowników',
		companyName: 'Nazwa firmy/zespołu',
		email: 'Email kontaktowy',
		phone: 'Telefon (opcjonalnie)',
		message: 'Wiadomość (opcjonalnie) - np. dodatkowe funkcje jeśli jest potrzeba itp.',
		totalPrice: 'Kwota do zapłaty',
		dedicatedEnvironment: {
			label: 'Osobne środowisko',
			description: 'Dedykowana subdomena i odizolowana baza danych.',
			price: '+ 7 USD (ok. 25-30 zł) za osobny serwer — opcjonalne',
		},
		submit: 'Wyślij zgłoszenie',
		close: 'Zamknij',
		required: 'Wymagane',
		validation: {
			fillRequired: 'Wypełnij wszystkie wymagane pola.',
			invalidEmail: 'Nieprawidłowy format email.',
			invalidUsersCount: 'Liczba użytkowników musi być większa niż 0.',
		},
		messages: {
			success: 'Dziękujemy! Wysłano zgłoszenie. Skontaktujemy się wkrótce.',
			error: 'Wystąpił błąd. Spróbuj ponownie później.',
			sending: 'Wysyłanie...',
		},
	},
	en: {
		title: 'Choose package',
		pricePerUser: 'per user',
		usersCount: 'Number of users',
		companyName: 'Company/Team name',
		email: 'Contact email',
		phone: 'Phone (optional)',
		message: 'Message (optional) - e.g. additional features if needed etc.',
		totalPrice: 'Total amount',
		dedicatedEnvironment: {
			label: 'Dedicated environment',
			description: 'Dedicated subdomain and isolated database.',
			price: '+ $7 for dedicated server — optional',
		},
		submit: 'Send request',
		close: 'Close',
		required: 'Required',
		validation: {
			fillRequired: 'Please fill in all required fields.',
			invalidEmail: 'Invalid email format.',
			invalidUsersCount: 'Number of users must be greater than 0.',
		},
		messages: {
			success: 'Thank you! Your request has been sent. We will contact you soon.',
			error: 'An error occurred. Please try again later.',
			sending: 'Sending...',
		},
	},
}

export function getPackageModalTranslations(lang: Language, packageType: 'monthly' | 'yearly'): PackageModalTranslations {
	const base = baseTranslations[lang]
	const packageNames = {
		pl: {
			monthly: 'Pakiet miesięczny',
			yearly: 'Pakiet roczny',
		},
		en: {
			monthly: 'Monthly plan',
			yearly: 'Yearly plan',
		},
	}
	
	return {
		...base,
		packageSelected: packageNames[lang][packageType],
	}
}
