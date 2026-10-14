// Źródło: services/officeAccessService.js (connectByCode, acceptInvite, companyEndLink, inviteCompany, clientMonth,
// companyAudit), utils/officeAccessPolicy.js, client/src/components/profile/OfficeAccessSettingsSection.jsx,
// client/src/components/office/OfficePanel.jsx, emailService.sendOfficeInviteEmail.
module.exports = {
	id: 'accountingOffice',
	order: 11,
	title: { pl: 'Biuro rachunkowe — udostępnianie danych', en: 'Accounting office — data sharing' },
	summary: {
		pl: 'Firma może udostępnić swojemu biuru rachunkowemu lub kadrowemu dane do rozliczeń (tylko do odczytu, za zgodą administratora); biuro ma panel z ewidencją, urlopami i eksportem dla wielu firm.',
		en: "A company can share payroll data with its accounting/HR office (read-only, with the administrator's consent); the office has a panel with timesheets, leave and exports for many companies.",
	},
	keywords: {
		pl: ['biuro rachunkow', 'biuro kadrow', 'księgow', 'ksiegow', 'kadrow', 'udostępni', 'udostepni', 'dostęp dla biura', 'panel biura', 'zaproszenie od biura'],
		en: ['accounting office', 'accountant', 'bookkeep', 'payroll office', 'share data', 'office access', 'office panel'],
	},
	requires: { modules: [], bundles: [], trial: true, freemium: true },
	suggestedQuestions: {
		pl: ['Jak udostępnić dane biuru rachunkowemu?', 'Co widzi biuro rachunkowe i czy może coś zmienić?', 'Jak odebrać dostęp biuru?'],
		en: ['How do I share data with my accounting office?', 'What can the accounting office see and can it change anything?', "How do I withdraw the office's access?"],
	},
	body: {
		pl: `### Firma: udostępnienie danych biuru
- Menu → Ustawienia → „Biuro rachunkowe” (tylko Administrator firmy, także w planie darmowym): dodaj biuro po kodzie, który poda biuro, albo przyjmij zaproszenie wysłane przez biuro (przychodzi też e-mail na adres administratora).
- Przed udostępnieniem jest ekran zgody z dokładnym zakresem danych i odwołaniem do umowy powierzenia (DPA). Zapisujemy, kto i kiedy wyraził zgodę.
- Biuro widzi tylko do odczytu: listę pracowników (imię, nazwisko, stanowisko), ewidencję czasu pracy w miesiącach (dni pracy, godziny, nadgodziny, nieobecności), zatwierdzone urlopy i salda urlopów, potwierdzenia ewidencji miesiąca oraz typy urlopów i kalendarz świąt potrzebne do obliczeń.
- „Odbierz dostęp” działa od razu. W tej samej sekcji jest historia: kto z biura i kiedy oglądał albo eksportował dane.

### Biuro: panel
- Zespół biura oznacza Planopia (kontakt: biuro@planopia.pl). Wtedy Administrator i HR biura mają w menu „Biuro rachunkowe”: listę firm, które udostępniły dane, wybór miesiąca i tabelę per pracownik — dni pracy, godziny, nadgodziny, urlop, inne nieobecności, ile zostało urlopu wypoczynkowego, czy miesiąc potwierdzony — z sumą dla firmy.
- Eksport miesiąca do Excela (podsumowanie, dni pracy, nieobecności) i PDF. Każde otwarcie danych firmy i każdy eksport z panelu zapisuje się w historii dostępu firmy.
- Biuro zaprasza firmy po e-mailu administratora firmy i może zakończyć współpracę z firmą.
- Sumy liczone są tak samo jak w liście ewidencji firmy. Panel działa niezależnie od planu.

### Czego NIE robi
- Biuro niczego nie zmienia w danych firmy i nie widzi czatu, zadań, grafików ani pozostałych ustawień.
- Biuro nie widzi danych firmy bez jej zgody ani po odebraniu dostępu; nie widzi e-maili pracowników.
- Nie liczy wynagrodzeń, ZUS ani PIT i nie wysyła danych do programów kadrowo-płacowych — biuro pracuje na eksporcie.
- Z panelu biura nie da się sprawdzić, czy dana firma korzysta z Planopii.

### Gdzie w aplikacji / kto może
Firma: menu → Ustawienia → Biuro rachunkowe (Administrator). Biuro: menu → Biuro rachunkowe (Administrator/HR zespołu biura).`,
		en: null,
	},
}
