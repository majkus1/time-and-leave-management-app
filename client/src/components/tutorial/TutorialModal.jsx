import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useFreemiumAccess } from '../../hooks/useFreemiumAccess'
import { useSupervisorConfig } from '../../hooks/useSupervisor'
function TutorialModal({ isOpen, onClose, showOnFirstView = false }) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const { refreshUserData, markTutorialSeenLocally, role, username, userId } = useAuth()
	const { freemiumTier, freemiumSeatBlocked } = useFreemiumAccess({ enabled: true })
	const [activeSection, setActiveSection] = useState(null)
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
	const dismissFirstViewRef = useRef(false)

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768)
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	useEffect(() => {
		if (isOpen) dismissFirstViewRef.current = false
	}, [isOpen])

	const dismissFirstViewTutorial = useCallback(() => {
		if (dismissFirstViewRef.current) return
		dismissFirstViewRef.current = true
		markTutorialSeenLocally()
		onClose()
		void (async () => {
			try {
				await axios.post(`${API_URL}/api/users/tutorial/seen`, {}, { withCredentials: true })
				await refreshUserData()
			} catch (error) {
				if (process.env.NODE_ENV === 'development') {
					console.error('Error marking tutorial as seen:', error)
				}
			}
		})()
	}, [markTutorialSeenLocally, onClose, refreshUserData])
	
	// Sprawdź role użytkownika
	const isAdmin = role && role.includes('Admin')
	const isHR = role && role.includes('HR')
	const isSupervisor = role && role.includes('Przełożony (Supervisor)')
	const canSeePackagesTutorial = isAdmin || isHR || username === 'michalipka1@gmail.com'
	const { data: supervisorConfig } = useSupervisorConfig(
		userId,
		isSupervisor && !isAdmin && !isHR
	)
	const supervisorCanViewTimesheets =
		isSupervisor && supervisorConfig?.permissions?.canViewTimesheets !== false
	const supervisorCanApproveLeaves =
		isSupervisor && supervisorConfig?.permissions?.canApproveLeaves !== false
	const canSeeManagerReports =
		isAdmin || isHR || (isSupervisor && (supervisorCanViewTimesheets || supervisorCanApproveLeaves))

	const formatTutorialContent = (content) => {
		if (!content || typeof content !== 'string') return []

		const paragraphs = content
			.replace(/\r/g, '')
			.split('\n')
			.map((paragraph) => paragraph.trim())
			.filter(Boolean)

		const blocks = []
		let i = 0
		const bulletPrefix = /^[–\-]\s+/

		while (i < paragraphs.length) {
			const paragraph = paragraphs[i]
			if (bulletPrefix.test(paragraph)) {
				const items = []
				while (i < paragraphs.length && bulletPrefix.test(paragraphs[i])) {
					items.push(paragraphs[i].replace(bulletPrefix, ''))
					i++
				}
				blocks.push({ type: 'list', items })
				continue
			}
			if (paragraph.length > 220) {
				const protectedParagraph = paragraph
					.replace(/\bm\.in\./gi, 'm§in§')
					.replace(/\bnp\./gi, 'np§')
					.replace(/\bitp\./gi, 'itp§')
					.replace(/\bitd\./gi, 'itd§')
					.replace(/\be\.g\./gi, 'e§g§')
					.replace(/\.txt\b/gi, '§TXT§')
					.replace(/\b(\d+)\.\s+(?=[a-ząćęłńóśźż])/gi, '$1§ ')

				const sentences = (protectedParagraph.match(/[^.!?]+[.!?]?/g) || [protectedParagraph])
					.map((sentence) => sentence.trim())
					.map((sentence) =>
						sentence
							.replace(/m§in§/g, 'm.in.')
							.replace(/np§/g, 'np.')
							.replace(/itp§/g, 'itp.')
							.replace(/itd§/g, 'itd.')
							.replace(/e§g§/g, 'e.g.')
							.replace(/§TXT§/g, '.txt')
							.replace(/(\d+)§\s/g, '$1. ')
					)
					.filter(Boolean)
				blocks.push({ type: 'list', items: sentences })
				i++
				continue
			}
			blocks.push({ type: 'text', text: paragraph })
			i++
		}
		return blocks
	}

	// Podstawowe sekcje dla wszystkich użytkowników
	const baseSections = [
		{
			id: 'login-session',
			title: i18n.resolvedLanguage === 'pl' ? 'Logowanie i sesja' : 'Login and Session',
			icon: '/img/auth.png',
			description: i18n.resolvedLanguage === 'pl'
				? 'Jak działa utrzymanie zalogowania'
				: 'How login session persistence works',
			path: '/dashboard',
			hideNavigateButton: true,
			content: i18n.resolvedLanguage === 'pl'
				? 'Po zalogowaniu, przy regularnym korzystaniu z aplikacji, użytkownik pozostaje zalogowany. Jeśli jednak po zalogowaniu nastąpi dłuższa przerwa i wejście dopiero np. około 8. dnia, system może poprosić o ponowne zalogowanie. Wyjątkiem są też sytuacje ze słabym lub niestabilnym połączeniem internetowym - wtedy chwilowo może wystąpić problem z rozpoznaniem sesji i wykonaniem części działań w aplikacji.'
				: 'After logging in, regular use of the application keeps the user logged in. If there is a longer break after login and the user returns only around day 8, the system may ask for login again. An exception is weak or unstable internet connection - in such cases there may be temporary issues with session recognition and performing some actions in the application.'
		},
		{
			id: 'pwa-install',
			title: i18n.resolvedLanguage === 'pl' ? 'Używaj jak aplikacji (telefon/komputer)' : 'Use it like an app (mobile/computer)',
			icon: '/img/mobile-app.png',
			description: i18n.resolvedLanguage === 'pl'
				? 'Szybciej, wygodniej i z powiadomieniami push'
				: 'Short: faster, easier, and with push notifications',
			path: '/settings',
			hideNavigateButton: true,
			content: i18n.resolvedLanguage === 'pl'
				? 'Planopię możesz dodać do ekranu głównego telefonu lub zainstalować na komputerze jak zwykłą aplikację.\n\nZalety: szybkie otwieranie, wygodna praca bez szukania karty w przeglądarce i lepsze działanie powiadomień push.\n\nJak to zrobić: na telefonie wybierz „Dodaj do ekranu głównego”, a na komputerze „Zainstaluj aplikację”.\n\nInstrukcja krok po kroku jest w naszym krótkim wpisie blogowym:'
				: 'You can add Planopia to your phone home screen or install it on your computer like a regular app.\n\nBenefits: faster opening, better daily workflow without browser tab switching, and improved push notification experience.\n\nHow to do it: on mobile choose "Add to Home Screen", and on computer choose "Install app".\n\nStep-by-step guide is in our short blog post:',
			externalLink: 'https://planopia.pl/blog/jak-zainstalowac-planopie-jako-pwa',
			externalLinkLabel: i18n.resolvedLanguage === 'pl'
				? 'Jak zainstalować Planopię jako aplikację'
				: 'How to install Planopia as an app'
		},
		{
			id: 'edit-profile',
			title: i18n.resolvedLanguage === 'pl' ? 'Edytuj profil' : 'My Profile',
			icon: '/img/user-avatar.png',
			description: i18n.resolvedLanguage === 'pl'
				? 'Zarządzanie własnymi danymi i bezpieczeństwem konta'
				: 'Managing your personal data and account security',
			path: '/edit-profile',
			content: i18n.resolvedLanguage === 'pl'
				? 'W sekcji "Edytuj profil" możesz zaktualizować swoje dane, takie jak imię i nazwisko oraz stanowisko. Możesz też sprawdzić, jakie role masz przypisane w systemie. W razie potrzeby zmienisz tutaj również swoje hasło.'
				: 'In the "My Profile" section, you can update your personal data such as first and last name and your position. You can also check which roles are assigned to your account. If needed, you can change your password here as well.',
			securityReminder: i18n.resolvedLanguage === 'pl'
				? 'Przypomnienie bezpieczeństwa: regularnie zmieniaj hasło (najlepiej co 30 dni) i używaj skomplikowanego hasła.'
				: 'Security reminder: change your password regularly (ideally every 30 days) and use a strong, complex password.'
		},
		{
			id: 'leave-request',
			title: i18n.resolvedLanguage === 'pl' ? 'Zgłoś urlop' : 'Request Leave',
			icon: '/img/sunbed.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Zgłaszanie urlopów i nieobecności'
				: 'Requesting leave and absences',
			path: '/leave-request',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W „Zgłoś urlop” wypełniasz formularz: rodzaj urlopu, daty i liczbę dni lub godzin. Po wysłaniu przełożony, HR lub Admin dostaje maila i może zatwierdzić lub odrzucić wniosek.\n\n– Status wniosku śledzisz na tej samej stronie.\n– Obok filtra roku i miesiąca jest przycisk „Statystyki” — zobaczysz podsumowanie swoich wniosków i limity urlopów; stamtąd możesz też pobrać Excel lub PDF.'
				: 'In “Request Leave”, fill in the type, dates, and number of days or hours. After submitting, your supervisor, HR, or Admin gets an email and can approve or reject.\n\n– Track status on the same page.\n– Next to the year/month filter, click “Statistics” for a summary of your requests and leave limits; you can also download Excel or PDF from there.'
		},
		{
			id: 'timesheet',
			title: i18n.resolvedLanguage === 'pl' ? 'Czas pracy' : 'Timesheet',
			icon: '/img/clock.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Wypełnianie codziennej ewidencji czasu pracy'
				: 'Filling in daily work time records',
			path: '/dashboard',
			content: i18n.resolvedLanguage === 'pl' 
				? 'Na stronie „Czas pracy” masz kalendarz miesięczny. Kliknij dzień, aby dodać lub zmienić wpis.\n\n– Prosty wpis: godziny od–do albo sama liczba godzin, plus ewentualne nadgodziny.\n– Rozbij dzień na czynności: gdy Admin lub HR dodały czynności w Ustawieniach — w formularzu zaznacz opcję i przypisz godziny do każdej czynności. Przy włączonym „Mierz wykonanie” możesz wpisać też wykonaną ilość (np. sztuki, m²).\n– Godziny do zadań z tablic: jeśli zespół ma moduł zadań — możesz przypisać godziny do wybranych zadań.\n– Filtry czynności i zadań (przy podsumowaniu miesiąca) zawężają widok kalendarza i liczone godziny.\n– Zaakceptowane urlopy i część nieobecności wpisują się do kalendarza same.'
				: 'On “Timesheet” you have a monthly calendar. Click a day to add or edit an entry.\n\n– Simple entry: start/end times or hours only, plus overtime if needed.\n– Split by activities: when Admin or HR added activities in Settings — tick the option in the form and assign hours to each activity. With “Track quantity” enabled you can also enter amount done (e.g. pieces, m²).\n– Hours to board tasks: if your team has the tasks module — assign hours to selected tasks.\n– Activity and task filters (in the monthly summary) narrow the calendar view and counted hours.\n– Approved leave and some absences appear in the calendar automatically.'
		},
		{
			id: 'timer',
			title: i18n.resolvedLanguage === 'pl' ? 'Licznik czasu pracy' : 'Work Time Counter',
			icon: '/img/timer.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Używanie licznika czasu pracy do śledzenia czasu pracy'
				: 'Using work time counter to track work time',
			path: '/dashboard',
			content: i18n.resolvedLanguage === 'pl' 
				? 'Panel licznika jest na stronie „Czas pracy” (gdy Admin włączył go w Ustawieniach).\n\n– Start ręcznie albo skan QR — wejście startuje licznik, kolejny skan kończy pracę.\n– Przy starcie możesz wybrać czynność, zadanie z tablicy albo opis pracy z bieżącego miesiąca.\n– Po zatrzymaniu sesji — przy czynności z „Mierz wykonanie” możesz uzupełnić wykonaną ilość.\n– Czas trafia do ewidencji danego dnia. Sesje widać na liście pod kalendarzem.\n– Nadgodziny i przerwy są liczone osobno w szczegółach sesji.'
				: 'The counter panel is on “Timesheet” (when Admin enabled it in Settings).\n\n– Start manually or scan QR — entry starts the counter, another scan ends work.\n– When starting you can pick an activity, a board task, or a work description from the current month.\n– After stopping — for activities with “Track quantity” you can fill in amount done.\n– Time goes to that day’s timesheet. Sessions appear in the list under the calendar.\n– Overtime and breaks are counted separately in session details.'
		},
		{
			id: 'boards',
			title: i18n.resolvedLanguage === 'pl' ? 'Tablice zadań' : 'Task Boards',
			icon: '/img/task-list.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Zarządzanie zadaniami'
				: 'Managing tasks',
			path: '/boards',
			content: i18n.resolvedLanguage === 'pl' 
				? 'Tablice służą do prowadzenia zadań w kolumnach (do zrobienia, w trakcie, zrobione). Możesz dodawać zadania, przypisywać osoby i komentarze.\n\n– Jeśli zespół ma moduł zadań, w ewidencji czasu możesz też przypisywać godziny pracy do wybranych zadań z tablicy (obok czynności).'
				: 'Boards help you manage tasks in columns (to do, in progress, done). You can add tasks, assign people, and comment.\n\n– If your team has the tasks module, in the timesheet you can also assign work hours to selected board tasks (alongside activities).'
		},
		{
			id: 'schedule',
			title: i18n.resolvedLanguage === 'pl' ? 'Grafiki' : 'Schedules',
			icon: '/img/project.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Planowanie grafików pracy'
				: 'Planning work schedules',
			path: '/schedule',
			content: i18n.resolvedLanguage === 'pl' 
				? 'Grafiki pozwalają na planowanie zmian i harmonogramów pracy. Gdy dodasz nowy dział w zespole, automatycznie tworzy się grafik dla tego działu. Możesz również tworzyć niestandardowe grafiki. W każdym grafiku możesz przypisywać pracowników do konkretnych dni i godzin pracy. Grafiki są widoczne tylko dla członków przypisanych do danego grafiku i pomagają w koordynacji pracy. Admin, HR i przełożony (z uprawnieniami) mogą zarządzać grafikami. Pracownicy widzą przypisane im zmiany w kalendarzu. W kalendarzach grafików widoczne są również zaakceptowane wnioski urlopowe, nieobecności oraz zgłoszenia nieobecności, które nie wymagają zatwierdzenia. Dodatkowo możesz zgłaszać dyspozycyjność i skorzystać z automatycznego generowania miesięcznego grafiku przez system. Na stronie grafiku dostępny jest też osobny panel AI grafiku: możesz opisać potrzeby i otrzymać propozycję szkicu miesiąca do wglądu lub zastosowania obok klasycznego auto-uzupełnienia.'
				: 'Schedules allow you to plan shifts and work schedules. When you add a new department to the team, a schedule for that department is automatically created. You can also create custom schedules. In each schedule, you can assign employees to specific days and work hours. Schedules are visible only to members assigned to the schedule and help coordinate work. Admin, HR, and supervisors (with permissions) can manage schedules. Employees see their assigned shifts in the calendar. Schedule calendars also show approved leave requests, absences, and reported absences that do not require approval. You can also submit availability and use automatic monthly schedule generation by the system. On the schedule page there is also a dedicated AI schedule panel: describe what you need and get a proposed month draft to review or apply, alongside the rule-based auto-fill.'
		},
		{
			id: 'chat',
			title: i18n.resolvedLanguage === 'pl' ? 'Czat' : 'Chat',
			icon: '/img/chat.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Komunikacja z zespołem'
				: 'Team communication',
			path: '/chat',
			content: i18n.resolvedLanguage === 'pl' 
				? 'Czat umożliwia komunikację z zespołem w czasie rzeczywistym. Kanał ogólny dla całego zespołu jest automatycznie utworzony na starcie. Gdy dodasz nowy dział w zespole, automatycznie tworzy się kanał czatu dla tego działu. Możesz również tworzyć niestandardowe czaty z dowolnymi pracownikami oraz prowadzić czaty prywatne. Możesz wysyłać wiadomości, otrzymywać powiadomienia o nowych wiadomościach (w przeglądarce i email). Wszystkie wiadomości są zapisywane i dostępne w historii.'
				: 'Chat enables real-time communication with your team. A general channel for the entire team is automatically created at the start. When you add a new department to the team, a chat channel for that department is automatically created. You can also create custom chats with any employees and have private chats. You can send messages, receive notifications about new messages (in browser and email). All messages are saved and available in history.'
		},
		{
			id: 'ai-assistant',
			title: i18n.resolvedLanguage === 'pl' ? 'AI Asystent' : 'AI Assistant',
			icon: '/img/aiasystent.png',
			description:
				i18n.resolvedLanguage === 'pl'
					? 'Pytania o czas pracy, urlopy, zadania, grafiki i zespół'
					: 'Work time, leave, tasks, schedules and team data',
			path: '/ai-assistant',
			content:
				i18n.resolvedLanguage === 'pl'
					? '– Odpowiedzi z danych Planopii na Twoim koncie (czas, urlopy, zadania, grafiki, zespół).\n– Okres u góry; Excel/PDF — przyciski z bazy pod odpowiedzią.\n– Eksport rozmowy: TXT z paska nad czatem.\n– Historia tylko w tej przeglądarce — na telefonie lub innym komputerze jej nie ma.\n– Bez zbędnych danych wrażliwych.\n– To nie porada prawna.'
					: '– Answers from Planopia data on your account (time, leave, tasks, schedules, team).\n– Pick the period above; Excel/PDF — download buttons under the reply.\n– Export chat as TXT from the toolbar.\n– History stays in this browser only — it won’t appear on your phone or another computer.\n– Avoid unnecessary sensitive data.\n– Not legal advice.'
		},
		{
			id: 'announcements',
			title: i18n.resolvedLanguage === 'pl' ? 'Komunikaty' : 'Announcements',
			icon: '/img/announcement.png',
			description: i18n.resolvedLanguage === 'pl'
				? 'Szybkie ogłoszenia dla wybranych osób lub działów'
				: 'Quick announcements for selected users or departments',
			path: '/announcements',
			content: i18n.resolvedLanguage === 'pl'
				? 'W sekcji "Komunikaty" możesz dodawać ważne informacje dla zespołu. Komunikat może być skierowany do wszystkich, konkretnego działu lub wybranych użytkowników. Możesz dodać tytuł, opis oraz załączniki. Odbiorcy dostaną powiadomienie email i push (jeśli mają je włączone).'
				: 'In the "Announcements" section, you can add important information for your team. An announcement can target everyone, a specific department, or selected users. You can add a title, description, and attachments. Recipients get email and push notifications (if enabled).'
		},
		{
			id: 'leave-planner',
			title: i18n.resolvedLanguage === 'pl' ? 'Zaplanuj swój urlop' : 'Plan your leave',
			icon: '/img/calendar.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Planowanie urlopów w kalendarzu'
				: 'Planning leave in calendar',
			path: '/leave-planner',
			content: i18n.resolvedLanguage === 'pl' 
				? 'Kalendarz do planowania urlopów. Widać Twoje wnioski i nieobecności.\n\n– Przycisk „Statystyki” obok filtra okresu pokazuje podsumowanie wniosków i wykorzystane limity urlopów.'
				: 'Calendar for planning leave. You see your requests and absences.\n\n– The “Statistics” button next to the period filter shows a summary of requests and used leave limits.'
		},
		{
			id: 'leave-plans',
			title: i18n.resolvedLanguage === 'pl' ? 'Plany urlopowe' : 'Vacation plans',
			icon: '/img/schedule.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Przeglądanie planów urlopowych wszystkich pracowników'
				: 'Viewing vacation plans of all employees',
			path: '/all-leave-plans',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W sekcji "Plany urlopowe" widoczne są plany i zaakceptowane wnioski urlopowe wszystkich pracowników w zespole. Możesz filtrować kalendarz według konkretnego pracownika lub działu, co ułatwia planowanie i koordynację urlopów w zespole. Widzisz wszystkie zatwierdzone wnioski urlopowe i nieobecności, co pomaga w zarządzaniu dostępnością pracowników i unikaniu konfliktów terminów. W tej sekcji również dostępny jest Asystent terminu urlopu, który automatycznie sprawdza wybrany termin pod kątem nieobecności i świąt.'
				: 'In the "Vacation plans" section, you can see plans and accepted leave requests of all employees in the team. You can filter the calendar by a specific employee or department, which facilitates planning and coordinating leaves in the team. You see all approved leave requests and absences, which helps manage employee availability and avoid date conflicts. This section also includes the Leave date assistant, which automatically checks the selected period for absences and holidays.'
		}
	]

	// Sekcje dla Admina i HR
	const adminHRSections = [
		{
			id: 'settings',
			title: i18n.resolvedLanguage === 'pl' ? 'Ustawienia zespołu' : 'Team Settings',
			icon: '/img/settings.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Konfiguracja ustawień zespołu'
				: 'Team settings configuration',
			path: '/settings',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W Ustawieniach konfigurujesz zespół. Najważniejsze obszary:\n\n– Godziny pracy, weekendy i święta — wpływają na ewidencję i urlopy.\n– Ewidencja czasu → Czynności: dodajesz listę czynności (np. montaż, biuro). Możesz włączyć „Mierz wykonanie” i podać jednostkę (szt., m²) — wtedy w raportach widać też wydajność.\n– Typy urlopów i limity — gdy masz moduł urlopów w planie.\n– Licznik i QR — gdy plan obejmuje timer.\n– Pracownicy bez dostępu: konto bez logowania (wlicza się w limit miejsc). Możesz włączyć wpisy ewidencji za taką osobę; wnioski urlopowe za nią — w planie płatnym.'
				: 'In Settings you configure the team. Main areas:\n\n– Work hours, weekends, holidays — affect timesheets and leave.\n– Work time records → Activities: add activities (e.g. assembly, office). Enable “Track quantity” and a unit (pcs, m²) to see efficiency in reports.\n– Leave types and limits — when your plan includes leave.\n– Timer and QR — when your plan includes the counter.\n– No-access employees: account without login (counts toward seat limit). You can enable timesheet entries on their behalf; leave requests for them — on paid plans.'
		},
		{
			id: 'create-user',
			title: i18n.resolvedLanguage === 'pl' ? 'Dodawanie użytkowników' : 'Adding Users',
			icon: '/img/add-group.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Tworzenie nowych użytkowników w zespole'
				: 'Creating new users in the team',
			path: '/create-user',
			content: i18n.resolvedLanguage === 'pl' 
				? 'Jako Admin możesz dodawać nowych użytkowników do zespołu w sekcji "Utwórz użytkownika". Podczas tworzenia użytkownika możesz przypisać mu jedną lub więcej ról: Admin (pełny dostęp), HR (dostęp do urlopów i ewidencji wszystkich), Przełożony (z konfigurowalnymi uprawnieniami), Pracownik (podstawowa rola). Możesz również przypisać użytkownika do działów i ustawić przełożonych. Hierarchia ról: Admin > HR > Przełożony > Pracownik.'
				: 'As Admin, you can add new users to the team in the "Create User" section. When creating a user, you can assign one or more roles: Admin (full access), HR (access to leaves and timesheets of all), Supervisor (with configurable permissions), Worker (basic role). You can also assign users to departments and set supervisors. Role hierarchy: Admin > HR > Supervisor > Worker.'
		},
		{
			id: 'team-management',
			title: i18n.resolvedLanguage === 'pl' ? 'Zarządzanie zespołem i rolami' : 'Team and Role Management',
			icon: '/img/contact-list.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Zarządzanie rolami, działami i logami użytkowników'
				: 'Managing roles, departments and user logs',
			path: '/team-management',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W sekcji "Zarządzanie zespołem" możesz zarządzać rolami i działami. Możesz edytować role i działy użytkowników, konfigurować uprawnienia przełożonych, przeglądać opisy ról (Admin, HR, Przełożony, Pracownik) oraz przeglądać logi aktywności użytkowników. Admin ma zawsze pełny dostęp, niezależnie od konfiguracji. W tej sekcji znajdziesz również szczegółowe informacje o hierarchii ról i uprawnieniach.'
				: 'In the "Team Management" section, you can manage roles and departments. You can edit user roles and departments, configure supervisor permissions, review role descriptions (Admin, HR, Supervisor, Worker), and view user activity logs. Admin always has full access, regardless of configuration. This section also contains detailed information about role hierarchy and permissions.'
		},
		{
			id: 'timesheets-admin',
			title: i18n.resolvedLanguage === 'pl' ? 'Ewidencja czasu pracy (Admin/HR/Przełożony)' : 'Timesheets (Admin/HR/Supervisor)',
			icon: '/img/schedule time works.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Przeglądanie ewidencji czasu pracy pracowników'
				: 'Reviewing employee timesheets',
			path: '/calendars-list',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W „Ewidencji czasu pracy” widzisz kalendarze pracowników (Admin i HR — cały zespół; przełożony — według uprawnień).\n\n– Wybierz miesiąc, dział lub osobę. Kliknij pracownika, aby zobaczyć szczegóły miesiąca.\n– Filtry czynności i zadań zawężają dane i podsumowania (godziny wg czynności lub zadań).\n– Możesz edytować wpisy pracownika w jego kalendarzu.\n– Eksporty Excel i PDF — opis w sekcji „Raporty i eksporty”.'
				: 'In “Work time records” you see employee calendars (Admin and HR — whole team; supervisor — per permissions).\n\n– Pick month, department, or person. Click an employee for month details.\n– Activity and task filters narrow data and summaries (hours by activity or task).\n– You can edit entries in the employee calendar.\n– Excel and PDF exports — see the “Reports and exports” section.'
		},
		{
			id: 'leave-approval',
			title: i18n.resolvedLanguage === 'pl' ? 'Zatwierdzanie urlopów (Admin/HR/Przełożony)' : 'Leave Approval (Admin/HR/Supervisor)',
			icon: '/img/trip.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Zarządzanie wnioskami urlopowymi'
				: 'Managing leave requests',
			path: '/leave-list',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W „Wnioskach urlopowych” (menu boczne) przeglądasz wnioski zespołu, zatwierdzasz lub odrzucasz.\n\n– Filtruj okres, dział, pracownika i status.\n– Przycisk „Statystyki” obok filtra — podsumowanie wniosków, limity, typy urlopów; stamtąd Excel/PDF dla wybranych danych.\n– Na dole strony: przyciski Excel i PDF — raport urlopów całego zespołu za wybrany okres.\n– Przy jednym pracowniku (lista wniosków) też jest „Statystyki”.'
				: 'In “Leave requests” (sidebar) you review team requests and approve or reject.\n\n– Filter period, department, employee, and status.\n– “Statistics” next to the filter — summary, limits, leave types; Excel/PDF from there.\n– At the bottom: Excel and PDF — team leave report for the selected period.\n– For one employee’s list there is also “Statistics”.'
		},
		...(canSeePackagesTutorial
			? [
					{
						id: 'packages-billing-legal',
						title:
							i18n.resolvedLanguage === 'pl'
								? 'Pakiety, rozliczenia i dokumenty prawne'
								: 'Packages, billing & legal documents',
						icon: '/img/wallet.png',
						description:
							i18n.resolvedLanguage === 'pl'
								? 'Core, Pro, Business, limity AI i dokumenty prawne'
								: 'Core, Pro, Business, AI limits and legal documents',
						path: '/packages',
						content:
							i18n.resolvedLanguage === 'pl'
								? '– Menu boczne → „Pakiety i rozliczenia” (ikona portfela).\n– U góry: aktualny plan zespołu i wykorzystanie limitu Asystenta AI (czat, grafik, drafty).\n– Plany: Core (konfiguracja — wielkość zespołu i moduły), gotowe pakiety Pro i Business.\n– Przełącz rozliczenie miesięczne/roczne, potem wybierz plan lub dokup wiadomości AI.\n– Płatność online: cykliczna subskrypcja kartą (Stripe) lub BLIK/przelew (Przelewy24) — w zależności od planu i dostępności; przy Stripe możesz też zarządzać kartą na tej stronie.\n– Gdy płatność online nie jest dostępna — formularz zgłoszenia mailem.\n– Dokupy wiadomości AI — przy aktywnej płatnej subskrypcji.\n– Na dole: dokumenty prawne (regulamin, polityka prywatności, DPA); przy nowej wersji — ostrzeżenie i akceptacja jednym przyciskiem.'
								: '– Sidebar → “Packages & billing” (wallet icon).\n– At the top: current team plan and shared AI Assistant usage (chat, schedule, drafts).\n– Plans: Core (configure team size and modules), ready-made Pro and Business bundles.\n– Switch monthly/yearly billing, then pick a plan or buy extra AI messages.\n– Online payment: recurring card subscription (Stripe) or BLIK/bank transfer (Przelewy24) — depending on the plan and what is enabled; with Stripe you can manage your card on this page.\n– If online payment is unavailable — email request form.\n– Extra AI message packs — with an active paid subscription.\n– At the bottom: legal documents (terms, privacy, DPA); when a new version is required — warning and accept all in one step.',
					},
				]
			: []),
		...(canSeeManagerReports
			? [
					{
						id: 'reports-exports',
						title: i18n.resolvedLanguage === 'pl' ? 'Raporty i eksporty' : 'Reports and exports',
						icon: '/img/schedule time works.png',
						description: i18n.resolvedLanguage === 'pl'
							? 'Excel i PDF — gdzie je znaleźć'
							: 'Excel and PDF — where to find them',
						path: '/calendars-list',
						hideNavigateButton: true,
						content: i18n.resolvedLanguage === 'pl'
							? 'Raporty nie mają osobnej strony — pobierasz je przyciskami w aplikacji.\n\nEwidencja czasu pracy (menu boczne):\n– Przewiń na dół listy kalendarzy.\n– Excel / PDF — raport zespołu (godziny, nadgodziny, urlopy w okresie).\n– Excel / PDF wg osób — zestawienie per pracownik.\n– Raport zadań i czynności — gdy są dane i filtry czynności lub zadań (godziny, ilości, wydajność).\n– Kalendarz jednej osoby → u góry PDF z podsumowaniem miesiąca.\n\nWnioski urlopowe (Admin, HR, przełożony z uprawnieniem):\n– Przewiń na dół strony.\n– Excel / PDF — raport urlopów zespołu (statusy, typy, podsumowania).\n– Przycisk „Statystyki” obok filtra roku — szybki podgląd; stamtąd też Excel/PDF.\n\nW planie darmowym: eksporty ewidencji działają; pełne wnioski urlopowe i ich raporty — po rozszerzeniu planu.'
							: 'Reports have no separate page — download them with buttons in the app.\n\nWork time records (sidebar):\n– Scroll to the bottom of the calendar list.\n– Excel / PDF — team report (hours, overtime, leave in the period).\n– Excel / PDF by person — per employee.\n– Tasks and activities report — when data and activity/task filters exist (hours, quantities, efficiency).\n– One person’s calendar → PDF at the top with monthly summary.\n\nLeave requests (Admin, HR, approving supervisor):\n– Scroll to the bottom.\n– Excel / PDF — team leave report (statuses, types, summaries).\n– “Statistics” next to the year filter — quick view; Excel/PDF from there too.\n\nOn the free plan: timesheet exports work; full leave requests and their reports — after upgrading.',
					},
				]
			: []),
		{
			id: 'help-center',
			title: i18n.resolvedLanguage === 'pl' ? 'Centrum pomocy' : 'Help Center',
			icon: '/img/technical-support.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Zgłaszanie problemów i kontakt z obsługą'
				: 'Reporting issues and contacting support',
			path: '/helpcenter',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W sekcji "Centrum pomocy" możesz zgłaszać problemy z działaniem aplikacji, proponować usprawnienia lub poprosić o kontakt w sprawie zakupu lub przedłużenia pakietu. Tworzysz zgłoszenie, opisujesz problem lub potrzebę, możesz dołączyć załączniki (np. zrzuty ekranu). Wszystkie Twoje zgłoszenia są widoczne w liście "Twoje zgłoszenia" – możesz śledzić ich status (otwarte/zamknięte) i historię odpowiedzi zespołu wsparcia.'
				: 'In the "Help Center" section, you can report issues with the application, suggest improvements, or request contact regarding purchasing or extending a subscription. You create a ticket, describe the issue or need, and can attach files (e.g., screenshots). All your tickets are visible in the "Your tickets" list – you can track their status (open/closed) and the response history from the support team.'
		}
	]

	// Sekcja ustawień dla pozostałych użytkowników (bez Admin/HR)
	const nonAdminHRSections = [
		{
			id: 'settings-personal',
			title: i18n.resolvedLanguage === 'pl' ? 'Ustawienia' : 'Settings',
			icon: '/img/settings.png',
			description: i18n.resolvedLanguage === 'pl'
				? 'Personalizacja ustawień użytkownika'
				: 'Personalizing user settings',
			path: '/settings',
			content: i18n.resolvedLanguage === 'pl'
				? 'W sekcji "Ustawienia" możesz personalizować własne preferencje. Na ten moment szczególnie ważne są ustawienia powiadomień push - możesz zdecydować, które typy powiadomień chcesz otrzymywać w przeglądarce, a które wyłączyć.'
				: 'In the "Settings" section, you can personalize your own preferences. At the moment, push notification settings are especially important - you can decide which notification types you want to receive in your browser and which ones to disable.'
		}
	]

	const pl = i18n.resolvedLanguage === 'pl'
	const FREEMIUM_OMIT_BASE_IDS = new Set([
		'leave-request',
		'timer',
		'boards',
		'schedule',
		'chat',
		'ai-assistant',
		'announcements',
		'leave-planner',
		'leave-plans',
	])

	const supervisorManagerSectionIds = []
	if (supervisorCanViewTimesheets) supervisorManagerSectionIds.push('timesheets-admin')
	if (supervisorCanApproveLeaves) supervisorManagerSectionIds.push('leave-approval')
	if (canSeeManagerReports) supervisorManagerSectionIds.push('reports-exports')
	const supervisorManagerSections = adminHRSections.filter((s) =>
		supervisorManagerSectionIds.includes(s.id)
	)

	let sections
	if (freemiumTier) {
		const overview = {
			id: 'freemium-overview',
			title: pl ? 'Plan darmowy (freemium)' : 'Free plan (freemium)',
			icon: '/img/info.png',
			description: pl
				? 'Co jest dostępne w uproszczonej wersji aplikacji'
				: 'What is available in the simplified app experience',
			path: '/dashboard',
			hideNavigateButton: true,
			content: pl
				? [
						'Twój zespół korzysta z planu darmowego (freemium).',
						'W menu jest węższy zestaw funkcji niż w pełnej subskrypcji — m.in. ewidencja czasu pracy („Czas pracy”, wpisy ręczne) oraz edycja profilu.',
						'Dla Administratora i HR są dodatkowo: lista kalendarzy ewidencji, ustawienia świąt i weekendów, zarządzanie zespołem oraz „Pakiety i rozliczenia”.',
						freemiumSeatBlocked
							? 'Gdy przekroczony zostanie limit liczby kont, część ekranów może być ograniczona do czasu dopasowania zespołu do limitu lub wykupienia planu — zgodnie z komunikatami w aplikacji.'
							: null,
						'Moduły takie jak grafiki, wnioski urlopowe, tablice, czat, asystent AI czy komunikaty oraz szersze ustawienia zespołu są dostępne po rozszerzeniu planu (Administrator lub HR → Pakiety i rozliczenia).',
				  ]
						.filter(Boolean)
						.join('\n\n')
				: [
						'Your team is on the free (freemium) plan.',
						'The menu shows a smaller feature set than the full subscription — including the timesheet (“Timesheet”, manual entries) and profile editing.',
						'Admin and HR also have: team calendars, holiday & weekend settings, team management, and “Packages & billing”.',
						freemiumSeatBlocked
							? 'If active accounts exceed the free limit, some screens may stay limited until the team is adjusted or you upgrade — follow the in-app notices.'
							: null,
						'Schedules, leave requests, boards, chat, AI assistant, announcements, and broader team settings unlock after upgrading (Admin or HR → Packages & billing).',
				  ]
						.filter(Boolean)
						.join('\n\n'),
		}

		const baseFiltered = baseSections
			.filter((s) => !FREEMIUM_OMIT_BASE_IDS.has(s.id))
			.map((s) => {
				if (s.id !== 'timesheet') return s
				return {
					...s,
					description: pl
						? 'Kalendarz miesięczny — wpisy ręczne (w tym planie bez licznika i QR)'
						: 'Monthly calendar — manual entries (no counter/QR on this plan)',
					content: pl
						? 'W planie darmowym uzupełniasz ewidencję w kalendarzu miesięcznym na stronie „Czas pracy”: godziny od–do lub liczba godzin oraz ewentualne nadgodziny. Gdy Administrator dodał czynności w Ustawieniach — możesz rozbijać dzień na czynności. Licznika czasu i skanowania QR w tym planie nie ma — wracają po rozszerzeniu planu.'
						: 'On the free plan you use the monthly calendar under “Timesheet”: start/end times or hours, plus overtime when needed. If Admin added activities in Settings — you can split a day by activity. No work-time counter or QR on this plan — those unlock after upgrading.',
				}
			})

		if (isAdmin || isHR) {
			const adminFreemium = adminHRSections
				.filter((s) => s.id !== 'leave-approval' && (isAdmin || s.id !== 'help-center'))
				.map((s) => {
					if (s.id === 'settings') {
						return {
							...s,
							description: pl
								? 'W freemium: weekendy, święta, godziny pracy i pracownicy bez dostępu'
								: 'On freemium: weekends, holidays, work hours, no-access workers',
							content: pl
								? 'W planie darmowym Administrator i HR mogą zmieniać: pracę w weekendy, dni świąteczne, standardowe godziny pracy (szybki wybór w ewidencji), czynności w ewidencji (Ustawienia → Ewidencja czasu → Czynności) oraz pracowników bez dostępu do aplikacji. Typy urlopów, QR, licznik i pełny grafik — po rozszerzeniu planu.\n\nPracownicy bez dostępu: włącz dodawanie kont i wpisy czasu pracy za nich w kalendarzu ewidencji. Wnioski urlopowe za takiego pracownika — w planie płatnym.'
								: 'On the free plan, Admin and HR can configure: weekend work, holidays, standard work hours (quick picks in the timesheet), timesheet activities (Settings → Work time records → Activities), and employees without app access. Leave types, QR, timer, and full schedules unlock after upgrading.\n\nNo-access workers: enable adding accounts and timesheet entries on their behalf. Leave requests for them — on paid plans.',
						}
					}
					if (s.id === 'create-user' && isAdmin) {
						const extra = pl
							? '\n\nW planie darmowym obowiązuje limit liczby aktywnych kont — przed dodaniem osoby sprawdź „Pakiety i rozliczenia” oraz komunikaty w aplikacji.'
							: '\n\nThe free plan limits active accounts — check “Packages & billing” and in-app notices before adding users.'
						return { ...s, content: s.content + extra }
					}
					return s
				})
			sections = [overview, ...baseFiltered, ...adminFreemium]
		} else if (isSupervisor && supervisorManagerSections.length > 0) {
			sections = [overview, ...baseFiltered, ...supervisorManagerSections]
		} else {
			sections = [overview, ...baseFiltered]
		}
	} else {
		sections = [
			...baseSections,
			...(isAdmin || isHR
				? adminHRSections.filter((s) => isAdmin || s.id !== 'help-center')
				: isSupervisor && supervisorManagerSections.length > 0
					? [...nonAdminHRSections, ...supervisorManagerSections]
					: nonAdminHRSections),
		]
	}

	// Podziel sekcje na kolumny (maksymalnie 2 kolumny na desktop, 1 na mobile)
	const columns = useMemo(() => {
		const numColumns = isMobile ? 1 : 2
		const cols = Array(numColumns).fill(null).map(() => [])
		
		// Rozdziel sekcje równomiernie między kolumny
		sections.forEach((section, index) => {
			cols[index % numColumns].push(section)
		})
		
		return cols
	}, [sections, isMobile])

	const handleClose = () => {
		if (showOnFirstView) {
			dismissFirstViewTutorial()
		} else {
			onClose()
		}
	}

	const handleNavigateToSection = (path) => {
		if (showOnFirstView) {
			dismissFirstViewTutorial()
		} else {
			onClose()
		}
		setTimeout(() => {
			navigate(path)
		}, 100)
	}

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={handleClose}
			shouldCloseOnOverlayClick
			shouldCloseOnEsc
			closeTimeoutMS={0}
			overlayClassName="tutorial-modal-overlay"
			className="tutorial-modal-content"
			style={{
				overlay: { zIndex: 100000010 },
				content: { zIndex: 100000011 },
			}}
			contentLabel={i18n.resolvedLanguage === 'pl' ? 'Jak korzystać z aplikacji' : 'How to use the app'}
		>
			<button
				type="button"
				onClick={handleClose}
				aria-label={i18n.resolvedLanguage === 'pl' ? 'Zamknij samouczek' : 'Close tutorial'}
				style={{
					position: 'absolute',
					top: '8px',
					right: '8px',
					background: 'transparent',
					border: 'none',
					fontSize: '32px',
					cursor: 'pointer',
					color: '#7f8c8d',
					lineHeight: '1',
					padding: '6px',
					minWidth: '44px',
					minHeight: '44px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					borderRadius: '50%',
					transition: 'all 0.2s',
					zIndex: 2,
					touchAction: 'manipulation',
				}}
				onMouseEnter={(e) => {
					e.target.style.color = '#2c3e50'
					e.target.style.backgroundColor = '#f3f4f6'
				}}
				onMouseLeave={(e) => {
					e.target.style.color = '#7f8c8d'
					e.target.style.backgroundColor = 'transparent'
				}}>
				×
			</button>
			{/* Header */}
			<div className="tutorial-modal-header">
				<div>
					<h2 className="tutorial-modal-title">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<path d="M12 16v-4M12 8h.01"></path>
						</svg>
						{i18n.resolvedLanguage === 'pl' ? 'Jak korzystać z aplikacji?' : 'How to use the app?'}
					</h2>
					<p className="tutorial-modal-subtitle">
						{freemiumTier
							? (i18n.resolvedLanguage === 'pl'
								? 'Instrukcja dostosowana do planu darmowego — tylko to, co masz w menu'
								: 'Guidance for the free plan — only what you have in the sidebar')
							: (i18n.resolvedLanguage === 'pl'
								? 'Poznaj główne funkcje aplikacji i dowiedz się, jak z nich korzystać'
								: 'Learn about the main features of the app and how to use them')
						}
					</p>
					<a
						className="tutorial-modal-video-link"
						href={
							i18n.resolvedLanguage === 'pl'
								? 'https://planopia.pl/blog/instrukcja-wideo-planopia'
								: 'https://planopia.pl/en/blog/video-tutorials'
						}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={
							i18n.resolvedLanguage === 'pl'
								? 'Materiały wideo — otwiera się w nowej karcie'
								: 'Video tutorials — opens in a new tab'
						}
					>
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden
							style={{ flexShrink: 0 }}
						>
							<circle cx="12" cy="12" r="10" />
							<polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
						</svg>
						<span>
							{i18n.resolvedLanguage === 'pl'
								? 'Materiały wideo — krótkie nagrania z aplikacji'
								: 'Video tutorials — short clips from the app'}
						</span>
						<span className="tutorial-modal-video-link__arrow" aria-hidden>
							↗
						</span>
					</a>
				</div>
			</div>

			{/* Sections Grid */}
			<div className="tutorial-modal-sections">
				{columns.map((columnSections, columnIndex) => (
					<div
						key={columnIndex}
						className="tutorial-modal-sections__column"
					>
						{columnSections.map((section) => (
							<div
								key={section.id}
								className="tutorial-modal-section"
								onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
								style={{
									border: '2px solid',
									borderColor: activeSection === section.id ? '#00a846' : '#e5e7eb',
									borderRadius: '12px',
									cursor: 'pointer',
									transition: 'all 0.3s ease',
									backgroundColor: activeSection === section.id ? '#f0fdf4' : 'white',
									boxShadow: activeSection === section.id 
										? '0 4px 12px rgba(0, 168, 70, 0.18)' 
										: '0 2px 4px rgba(0, 0, 0, 0.05)'
								}}
						onMouseEnter={(e) => {
							if (activeSection !== section.id) {
								e.currentTarget.style.borderColor = '#cbd5e1'
								e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
							}
						}}
						onMouseLeave={(e) => {
							if (activeSection !== section.id) {
								e.currentTarget.style.borderColor = '#e5e7eb'
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
							}
						}}
					>
						<div className="tutorial-modal-section__head">
							<div className="tutorial-modal-section__icon" style={{
								backgroundColor: activeSection === section.id ? '#00a846' : '#f3f4f6',
							}}>
								<img 
									src={section.icon} 
									alt={section.title}
									style={{
										filter: activeSection === section.id ? 'brightness(0) invert(1)' : 'none'
									}}
								/>
							</div>
							<div className="tutorial-modal-section__text">
								<h3 className="tutorial-modal-section__title">
									{section.title}
								</h3>
								<p className="tutorial-modal-section__desc">
									{section.description}
								</p>
							</div>
							<svg 
								className="tutorial-modal-section__chevron"
								width="20" 
								height="20" 
								viewBox="0 0 24 24" 
								fill="none" 
								stroke="currentColor" 
								strokeWidth="2"
								style={{
									color: activeSection === section.id ? '#00a846' : '#9ca3af',
									transform: activeSection === section.id ? 'rotate(180deg)' : 'rotate(0deg)',
									transition: 'transform 0.3s ease',
									flexShrink: 0,
									marginTop: '4px'
								}}
							>
								<polyline points="6 9 12 15 18 9"></polyline>
							</svg>
						</div>
						
						{activeSection === section.id && (
							<div className="tutorial-modal-section__details">
								<div style={{ marginBottom: '16px' }}>
									{formatTutorialContent(section.content).map((block, blockIndex) => (
										block.type === 'list' ? (
											<ul
												key={`${section.id}-list-${blockIndex}`}
												style={{
													margin: blockIndex === 0 ? '0 0 12px 0' : '6px 0 12px 0',
													padding: 0,
													listStyle: 'none'
												}}
											>
												{block.items.map((item, itemIndex) => (
													<li
														key={`${section.id}-list-item-${blockIndex}-${itemIndex}`}
														style={{
															display: 'flex',
															alignItems: 'flex-start',
															gap: '8px',
															color: '#374151',
															fontSize: '15px',
															lineHeight: '1.7',
															marginBottom: '6px'
														}}
													>
														<span style={{ color: '#4b5563', fontWeight: '600', flexShrink: 0 }}>–</span>
														<span style={{ minWidth: 0, flex: 1, overflowWrap: 'anywhere' }}>{item}</span>
													</li>
												))}
											</ul>
										) : (
											<p
												key={`${section.id}-text-${blockIndex}`}
												style={{
													margin: blockIndex === 0 ? '0 0 12px 0' : '6px 0 12px 0',
													color: '#374151',
													fontSize: '15px',
													lineHeight: '1.7'
												}}
											>
												{block.text}
											</p>
										)
									))}
								</div>
								{section.externalLink && (
									<a
										href={section.externalLink}
										target="_blank"
										rel="noopener noreferrer"
										onClick={(e) => e.stopPropagation()}
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '6px',
											marginBottom: '16px',
											color: '#2563eb',
											textDecoration: 'underline',
											fontWeight: '600',
											fontSize: '14px'
										}}
									>
										{section.externalLinkLabel || section.externalLink}
										<span aria-hidden="true">→</span>
									</a>
								)}
								{section.securityReminder && (
									<div style={{
										marginBottom: '16px',
										padding: '10px 12px',
										borderRadius: '8px',
										backgroundColor: '#fff7ed',
										border: '1px solid #fdba74',
										color: '#9a3412',
										fontSize: '14px',
										lineHeight: '1.5',
										fontWeight: '500'
									}}>
										{section.securityReminder}
									</div>
								)}
								{!section.hideNavigateButton && (
									<button
										type="button"
										className="tutorial-modal-nav-btn"
										onClick={(e) => {
											e.stopPropagation()
											handleNavigateToSection(section.path)
										}}
									>
										{i18n.resolvedLanguage === 'pl' ? 'Przejdź do sekcji' : 'Go to section'}
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path d="M5 12h14M12 5l7 7-7 7"></path>
										</svg>
									</button>
								)}
							</div>
						)}
					</div>
						))}
					</div>
				))}
			</div>

			{/* Footer */}
			{showOnFirstView && (
				<div className="tutorial-modal-footer">
					<button
						type="button"
						className="tutorial-modal-footer-btn"
						onClick={dismissFirstViewTutorial}
					>
						{i18n.resolvedLanguage === 'pl' ? 'Rozumiem, przejdź dalej' : 'Got it, continue'}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<polyline points="9 18 15 12 9 6"></polyline>
						</svg>
					</button>
				</div>
			)}

			<style>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(-10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</Modal>
	)
}

export default TutorialModal
