/**
 * Internationalization for custom package modal
 * Single Responsibility: Only handles translations
 */

import { AVAILABLE_FEATURES } from '../pricing/customPackage'
import type { Language, PackageType } from '../pricing/customPackage'

export interface CustomPackageModalTranslations {
	title: string
	description: string
	packageType: {
		label: string
		monthly: string
		yearly: string
	}
	usersCount: string
	features: {
		label: string
		selectAll: string
		minimumRequired: string
	}
	totalPrice: string
	companyName: string
	email: string
	phone: string
	message: string
	submit: string
	dedicatedEnvironment: {
		label: string
		description: string
		price: string
	}
	close: string
	required: string
	validation: {
		fillRequired: string
		invalidEmail: string
		invalidUsersCount: string
		noFeaturesSelected: string
	}
	messages: {
		success: string
		error: string
		sending: string
	}
}

const translations: Record<Language, CustomPackageModalTranslations> = {
	pl: {
		title: 'Pakiet niestandardowy',
		description: 'Wybierz tylko te funkcje, których potrzebujesz. Jesteśmy elastyczni i dopasujemy cenę do Twoich potrzeb.',
		packageType: {
			label: 'Typ pakietu',
			monthly: 'Miesięczny',
			yearly: 'Roczny',
		},
		usersCount: 'Liczba użytkowników',
		features: {
			label: 'Wybierz funkcje',
			selectAll: 'Zaznacz wszystkie',
			minimumRequired: 'Minimalna cena: 11 zł za użytkownika (nawet przy wyborze jednej funkcji)',
		},
		totalPrice: 'Kwota do zapłaty',
		companyName: 'Nazwa firmy/zespołu',
		email: 'Email kontaktowy',
		phone: 'Telefon (opcjonalnie)',
		message: 'Wiadomość (opcjonalnie) - np. dodatkowe funkcje jeśli jest potrzeba itp.',
		submit: 'Wyślij zapytanie',
		dedicatedEnvironment: {
			label: 'Osobne środowisko',
			description: 'Dedykowana subdomena i odizolowana baza danych.',
			price: '+ 7 USD (ok. 25-30 zł) za osobny serwer — opcjonalne',
		},
		close: 'Zamknij',
		required: 'Wymagane',
		validation: {
			fillRequired: 'Wypełnij wszystkie wymagane pola.',
			invalidEmail: 'Nieprawidłowy format email.',
			invalidUsersCount: 'Liczba użytkowników musi być większa niż 0.',
			noFeaturesSelected: 'Wybierz przynajmniej jedną funkcję.',
		},
		messages: {
			success: 'Dziękujemy! Wysłano zapytanie. Skontaktujemy się wkrótce z indywidualną ofertą.',
			error: 'Wystąpił błąd. Spróbuj ponownie później.',
			sending: 'Wysyłanie...',
		},
	},
	en: {
		title: 'Custom package',
		description: 'Choose only the features you need. We are flexible and will adjust the price to your needs.',
		packageType: {
			label: 'Package type',
			monthly: 'Monthly',
			yearly: 'Yearly',
		},
		usersCount: 'Number of users',
		features: {
			label: 'Select features',
			selectAll: 'Select all',
			minimumRequired: 'Minimum price: $3 per user (even when selecting one feature)',
		},
		totalPrice: 'Total amount',
		companyName: 'Company/Team name',
		email: 'Contact email',
		phone: 'Phone (optional)',
		message: 'Message (optional) - e.g. additional features if needed etc.',
		submit: 'Send inquiry',
		dedicatedEnvironment: {
			label: 'Dedicated environment',
			description: 'Dedicated subdomain and isolated database.',
			price: '+ $7 for dedicated server — optional',
		},
		close: 'Close',
		required: 'Required',
		validation: {
			fillRequired: 'Please fill in all required fields.',
			invalidEmail: 'Invalid email format.',
			invalidUsersCount: 'Number of users must be greater than 0.',
			noFeaturesSelected: 'Please select at least one feature.',
		},
		messages: {
			success: 'Thank you! Your inquiry has been sent. We will contact you soon with a custom offer.',
			error: 'An error occurred. Please try again later.',
			sending: 'Sending...',
		},
	},
}

export function getCustomPackageModalTranslations(lang: Language): CustomPackageModalTranslations {
	return translations[lang]
}

export function getFeatureName(featureId: string, lang: Language): string {
	const feature = AVAILABLE_FEATURES.find(f => f.id === featureId)
	return feature ? feature.name[lang] : featureId
}
