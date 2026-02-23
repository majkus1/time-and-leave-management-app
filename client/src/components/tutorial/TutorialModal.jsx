import React, { useState, useMemo, useEffect } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../../config'
import { useAuth } from '../../context/AuthContext'

function TutorialModal({ isOpen, onClose, showOnFirstView = false }) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const { refreshUserData, role } = useAuth()
	const [activeSection, setActiveSection] = useState(null)
	const [isMarkingAsSeen, setIsMarkingAsSeen] = useState(false)
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768)
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])
	
	// Sprawdź role użytkownika
	const isAdmin = role && role.includes('Admin')
	const isHR = role && role.includes('HR')
	const isSupervisor = role && role.includes('Przełożony (Supervisor)')

	// Podstawowe sekcje dla wszystkich użytkowników
	const baseSections = [
		{
			id: 'leave-request',
			title: i18n.resolvedLanguage === 'pl' ? 'Zgłoś urlop' : 'Request Leave',
			icon: '/img/sunbed.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Zgłaszanie urlopów i nieobecności'
				: 'Requesting leave and absences',
			path: '/leave-request',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W sekcji "Zgłoś urlop" wypełnij formularz: wybierz rodzaj urlopu (wypoczynkowy, okolicznościowy, na żądanie, bezpłatny, zwolnienie lekarskie L4, inna nieobecność lub inny), podaj daty rozpoczęcia i zakończenia oraz liczbę dni lub godzin. Po wysłaniu zgłoszenia, przełożony, HR lub Admin otrzyma powiadomienie email i będzie mógł zatwierdzić lub odrzucić wniosek. Status wniosku możesz śledzić w sekcji "Zgłoś urlop".'
				: 'In the "Request Leave" section, fill out the form: select the type of leave (vacation, occasional, on demand, unpaid, sick leave L4, other absence, or other), provide start and end dates, and the number of days or hours. After submitting, your supervisor, HR, or Admin will receive an email notification and can approve or reject the request. You can track the request status in the "Request Leave" section.'
		},
		{
			id: 'timesheet',
			title: i18n.resolvedLanguage === 'pl' ? 'Ewidencja czasu pracy' : 'Timesheet',
			icon: '/img/schedule time works.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Wypełnianie codziennej ewidencji czasu pracy'
				: 'Filling in daily work time records',
			path: '/dashboard',
			content: i18n.resolvedLanguage === 'pl' 
				? 'Na głównym ekranie znajdziesz kalendarz miesięczny. Kliknij na wybrany dzień, aby dodać wpis czasu pracy. W formularzu wprowadź godzinę rozpoczęcia i zakończenia pracy lub liczbę godzin pracy oraz ewentualne nadgodziny. Wszystkie wpisy są automatycznie zapisywane. Ewidencję możesz przeglądać w widoku miesięcznym. Zaakceptowane wnioski urlopowe oraz nieobecności zgłoszone, które nie wymagają zatwierdzenia, są automatycznie dodawane do kalendarza ewidencji czasu pracy i odnotowane w podsumowaniu. Jeśli w polu nieobecność wpiszesz słowo "urlop", jest to zliczane do podsumowania miesiąca i liczone jako urlop w dniach lub godzinach w zależności od ustawień skonfigurowanych dla zespołu.'
				: 'On the main screen, you will find a monthly calendar. Click on a selected day to add a work time entry. In the form, enter start and end times or the number of work hours, and any overtime. All entries are automatically saved. You can view your timesheet in monthly view. Approved leave requests and reported absences that do not require approval are automatically added to the timesheet calendar and noted in the summary. If you enter the word "urlop" (leave) in the absence field, it is counted in the monthly summary and calculated as leave in days or hours depending on the settings configured for the team.'
		},
		{
			id: 'timer',
			title: i18n.resolvedLanguage === 'pl' ? 'Licznik czasu pracy' : 'Work Time Counter',
			icon: '/img/clock.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Używanie licznika czasu pracy do śledzenia czasu pracy'
				: 'Using work time counter to track work time',
			path: '/dashboard',
			content: i18n.resolvedLanguage === 'pl' 
				? 'Na głównym ekranie znajdziesz panel licznika czasu pracy (jeśli jest włączony w ustawieniach). Możesz uruchomić licznik na dwa sposoby: 1) Kliknij "Start" w panelu licznika, aby rozpocząć sesję pracy ręcznie. 2) Zeskanuj kod QR w miejscu pracy - jeśli nie masz aktywnego licznika, skanowanie automatycznie zarejestruje wejście i uruchomi licznik. Jeśli masz aktywny licznik, skanowanie QR zarejestruje wyjście i zatrzyma licznik. Licznik automatycznie śledzi czas pracy w czasie rzeczywistym.\n\nWażne: czas pracy liczy się od startu do stopu - nawet podczas przerwy licznik dalej liczy czas. Przerwy są śledzone osobno i widoczne w szczegółach sesji po zatrzymaniu. Możesz również oznaczyć czas jako nadgodziny - są one liczone osobno i widoczne w szczegółach. Po zakończeniu pracy kliknij "Stop" lub zeskanuj QR ponownie - czas zostanie automatycznie dodany do ewidencji czasu pracy dla aktualnego dnia. Wszystkie sesje są zapisywane i możesz je przeglądać w historii sesji, gdzie widoczne są: całkowity czas pracy, czas przerwy i czas nadgodzin.'
				: 'On the main screen, you will find the work time counter panel (if enabled in settings). You can start the counter in two ways: 1) Click "Start" in the counter panel to manually begin a work session. 2) Scan the QR code at your workplace - if you don\'t have an active counter, scanning will automatically register entry and start the counter. If you have an active counter, scanning the QR will register exit and stop the counter. The counter automatically tracks work time in real-time.\n\nImportant: work time is counted from start to stop - the counter continues counting even during breaks. Breaks are tracked separately and visible in session details after stopping. You can also mark time as overtime - it is counted separately and visible in details. After finishing work, click "Stop" or scan the QR again - the time will be automatically added to your timesheet for the current day. All sessions are saved and you can view them in the session history, where you can see: total work time, break time, and overtime.'
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
				? 'Tablice zadań umożliwiają zarządzanie projektami i zadaniami. Tablica dla całego zespołu jest automatycznie utworzona na starcie z wszystkimi użytkownikami. Gdy dodasz nowy dział w zespole, automatycznie tworzy się tablica dla tego działu. Możesz również tworzyć niestandardowe tablice. W każdej tablicy możesz dodawać zadania i przypisywać je do członków zespołu. Zadania można przenosić między kolumnami (np. "Do zrobienia", "W trakcie", "Zrobione") poprzez przeciąganie. Do każdego zadania możesz dodać opis, komentarze i załączniki. Tablica zespołowa jest widoczna dla wszystkich członków zespołu, tablice działowe dla wszystkich członków przypisanych do danego działu, a niestandardowe tablice dla wybranych członków zespołu.'
				: 'Task boards allow you to manage projects and tasks. A board for the entire team is automatically created at the start with all users. When you add a new department to the team, a board for that department is automatically created. You can also create custom boards. In each board, you can add tasks and assign them to team members. Tasks can be moved between columns (e.g., "To Do", "In Progress", "Done") by dragging. You can add descriptions, comments, and attachments to each task. The team board is visible to all team members, department boards to all members assigned to the department, and custom boards to selected team members.'
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
				? 'Grafiki pozwalają na planowanie zmian i harmonogramów pracy. Gdy dodasz nowy dział w zespole, automatycznie tworzy się grafik dla tego działu. Możesz również tworzyć niestandardowe grafiki. W każdym grafiku możesz przypisywać pracowników do konkretnych dni i godzin pracy. Grafiki są widoczne tylko dla członków przypisanych do danego grafiku i pomagają w koordynacji pracy. Admin, HR i przełożony (z uprawnieniami) mogą zarządzać grafikami. Pracownicy widzą przypisane im zmiany w kalendarzu. W kalendarzach grafików widoczne są również zaakceptowane wnioski urlopowe, nieobecności oraz zgłoszenia nieobecności, które nie wymagają zatwierdzenia.'
				: 'Schedules allow you to plan shifts and work schedules. When you add a new department to the team, a schedule for that department is automatically created. You can also create custom schedules. In each schedule, you can assign employees to specific days and work hours. Schedules are visible only to members assigned to the schedule and help coordinate work. Admin, HR, and supervisors (with permissions) can manage schedules. Employees see their assigned shifts in the calendar. Schedule calendars also show approved leave requests, absences, and reported absences that do not require approval.'
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
			id: 'leave-planner',
			title: i18n.resolvedLanguage === 'pl' ? 'Zaplanuj swój urlop' : 'Plan your leave',
			icon: '/img/sunbed.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Planowanie urlopów w kalendarzu'
				: 'Planning leave in calendar',
			path: '/leave-planner',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W sekcji "Zaplanuj swój urlop" znajdziesz kalendarz, w którym możesz zaznaczać dni, w których planujesz wziąć urlop. W kalendarzu widoczne są również wszystkie Twoje zatwierdzone i zgłoszone wnioski urlopowe oraz nieobecności. Możesz przeglądać zaakceptowane wnioski urlopowe i planować kolejne urlopy, unikając konfliktów terminów. Zaznaczone dni są widoczne w sekcji "Plany urlopowe" dla całego zespołu, co pomaga w koordynacji urlopów.'
				: 'In the "Plan your leave" section, you will find a calendar where you can mark days when you plan to take leave. The calendar also shows all your approved and submitted leave requests and absences. You can review accepted leave requests and plan future leaves, avoiding date conflicts. Marked days are visible in the "Vacation plans" section for the entire team, which helps coordinate leaves.'
		},
		{
			id: 'leave-plans',
			title: i18n.resolvedLanguage === 'pl' ? 'Plany urlopowe' : 'Vacation plans',
			icon: '/img/trip.png',
			description: i18n.resolvedLanguage === 'pl' 
				? 'Przeglądanie planów urlopowych wszystkich pracowników'
				: 'Viewing vacation plans of all employees',
			path: '/all-leave-plans',
			content: i18n.resolvedLanguage === 'pl' 
				? 'W sekcji "Plany urlopowe" widoczne są plany i zaakceptowane wnioski urlopowe wszystkich pracowników w zespole. Możesz filtrować kalendarz według konkretnego pracownika lub działu, co ułatwia planowanie i koordynację urlopów w zespole. Widzisz wszystkie zatwierdzone wnioski urlopowe i nieobecności, co pomaga w zarządzaniu dostępnością pracowników i unikaniu konfliktów terminów.'
				: 'In the "Vacation plans" section, you can see plans and accepted leave requests of all employees in the team. You can filter the calendar by a specific employee or department, which facilitates planning and coordinating leaves in the team. You see all approved leave requests and absences, which helps manage employee availability and avoid date conflicts.'
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
				? 'W sekcji Ustawienia możesz skonfigurować wszystkie parametry zespołu: godziny pracy (standardowe godziny, dni tygodnia), święta i dni wolne, typy urlopów (z możliwością dodania własnych typów), limity urlopów dla poszczególnych typów, włączenie/wyłączenie licznika czasu pracy. Powiadomienia push i email każdy użytkownik konfiguruje indywidualnie w swoich ustawieniach profilu.'
				: 'In the Settings section, you can configure all team parameters: working hours (standard hours, weekdays), holidays and days off, leave types (with the ability to add custom types), leave limits for specific types, enable/disable work time counter. Push and email notifications are configured individually by each user in their profile settings.'
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
				? 'W sekcji "Ewidencja czasu pracy" Admin i HR widzą ewidencje wszystkich pracowników w zespole. Przełożony (Supervisor) z odpowiednimi uprawnieniami może przeglądać ewidencje pracowników ze swojego działu lub wybranych pracowników. Uprawnienia przełożonego konfiguruje się w sekcji zarządzania zespołem - przy edycji użytkownika i jego ról, jeśli użytkownik ma rolę Przełożony, można tam ustawić jego uprawnienia. W sekcji dostępny jest zbiorowy kalendarz z wpisami ewidencji wszystkich pracowników z możliwością filtrowania po działach i pracownikach. Możesz również wybrać pracownika i miesiąc, aby zobaczyć jego szczegółową ewidencję. Widoczne są wszystkie wpisy. Możesz eksportować ewidencje do PDF lub do Excela.'
				: 'In the "Work Time Records" section, Admin and HR can view timesheets of all employees in the team. Supervisors with appropriate permissions can view timesheets of employees from their department or selected employees. Supervisor permissions are configured in the team management section - when editing a user and their roles, if the user has the Supervisor role, you can set their permissions there. The section includes a collective calendar with timesheet entries of all employees with the ability to filter by departments and employees. You can also select an employee and month to see their detailed timesheet. All entries are visible. You can export timesheets to PDF or Excel.'
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
				? 'W sekcji "Urlopy" Admin i HR widzą wszystkie wnioski urlopowe w zespole. Przełożony widzi wnioski pracowników ze swojego działu lub wybranych pracowników (zgodnie z konfiguracją). W sekcji dostępny jest zbiorowy kalendarz z zaakceptowanymi wnioskami urlopowymi, zgłoszonymi nieobecnościami i innymi wpisami z możliwością filtrowania po działach i pracownikach. Możesz zatwierdzić, odrzucić lub anulować wniosek. Po zatwierdzeniu, urlop automatycznie pojawia się w kalendarzu urlopowym. Każda zmiana statusu wniosku wysyła powiadomienie email do pracownika. Możesz również wygenerować wniosek do PDF. Admin i HR mają zawsze pełny dostęp do wszystkich wniosków. Przełożony może mieć ograniczone uprawnienia w zależności od konfiguracji (może zatwierdzać tylko urlopy pracowników z działu lub wybranych pracowników).'
				: 'In the "Leaves" section, Admin and HR see all leave requests in the team. Supervisors see requests from employees in their department or selected employees (according to configuration). The section includes a collective calendar with approved leave requests, reported absences, and other entries with the ability to filter by departments and employees. You can approve, reject, or cancel a request. After approval, the leave automatically appears in the leave calendar. Any change in request status sends an email notification to the employee. You can also generate the request to PDF. Admin and HR always have full access to all requests. Supervisors may have limited permissions depending on configuration (can only approve leaves from department employees or selected employees).'
		},
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

	// Połącz sekcje - podstawowe dla wszystkich + dodatkowe dla Admina/HR
	const sections = [...baseSections, ...(isAdmin || isHR ? adminHRSections : [])]

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

	const handleMarkAsSeen = async () => {
		if (isMarkingAsSeen) return
		
		setIsMarkingAsSeen(true)
		try {
			await axios.post(
				`${API_URL}/api/users/tutorial/seen`,
				{},
				{ withCredentials: true }
			)
			await refreshUserData()
		} catch (error) {
			// Cicho loguj błąd, ale nie blokuj użytkownika
			// Jeśli endpoint nie istnieje lub jest błąd, po prostu kontynuuj
			if (process.env.NODE_ENV === 'development') {
				console.error('Error marking tutorial as seen:', error)
			}
		} finally {
			setIsMarkingAsSeen(false)
			// Zawsze zamykaj modal, niezależnie od wyniku zapytania
			onClose()
		}
	}

	const handleClose = () => {
		// Jeśli to pierwsze wyświetlenie (po rejestracji), oznacz jako obejrzane przed zamknięciem
		if (showOnFirstView) {
			handleMarkAsSeen()
		} else {
			onClose()
		}
	}

	const handleNavigateToSection = async (path) => {
		if (showOnFirstView) {
			await handleMarkAsSeen()
		} else {
			onClose()
		}
		setTimeout(() => {
			navigate(path)
		}, 300)
	}

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={handleClose}
			style={{
				overlay: {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(2px)',
					zIndex: 100000000
				},
				content: {
					position: 'relative',
					inset: 'unset',
					margin: '0',
					maxWidth: '800px',
					width: '90%',
					maxHeight: '90vh',
					overflowY: 'auto',
					borderRadius: '12px',
					padding: '30px',
					backgroundColor: 'white',
					boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
				},
			}}
			contentLabel={i18n.resolvedLanguage === 'pl' ? 'Jak korzystać z aplikacji' : 'How to use the app'}
		>
			{/* Header */}
			<div style={{ 
				display: 'flex', 
				justifyContent: 'space-between', 
				alignItems: 'center', 
				marginBottom: '30px',
				paddingBottom: '20px',
				borderBottom: '2px solid #e5e7eb'
			}}>
				<div>
					<h2 style={{ 
						margin: 0,
						color: '#1f2937',
						fontSize: '28px',
						fontWeight: '700',
						display: 'flex',
						alignItems: 'center',
						gap: '12px'
					}}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<path d="M12 16v-4M12 8h.01"></path>
						</svg>
						{i18n.resolvedLanguage === 'pl' ? 'Jak korzystać z aplikacji?' : 'How to use the app?'}
					</h2>
					<p style={{ 
						margin: '8px 0 0 0',
						color: '#6b7280',
						fontSize: '16px'
					}}>
						{i18n.resolvedLanguage === 'pl' 
							? 'Poznaj główne funkcje aplikacji i dowiedz się, jak z nich korzystać'
							: 'Learn about the main features of the app and how to use them'
						}
					</p>
				</div>
				<button
					onClick={handleClose}
					style={{
						background: 'transparent',
						border: 'none',
						fontSize: '28px',
						cursor: 'pointer',
						color: '#7f8c8d',
						lineHeight: '1',
						padding: '0',
						width: '30px',
						height: '30px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: '50%',
						transition: 'all 0.2s'
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
			</div>

			{/* Sections Grid */}
			<div style={{
				display: 'flex',
				flexDirection: isMobile ? 'column' : 'row',
				gap: '16px',
				marginBottom: '30px',
				alignItems: 'flex-start'
			}}>
				{columns.map((columnSections, columnIndex) => (
					<div
						key={columnIndex}
						style={{
							flex: isMobile ? 'none' : '1',
							width: isMobile ? '100%' : 'auto',
							minWidth: isMobile ? 'auto' : '300px',
							display: 'flex',
							flexDirection: 'column',
							gap: '16px'
						}}
					>
						{columnSections.map((section) => (
							<div
								key={section.id}
								onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
								style={{
									padding: '20px',
									border: '2px solid',
									borderColor: activeSection === section.id ? '#667eea' : '#e5e7eb',
									borderRadius: '12px',
									cursor: 'pointer',
									transition: 'all 0.3s ease',
									backgroundColor: activeSection === section.id ? '#f0f4ff' : 'white',
									boxShadow: activeSection === section.id 
										? '0 4px 12px rgba(102, 126, 234, 0.2)' 
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
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
							<div style={{
								width: '48px',
								height: '48px',
								borderRadius: '12px',
								backgroundColor: activeSection === section.id ? '#667eea' : '#f3f4f6',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
								transition: 'all 0.3s ease'
							}}>
								<img 
									src={section.icon} 
									alt={section.title}
									style={{
										width: '28px',
										height: '28px',
										filter: activeSection === section.id ? 'brightness(0) invert(1)' : 'none'
									}}
								/>
							</div>
							<div style={{ flex: 1 }}>
								<h3 style={{
									margin: '0 0 8px 0',
									color: '#1f2937',
									fontSize: '18px',
									fontWeight: '600'
								}}>
									{section.title}
								</h3>
								<p style={{
									margin: 0,
									color: '#6b7280',
									fontSize: '14px',
									lineHeight: '1.5'
								}}>
									{section.description}
								</p>
							</div>
							<svg 
								width="20" 
								height="20" 
								viewBox="0 0 24 24" 
								fill="none" 
								stroke="currentColor" 
								strokeWidth="2"
								style={{
									color: activeSection === section.id ? '#667eea' : '#9ca3af',
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
							<div style={{
								marginTop: '16px',
								paddingTop: '16px',
								borderTop: '1px solid #e5e7eb',
								animation: 'fadeIn 0.3s ease'
							}}>
								<p style={{
									margin: '0 0 16px 0',
									color: '#374151',
									fontSize: '15px',
									lineHeight: '1.6',
									whiteSpace: 'pre-line'
								}}>
									{section.content}
								</p>
								<button
									onClick={(e) => {
										e.stopPropagation()
										handleNavigateToSection(section.path)
									}}
									style={{
										width: '100%',
										padding: '10px 16px',
										backgroundColor: '#667eea',
										color: 'white',
										border: 'none',
										borderRadius: '8px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: 'pointer',
										transition: 'all 0.2s',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '8px'
									}}
									onMouseEnter={(e) => {
										e.target.style.backgroundColor = '#5568d3'
										e.target.style.transform = 'translateY(-1px)'
									}}
									onMouseLeave={(e) => {
										e.target.style.backgroundColor = '#667eea'
										e.target.style.transform = 'translateY(0)'
									}}
								>
									{i18n.resolvedLanguage === 'pl' ? 'Przejdź do sekcji' : 'Go to section'}
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M5 12h14M12 5l7 7-7 7"></path>
									</svg>
								</button>
							</div>
						)}
					</div>
						))}
					</div>
				))}
			</div>

			{/* Footer */}
			{showOnFirstView && (
				<div style={{
					paddingTop: '20px',
					borderTop: '2px solid #e5e7eb',
					display: 'flex',
					justifyContent: 'flex-end',
					gap: '12px'
				}}>
					<button
						onClick={handleMarkAsSeen}
						disabled={isMarkingAsSeen}
						style={{
							padding: '12px 24px',
							backgroundColor: '#667eea',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: isMarkingAsSeen ? 'not-allowed' : 'pointer',
							transition: 'all 0.2s',
							opacity: isMarkingAsSeen ? 0.6 : 1,
							display: 'flex',
							alignItems: 'center',
							gap: '8px'
						}}
						onMouseEnter={(e) => {
							if (!isMarkingAsSeen) {
								e.target.style.backgroundColor = '#5568d3'
								e.target.style.transform = 'translateY(-1px)'
							}
						}}
						onMouseLeave={(e) => {
							if (!isMarkingAsSeen) {
								e.target.style.backgroundColor = '#667eea'
								e.target.style.transform = 'translateY(0)'
							}
						}}
					>
						{isMarkingAsSeen ? (
							<>
								<svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								{i18n.resolvedLanguage === 'pl' ? 'Zapisywanie...' : 'Saving...'}
							</>
						) : (
							<>
								{i18n.resolvedLanguage === 'pl' ? 'Rozumiem, przejdź dalej' : 'Got it, continue'}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<polyline points="9 18 15 12 9 6"></polyline>
								</svg>
							</>
						)}
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
