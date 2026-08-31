export type IndustryConstructionLocale = 'pl' | 'en'

export const industryConstructionCopy: Record<
	IndustryConstructionLocale,
	{
		heroH1: string
		heroSub: string
		galleryTitle: string
		videoEyebrow: string
		videoTitle: string
		videoBody: string
		videoCta: string
		videoHref: string
		problemsTitle: string
		problems: string[]
		fieldCrewTitle: string
		fieldCrewLead: string
		fieldCrewBullets: string[]
		solutionTitle: string
		solutionIntro: string
		features: string[]
		aiTitle: string
		aiBullets: string[]
		stepsTitle: string
		steps: string[]
		faqTitle: string
		faqs: { q: string; a: string }[]
		ctaTitle: string
		ctaButton: string
		ctaNote: string
		blogLinkLabel: string
		heroImageSrc: string
		heroImageAlt: string
	}
> = {
	pl: {
		heroH1: 'Ewidencja czasu pracy na budowie i grafiki dla firm budowlanych',
		heroSub:
			'Czas pracy, urlopy, grafiki brygad, zadania i czat w jednym miejscu — bez Excela. 30 dni za darmo, potem darmowa ewidencja do 5 osób lub pakiety płatne.',
		galleryTitle: 'Jak wygląda Planopia w praktyce — zrzuty z aplikacji',
		videoEyebrow: 'Instrukcja wideo',
		videoTitle: 'Zobacz Planopię w działaniu',
		videoBody:
			'Krótkie nagrania prosto z aplikacji — m.in. jak dodać godziny w ewidencji czasu pracy. Świetny start zaraz po założeniu zespołu.',
		videoCta: 'Otwórz instrukcję wideo',
		videoHref: '/jak-korzystac',
		problemsTitle: 'Co najczęściej psuje rozliczenia na budowie?',
		problems: [
			'Chaos w godzinach i nadgodzinach — dane rozrzucone między kartki, SMS-y i arkusze.',
			'Brak jednego widoku: kto był na jakiej budowie i ile faktycznie przepracował.',
			'Urlopy i nieobecności „na słowo” — trudno zaplanować brygady i uniknąć kolizji.',
		],
		fieldCrewTitle: 'Ewidencja brygad i pracowników budowlanych — bez logowania całej ekipy',
		fieldCrewLead:
			'Nie każdy na budowie musi mieć konto w aplikacji. Brygadzista lub kierownik może dodawać pracowników bez dostępu i prowadzić rozliczanie brygady oraz raportowanie czasu pracy na budowie z jednego miejsca — także w planie darmowym (ewidencja czasu pracy).',
		fieldCrewBullets: [
			'Dodawanie pracowników bez dostępu do aplikacji — wliczają się do limitu miejsc, bez hasła i maila z zaproszeniem.',
			'Ewidencja czasu pracy za ekipę — kalendarz, nadgodziny, raporty PDF i Excel do biura lub klienta.',
			'Grafiki, urlopy i nieobecności za pracowników terenowych — w planie płatnym (po rozszerzeniu konta).',
		],
		solutionTitle: 'Planopia dla budowlanki — porządek w jednym miejscu',
		solutionIntro:
			'Planopia to nie tylko urlopy i ewidencja — to narzędzie, z którego zespół korzysta codziennie: planuje pracę, komunikuje się i domyka zadania.',
		features: [
			'Idealne dla brygad budowlanych — brygadzista lub kierownik dodaje pracowników bez logowania i prowadzi ich ewidencję czasu pracy; w planie płatnym także grafiki, urlopy i nieobecności całej ekipy.',
			'Ewidencja czasu pracy — szybkie wpisy, kalendarz miesięczny, raporty i eksport PDF / Excel.',
			'Grafiki i zmiany — planowanie pracy brygad i podgląd obłożenia.',
			'Urlopy i nieobecności — wnioski i akceptacje w systemie, zamiast łańcuchów wiadomości.',
			'QR i telefon — wygodne rejestrowanie czasu z placu budowy (PWA w przeglądarce).',
			'Tablice zadań (Kanban) — zlecenia, checklisty i status prac dla biura i terenu.',
			'Czaty zespołowe — ustalenia, dokumenty i dopytywanie bez rozjechania wątków w komunikatorze.',
		],
		aiTitle: 'Asystent AI — mniej ręcznego liczenia',
		aiBullets: [
			'Podsumowanie miesiąca pracy zespołu i budów.',
			'Szybsze wychwycenie nadgodzin i luk w grafiku.',
			'Wsparcie przy raportach — mniej przeklejania do arkuszy.',
		],
		stepsTitle: 'Jak zacząć — 3 krótkie kroki',
		steps: [
			'Załóż darmowy zespół w Planopii (do 5 osób w okresie próbnym).',
			'Dodaj pracowników z kontem lub bez dostępu do aplikacji — ustal role: kto prowadzi ewidencję brygady, kto akceptuje urlopy.',
			'Uruchom ewidencję, grafik i — jeśli chcesz — tablice zadań oraz czaty pod konkretne budowy.',
		],
		faqTitle: 'Częste pytania',
		faqs: [
			{
				q: 'Czy każdy pracownik musi mieć dostęp do aplikacji?',
				a: 'Nie. W Planopii brygadzista, kierownik budowy lub HR może dodać pracowników bez dostępu do aplikacji i samodzielnie uzupełniać ich ewidencję czasu pracy — to ułatwia rozliczanie brygad i raportowanie godzin z placu budowy. W planie darmowym dostępna jest ewidencja za takich pracowników; grafiki, wnioski urlopowe i nieobecności za ekipę — po rozszerzeniu planu. Rozwiązanie szczególnie dobrze sprawdza się w budowlance i pracy terenowej.',
			},
			{
				q: 'Czy działa na telefonie na budowie?',
				a: 'Tak. Planopia działa w przeglądarce jako PWA — możesz dodać skrót na ekran telefonu i korzystać wygodnie w terenie.',
			},
			{
				q: 'Czy mogę eksportować dane?',
				a: 'Tak — m.in. raporty w PDF i Excel, żeby przekazać dane do biura lub klienta.',
			},
			{
				q: 'Czy da się kontrolować nadgodziny?',
				a: 'Tak — masz przejrzysty podgląd przepracowanych godzin i nadgodzin w kalendarzu i raportach.',
			},
			{
				q: 'Czy to tylko do urlopów?',
				a: 'Nie. Planopia łączy ewidencję czasu, grafiki, urlopy, tablice zadań i czaty — żeby firma miała jedno spójne narzędzie na co dzień.',
			},
		],
		ctaTitle: 'Porządek na budowie i w biurze?',
		ctaButton: 'Załóż zespół — 30 dni gratis',
		ctaNote:
			'30 dni pełnej aplikacji; potem darmowa ewidencja (5 kont) lub plan płatny — urlopy, grafik, czat, AI.',
		blogLinkLabel: 'Przeczytaj artykuł: ewidencja czasu na budowie',
		heroImageSrc: '/img/budowa2.webp',
		heroImageAlt: 'Planopia na budowie — ewidencja czasu pracy i zespół w terenie',
	},
	en: {
		heroH1: 'Construction time tracking and crew scheduling for building companies',
		heroSub:
			'One app for everyday work: time tracking, leave, crew schedules, Kanban tasks, and team chat — without spreadsheets or scattered messages. Start with a 30-day full trial, then free time tracking for up to 5 active accounts or paid plans.',
		galleryTitle: 'What Planopia looks like — in-app screenshots',
		videoEyebrow: 'Video tutorials',
		videoTitle: 'See Planopia in action',
		videoBody:
			'Short clips recorded inside the app — for example, how to add hours in the time log. A great first step right after you create a team.',
		videoCta: 'Open video tutorials',
		videoHref: '/en/how-to-use',
		problemsTitle: 'What usually breaks construction payroll and planning?',
		problems: [
			'Chaotic hours and overtime — data split across paper, SMS, and spreadsheets.',
			'No single view of who was on which site and how many hours they worked.',
			'Leave and absences agreed “verbally” — hard to staff crews and avoid clashes.',
		],
		fieldCrewTitle: 'Crew time tracking without every worker logging in',
		fieldCrewLead:
			'Not everyone on site needs an app account. A foreman or site manager can add no-access workers and run crew time tracking and field reporting from one login — including timesheets on the free plan.',
		fieldCrewBullets: [
			'Add employees without app access — they count toward your seat limit, with no password email or login.',
			'Timesheets on their behalf — monthly calendar, overtime, PDF and Excel exports for the office or client.',
			'Schedules, leave, and absences for field staff — on paid plans (after upgrading your account).',
		],
		solutionTitle: 'Planopia for construction — one place for the team',
		solutionIntro:
			'Planopia is not only leave and time tracking — it is a tool your team uses daily to plan work, communicate, and close out jobs.',
		features: [
			'Built for construction crews — foreman or manager adds no-access workers and logs their time; paid plans add schedules, leave, and absences for the whole crew.',
			'Time tracking — fast entries, monthly calendar, reports, PDF / Excel export.',
			'Schedules and shifts — plan crews and see coverage at a glance.',
			'Leave and absences — requests and approvals in the app instead of message threads.',
			'QR and mobile — log time from the site using a phone browser (PWA).',
			'Kanban boards — jobs, checklists, and status for office and field.',
			'Team chat — decisions and files without losing context in a personal messenger.',
		],
		aiTitle: 'AI assistant — less manual crunching',
		aiBullets: [
			'Summaries of the month across crews and sites.',
			'Faster spotting of overtime and schedule gaps.',
			'Help preparing reports with less copy-paste.',
		],
		stepsTitle: 'Get started in three steps',
		steps: [
			'Create your free team — 30 days with every module, then a free time tracking tier for up to 5 active accounts or an upgrade.',
			'Add people with or without app access — set roles: who runs crew timesheets, who approves leave.',
			'Turn on time tracking and schedules — and optionally boards and chats per site.',
		],
		faqTitle: 'FAQ',
		faqs: [
			{
				q: 'Does every employee need access to the app?',
				a: 'No. In Planopia a foreman, site manager, or HR user can add employees without app access and maintain their timesheets — ideal for crew payroll and construction site reporting. On the free plan you can manage timesheets for them; schedules, leave requests, and absences on their behalf unlock on a paid plan. Especially popular in construction and field work.',
			},
			{
				q: 'Does it work on phones on site?',
				a: 'Yes. Planopia runs in the browser as a PWA — add it to your home screen and use it comfortably in the field.',
			},
			{
				q: 'Can I export data?',
				a: 'Yes — including PDF and Excel reports for the office or your client.',
			},
			{
				q: 'Can we control overtime?',
				a: 'Yes — you get a clear view of worked hours and overtime in the calendar and reports.',
			},
			{
				q: 'Is it only for leave management?',
				a: 'No. Planopia combines time tracking, schedules, leave, Kanban tasks, and chat — one coherent tool for daily operations.',
			},
		],
		ctaTitle: 'Site and office under control?',
		ctaButton: 'Create your team — 30 days free',
		ctaNote:
			'30 days full access; then free time tracking (5 accounts) or a paid plan — leave, schedules, chat, AI.',
		blogLinkLabel: 'Read the article: time tracking on construction sites',
		heroImageSrc: '/img/budowa2.webp',
		heroImageAlt: 'Construction site team — time tracking with Planopia',
	},
}

