export type LandingChatLocale = 'pl' | 'en'

export const LANDING_CHAT_ICON = '/img/planio-czat.png'
export const LANDING_CHAT_SECTION_ID: Record<LandingChatLocale, string> = { pl: 'asystent', en: 'assistant' }
export const LANDING_REGISTER_URL = 'https://app.planopia.pl/team-registration'
export const LANDING_CONTACT_ANCHOR: Record<LandingChatLocale, string> = { pl: '#kontakt', en: '#contact' }

export const landingChatCopy = {
	pl: {
		title: 'Planio - Asystent',
		sectionEyebrow: 'Zapytaj, zanim założysz konto',
		sectionTitle: 'Zapytaj asystenta, jak działa Planopia',
		sectionLead:
			'Kody QR na budowach, urlopy godzinowe, grafiki, ceny dla Twojego zespołu — asystent odpowiada na podstawie tego, jak aplikacja naprawdę działa. Bez limitu pytań i bez rejestracji.',
		sectionHint: 'Wybierz temat albo wpisz własne pytanie.',
		placeholder: 'Napisz pytanie…',
		send: 'Wyślij',
		thinking: 'Planio pisze…',
		error: 'Nie udało się uzyskać odpowiedzi. Spróbuj ponownie za chwilę.',
		errorRate: 'Zbyt wiele wiadomości. Spróbuj za chwilę.',
		errorDisabled: 'Czat jest chwilowo niedostępny.',
		welcome: 'Cześć, jestem Planio. Zapytaj, jak działa Planopia — o funkcje, ceny albo o to, czy pasuje do Twojej firmy.',
		close: 'Zamknij czat',
		open: 'Otwórz czat z asystentem',
		chatIconAlt: 'Ikona asystenta Planio na stronie',
		topicsLabel: 'Temat',
		topicAll: 'Dowolny temat',
		suggestionsLabel: 'Przykładowe pytania',
		reset: 'Nowa rozmowa',
		ctaRegister: 'Załóż zespół — 30 dni za darmo',
		ctaContact: 'Napisz do nas',
		ctaHintRegister: 'Bez karty, gotowe w 2 minuty.',
		ctaHintContact: 'Odpowiemy na Twoje pytanie osobiście.',
		emailCta: 'Wyślij pytanie e-mailem do zespołu',
		emailBodyLabel: 'Treść wiadomości',
		emailReplyLabel: 'Twój e-mail (opcjonalnie — żeby móc odpowiedzieć)',
		emailNext: 'Dalej',
		emailBack: 'Wróć',
		emailConfirm: 'Czy wysłać wiadomość na adres biuro@planopia.pl?',
		emailTranscriptNote: 'Do wiadomości dołączymy treść tej rozmowy z asystentem, żeby nie trzeba było jej powtarzać.',
		emailSend: 'Wyślij',
		emailCancel: 'Anuluj',
		emailSent: 'Wysłano. Dziękujemy — odezwiemy się jak najszybciej.',
		emailError: 'Nie udało się wysłać. Spróbuj ponownie później.',
		emailDisabled: 'Wysyłka e-maili z czatu jest chwilowo wyłączona.',
		privacy: 'Nie podawaj w czacie danych osobowych. Rozmowa zostaje w tej przeglądarce.',
	},
	en: {
		title: 'Planio - Assistant',
		sectionEyebrow: 'Ask before you sign up',
		sectionTitle: 'Ask the assistant how Planopia works',
		sectionLead:
			'QR codes on job sites, hourly leave, schedules, pricing for your team — the assistant answers from how the app actually works. No question limit, no sign-up.',
		sectionHint: 'Pick a topic or type your own question.',
		placeholder: 'Type your question…',
		send: 'Send',
		thinking: 'Planio is typing…',
		error: 'Could not get a reply. Please try again in a moment.',
		errorRate: 'Too many messages. Please wait a bit.',
		errorDisabled: 'Chat is temporarily unavailable.',
		welcome: 'Hi! I’m Planio. Ask how Planopia works — features, pricing, or whether it fits your company.',
		close: 'Close chat',
		open: 'Open assistant chat',
		chatIconAlt: 'Planio assistant icon on the landing page',
		topicsLabel: 'Topic',
		topicAll: 'Any topic',
		suggestionsLabel: 'Sample questions',
		reset: 'New conversation',
		ctaRegister: 'Create a team — 30 days free',
		ctaContact: 'Contact us',
		ctaHintRegister: 'No card, ready in 2 minutes.',
		ctaHintContact: 'We will answer your question personally.',
		emailCta: 'Send your question by email',
		emailBodyLabel: 'Message',
		emailReplyLabel: 'Your email (optional — for a reply)',
		emailNext: 'Continue',
		emailBack: 'Back',
		emailConfirm: 'Send this message to biuro@planopia.pl?',
		emailTranscriptNote: 'We will attach this conversation with the assistant so you do not have to repeat it.',
		emailSend: 'Send',
		emailCancel: 'Cancel',
		emailSent: 'Sent. Thank you — we’ll get back to you as soon as we can.',
		emailError: 'Could not send. Please try again later.',
		emailDisabled: 'Email sending from chat is temporarily unavailable.',
		privacy: 'Please do not share personal data in the chat. The conversation stays in this browser.',
	},
} as const

export type LandingChatCopy = (typeof landingChatCopy)[LandingChatLocale]

export function landingChatLocaleFromPath(pathname: string | null): LandingChatLocale {
	if (!pathname) return 'pl'
	return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pl'
}

export function isLandingHomePath(pathname: string | null): boolean {
	return pathname === '/' || pathname === '/en' || pathname === '/en/'
}
