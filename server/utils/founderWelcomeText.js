/**
 * Osobiste powitanie od twórcy (czysty tekst) — osobno od wysyłki, żeby treść dało się testować bez bazy.
 * Kroki prowadzą do pierwszej wartości: z lejka wynika, że 3 na 4 zespoły nie dodają nikogo i nie wracają.
 * Nazwy przycisków jak w menu aplikacji (Dodaj użytkownika, Czas pracy, Zgłoś urlop, Wnioski urlopowe,
 * Ustawienia → Pracownicy bez dostępu) — przy zmianie etykiet w i18n zaktualizuj też ten tekst.
 */

const FOUNDER_WELCOME_SUBJECT = 'Witam w Planopii — od czego zacząć'

function buildFounderWelcomeText({ adminFirstName, teamName, phone, calendarUrl, founderName, replyEmail }) {
	const name = String(adminFirstName || '').trim()
	const lines = [
		name ? `Dzień dobry, ${name}!` : 'Dzień dobry!',
		'',
		`Dziękuję za założenie zespołu „${teamName}” w Planopii. Jestem ${founderName}, tworzę tę aplikację i piszę osobiście, bo zależy mi, żeby zadziałała u Was od pierwszego dnia.`,
		'',
		'Najszybciej zobaczycie, jak działa, w trzech krokach:',
		'',
		'1. Dodajcie pracowników — w menu „Dodaj użytkownika”. Osoby bez telefonu służbowego możecie dodać bez konta, a godziny wpisze za nie przełożony (Ustawienia → Pracownicy bez dostępu).',
		'2. Wpiszcie pierwszy dzień pracy w zakładce „Czas pracy”.',
		'3. Złóżcie próbny wniosek w „Zgłoś urlop” i zatwierdźcie go w „Wnioskach urlopowych” — w okresie próbnym wszystkie funkcje są dostępne.',
		'',
	]
	if (calendarUrl) {
		lines.push(
			'Wolicie zrobić to razem? W 15 minut ustawimy zespół pod Waszą firmę: pracowników, godziny pracy, urlopy, grafik albo kody QR.',
			`Wystarczy wybrać termin: ${calendarUrl}`,
			''
		)
	}
	const tel = String(phone || '').trim()
	if (tel) {
		lines.push(`Numer ${tel} mam zapisany — zadzwonię w najbliższy dzień roboczy. Jeśli lepsza jest konkretna pora, proszę o krótką odpowiedź.`, '')
	}
	lines.push(
		'Można też po prostu odpisać na tę wiadomość — odpowiadam osobiście, zwykle tego samego dnia.',
		'',
		'Pozdrawiam serdecznie,',
		founderName,
		'twórca Planopii',
		replyEmail
	)
	return lines.join('\n')
}

module.exports = { buildFounderWelcomeText, FOUNDER_WELCOME_SUBJECT }
