import React, { useState, useEffect } from 'react'
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { isAdmin, isHR, isSupervisor, isWorker } from '../../utils/roleHelpers'
import { useUnreadCount } from '../../hooks/useChat'
import { useBoardsUnreadSummary } from '../../hooks/useBoards'
import { useSupervisorConfig } from '../../hooks/useSupervisor'
import { usePendingLeaveRequestsSummary } from '../../hooks/useLeaveRequests'
import { useAnnouncementsUnreadCount } from '../../hooks/useAnnouncements'
import { useFreemiumAccess } from '../../hooks/useFreemiumAccess'
import { useDashboardAccess } from '../../hooks/useDashboardAccess'
import { useSettings } from '../../hooks/useSettings'
import { useTutorial } from '../../context/TutorialContext'
import { canShowBillingModuleNav } from '../../utils/moduleNavAccess'
import NotificationBell from '../NotificationBell'
import SidebarThemeButton from '../shared/SidebarThemeButton'
import { useTheme } from '../../context/ThemeContext'

function Sidebar() {
	const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth > 1500)
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false) // Nowy state dla schowanego sidebaru na desktop
	const [isAnimating, setIsAnimating] = useState(false)
	const [isNavbarVisible, setIsNavbarVisible] = useState(true)
	const [lastScrollY, setLastScrollY] = useState(0)
	const { openTutorial } = useTutorial()
	const { isDark } = useTheme()
	const planioLogoSrc = isDark ? '/img/star.png' : '/img/planio.png'
	/** Dzwonek tylko w sidebarze na desktop (>1500px); na mobile wyłącznie obok hamburgera w pasku. */
	const [isDesktopLayout, setIsDesktopLayout] = useState(
		typeof window !== 'undefined' && window.innerWidth > 1500
	)
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const location = useLocation()
	const { role, logout, username, loggedIn, userId } = useAuth()
	const {
		isLoading: billingEntLoading,
		data: billingEnt,
		freemiumTier,
		freemiumSeatBlocked,
		freemiumAppRestricted,
	} = useFreemiumAccess({ enabled: !!loggedIn })
	const { canUseDashboard } = useDashboardAccess({ enabled: !!loggedIn })
	/** Freemium: bez zapytań do czatu/tablic/ogłoszeń/urlopów (403 z freemiumApiGuard). */
	const premiumSidebarQueriesEnabled = !!loggedIn && !billingEntLoading && !freemiumTier

	const showNavSchedule =
		premiumSidebarQueriesEnabled &&
		canShowBillingModuleNav(billingEnt, 'schedules_ai', billingEntLoading)
	const showNavTasks =
		premiumSidebarQueriesEnabled &&
		canShowBillingModuleNav(billingEnt, 'tasks', billingEntLoading)
	const showNavChat =
		premiumSidebarQueriesEnabled &&
		canShowBillingModuleNav(billingEnt, 'chat', billingEntLoading)

	const { data: unreadCount = 0 } = useUnreadCount({ enabled: showNavChat })
	const { data: unreadAnnouncementsCount = 0 } = useAnnouncementsUnreadCount({
		enabled: premiumSidebarQueriesEnabled,
	})
	const { data: boardsUnreadSummary } = useBoardsUnreadSummary({ enabled: showNavTasks })
	const unreadBoardsTotal = boardsUnreadSummary?.totalUnread || 0
	
	// HIERARCHIA RÓL: Admin > HR > Przełożony
	// Sprawdź konfigurację przełożonego jeśli jest przełożonym (ale nie Admin ani HR)
	const isSupervisorRole = isSupervisor(role)
	const isAdminRole = isAdmin(role)
	const isHRRole = isHR(role)
	const { data: supervisorConfig } = useSupervisorConfig(userId, isSupervisorRole && !isAdminRole && !isHRRole)
	const { data: settings } = useSettings()
	
	// Sprawdź uprawnienia zgodnie z hierarchią ról
	// Admin i HR mają zawsze pełny dostęp, ignorujemy SupervisorConfig
	const canApproveLeaves = isAdminRole || isHRRole 
		? true // Admin i HR mają zawsze dostęp
		: (isSupervisorRole && (supervisorConfig?.permissions?.canApproveLeaves !== false)) // Przełożony - sprawdź konfigurację
	const canViewTimesheets = isAdminRole || isHRRole 
		? true // Admin i HR mają zawsze dostęp
		: (isSupervisorRole && (supervisorConfig?.permissions?.canViewTimesheets !== false)) // Przełożony - sprawdź konfigurację
	const canManageSchedule = isAdminRole || isHRRole 
		? true // Admin i HR mają zawsze dostęp
		: (isSupervisorRole && (supervisorConfig?.permissions?.canManageSchedule !== false)) // Przełożony - sprawdź konfigurację
	const canOpenLeaveList = isAdminRole || isHRRole || (isSupervisorRole && canApproveLeaves)
	const canOpenCreateUser =
		isAdminRole ||
		((isHRRole || isSupervisorRole) && settings?.allowManagedNoAccessUsers === true)
	const { data: pendingSummary } = usePendingLeaveRequestsSummary({
		enabled: premiumSidebarQueriesEnabled && canOpenLeaveList,
	})
	const pendingLeaveCount = pendingSummary?.totalPending || 0

	const compactFreemiumNav = freemiumSeatBlocked
	const narrowFreemiumNav = freemiumAppRestricted
	const showPremiumModules = !compactFreemiumNav && !narrowFreemiumNav
	const showDashboardLink = canUseDashboard && !compactFreemiumNav
	const showScheduleLink =
		showPremiumModules &&
		canShowBillingModuleNav(billingEnt, 'schedules_ai', billingEntLoading)
	const showBoardsLink =
		showPremiumModules && canShowBillingModuleNav(billingEnt, 'tasks', billingEntLoading)
	const showChatLink =
		showPremiumModules && canShowBillingModuleNav(billingEnt, 'chat', billingEntLoading)
	const showAiAssistantLink =
		showPremiumModules &&
		canShowBillingModuleNav(billingEnt, 'ai_assistant', billingEntLoading)
	/** Kalendarze / ewidencje zespołu — także freemium i przy blokadzie miejsc (Admin / HR / przełożony z uprawnieniem). */
	const showAdminCalendars =
		isAdminRole || isHRRole || (isSupervisorRole && canViewTimesheets)
	const showAdminLeaveList =
		!compactFreemiumNav &&
		showPremiumModules &&
		(isAdminRole || isHRRole || (isSupervisorRole && canApproveLeaves))

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const isListOrCalendarActive =
		location.pathname === '/calendars-list' || location.pathname.startsWith('/work-calendars')

	const isListOrLeavereqActive =
		location.pathname === '/leave-list' ||
		location.pathname.startsWith('/leave-requests') ||
		location.pathname.startsWith('/leave-request-pdf-preview')

	const isLeavePlans = location.pathname === '/all-leave-plans' || location.pathname.startsWith('/leave-plans')
	const isAnnouncementsActive = location.pathname.startsWith('/announcements')
	const startLabel = i18n.resolvedLanguage === 'pl' ? 'Start' : 'Home'
	const workTimeLabel = i18n.resolvedLanguage === 'pl' ? 'Czas pracy' : 'Work time'

	useEffect(() => {
		const mq = window.matchMedia('(min-width: 1501px)')
		const syncDesktop = () => setIsDesktopLayout(mq.matches)
		syncDesktop()
		mq.addEventListener('change', syncDesktop)
		return () => mq.removeEventListener('change', syncDesktop)
	}, [])

	useEffect(() => {
		let lastWidth = window.innerWidth
		
		function handleResize() {
			const currentWidth = window.innerWidth
			const isDesktop = currentWidth > 1500
			
			// Sprawdź czy szerokość się faktycznie zmieniła (prawdziwy resize)
			const widthChanged = Math.abs(currentWidth - lastWidth) > 10
			
			if (widthChanged) {
				// Tylko przy prawdziwej zmianie rozmiaru okna resetuj stan
				setIsMenuOpen(isDesktop)
				lastWidth = currentWidth
			}
			
			// Na mobile zawsze pokazuj sidebar jako menu overlay
			if (!isDesktop) {
				setIsSidebarCollapsed(false)
			}
		}
		
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// Dodaj klasę do body gdy sidebar jest schowany (dla CSS)
	useEffect(() => {
		if (window.innerWidth > 1500) {
			if (isSidebarCollapsed) {
				document.body.classList.add('sidebar-collapsed')
			} else {
				document.body.classList.remove('sidebar-collapsed')
			}
		}
		return () => {
			document.body.classList.remove('sidebar-collapsed')
		}
	}, [isSidebarCollapsed])

	// Scroll detection for mobile navbar hide/show
	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY
			
			// Show navbar when scrolling up, hide when scrolling down
			if (currentScrollY < lastScrollY) {
				// Scrolling up - show navbar
				setIsNavbarVisible(true)
			} else if (currentScrollY > lastScrollY && currentScrollY > 10) {
				// Scrolling down and past 10px - hide navbar
				setIsNavbarVisible(false)
			}
			
			// Always show navbar at the top
			if (currentScrollY < 10) {
				setIsNavbarVisible(true)
			}
			
			setLastScrollY(currentScrollY)
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [lastScrollY])

	const toggleMenu = () => {
		if (isAnimating) return
		setIsAnimating(true)
		
		// Na desktop (>1500px) - toggle collapse
		if (window.innerWidth > 1500) {
			setIsSidebarCollapsed(!isSidebarCollapsed)
		} else {
			// Na mobile - toggle menu overlay
			setIsMenuOpen(!isMenuOpen)
		}
		
		// Reset animation flag after transition
		setTimeout(() => {
			setIsAnimating(false)
		}, 400)
	}

	const handleLogoutClick = () => {
		logout()
		navigate('/login')
	}

	const hasRole = (...requiredRoles) => {
		return Array.isArray(role) && requiredRoles.some(requiredRole => role.includes(requiredRole))
	}

	// Check if mobile navbar should be hidden
	const shouldHideMobileNav = isMenuOpen && window.innerWidth <= 1500

	return (
		<div className="container-fluid p-0">
		{/* Mobile Navigation Bar */}
		{!shouldHideMobileNav && (
			<nav className={`navbar d-md-none mobile-navbar ${isNavbarVisible ? 'navbar-visible' : 'navbar-hidden'}`}>
					<Link to="/" className="navbar-brand">
						<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" className="mobile-logo app-brand-logo" />
					</Link>
					<div className="mobile-navbar-actions">
						{loggedIn && <NotificationBell variant="mobile" enabled />}
						<button 
							className={`navbar-toggler ${isMenuOpen ? 'active' : ''}`} 
							type="button" 
							onClick={toggleMenu}
							aria-label="Toggle navigation"
						>
							<div className="hamburger-icon">
								<span></span>
								<span></span>
								<span></span>
							</div>
						</button>
					</div>
				</nav>
			)}

			{/* Sidebar Toggle Button - tylko na desktop gdy sidebar jest otwarty */}
			{window.innerWidth > 1500 && !isSidebarCollapsed && (
				<button
					onClick={toggleMenu}
					className="sidebar-toggle-btn desktop-only"
					aria-label="Hide sidebar"
					title="Schowaj sidebar"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
			)}

			{/* Sidebar Toggle Button - gdy sidebar jest schowany (po lewej stronie) */}
			{window.innerWidth > 1500 && isSidebarCollapsed && (
				<button
					onClick={toggleMenu}
					className="sidebar-toggle-btn sidebar-collapsed-btn"
					aria-label="Show sidebar"
					title="Pokaż sidebar"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
			)}

			{/* Sidebar */}
			<div
				className={`sidebar text-white ${isMenuOpen && !isSidebarCollapsed ? 'opened' : 'closed'} ${isSidebarCollapsed ? 'collapsed' : ''} ${isAnimating ? 'animating' : ''} ${loggedIn && isDesktopLayout ? 'sidebar--desktop-bell' : ''}`}
			>
				{/* Toggle Button - w sidebarze u góry (tylko desktop) */}
				{window.innerWidth > 1500 && !isSidebarCollapsed && (
					<button
						onClick={toggleMenu}
						className="sidebar-inner-toggle-btn"
						aria-label="Hide sidebar"
						title="Schowaj sidebar"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					</button>
				)}
				
				{/* Mobile: przełącznik motywu — lewy górny róg menu */}
				{loggedIn && !isDesktopLayout && (
					<div className="sidebar-mobile-theme-slot">
						<SidebarThemeButton />
					</div>
				)}

				{/* Language Selector */}
				<div className="language-selector">
					{Object.keys(lngs).map(lng => (
						<button
							key={lng}
							type="button"
							className={`flag-language-btn ${i18n.resolvedLanguage === lng ? 'active' : ''}`}
							onClick={() => i18n.changeLanguage(lng)}
							aria-label={`Change language to ${lng}`}
						>
							<img
								src={lngs[lng].flag}
								alt={`${lngs[lng].nativeName} flag`}
								className="flag-icon"
							/>
							<span className="language-text">{lngs[lng].nativeName}</span>
						</button>
					))}
				</div>

				{/* Logo */}
				<Link to="/" className="sidebar-logo">
					<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" className="app-brand-logo" />
				</Link>

				{/* Desktop: dzwonek + motyw między logo a mailem */}
				{loggedIn && isDesktopLayout && (
					<div className="sidebar-bell-between-logo-and-user">
						<NotificationBell variant="sidebar" enabled />
						<SidebarThemeButton />
					</div>
				)}

				{/* Close Button */}
				<button 
					onClick={toggleMenu} 
					className="sidebar-close-btn"
					aria-label="Close sidebar"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>

				{/* User Header — na mobile bez dzwonka (dzwonek w pasku obok menu) */}
				<div className="sidebar-header">
					<div className="sidebar-user-row">
						<h5 className="username">{username}</h5>
					</div>
				</div>

				{/* Navigation Buttons */}
				<div className="sidebar-navigation">
					<NavLink
						to="/edit-profile"
						className={({ isActive }) => `nav-link sidebar-profile-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/user-avatar.png" alt="Profile" />
						</div>
						<span className="nav-text">{t('sidebar.btn1')}</span>
					</NavLink>

					{showDashboardLink && (
					<NavLink
						to="/dashboard"
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/home.png" alt="Dashboard" />
						</div>
						<span className="nav-text">{startLabel}</span>
					</NavLink>
					)}

					{!compactFreemiumNav && (
					<NavLink
						to="/work-time"
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/clock.png" alt="Work time" />
						</div>
						<span className="nav-text">{workTimeLabel}</span>
					</NavLink>
					)}

					{showScheduleLink && (
					<NavLink
						to="/schedule"
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/project.png" alt="Schedule" />
						</div>
						<span className="nav-text">{t('sidebar.btnSchedule')}</span>
					</NavLink>
					)}

					{showPremiumModules && (
					<NavLink
						to="/leave-request"
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/sunbed.png" alt="Leave Request" />
						</div>
						<span className="nav-text">{t('sidebar.btn3')}</span>
					</NavLink>
					)}

					{showPremiumModules && (
					<NavLink
						to="/leave-planner"
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/calendar.png" alt="Leave Planner" />
						</div>
						<span className="nav-text">{t('sidebar.btn4')}</span>
					</NavLink>
					)}

					{showPremiumModules && (
					<NavLink
						to="/all-leave-plans"
						className={({ isActive }) => `nav-link ${isLeavePlans ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/schedule.png" alt="Leave Plans" />
						</div>
						<span className="nav-text">{t('sidebar.btn5')}</span>
					</NavLink>
					)}

					{showBoardsLink && (
					<NavLink
								to="/boards"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
								style={{ position: 'relative', marginTop: '20px' }}>
								<div className="nav-icon">
								<img src="/img/task-list.png" alt='icon of boards' />
								</div>
								<span className="nav-text">{t('sidebar.btnBoards')}</span>
								{unreadBoardsTotal > 0 && (
									<span className="sidebar-notification-badge">
										<span className="sidebar-notification-badge-count">
											{unreadBoardsTotal > 99 ? '99+' : unreadBoardsTotal}
										</span>
									</span>
								)}
							</NavLink>
					)}

					{showChatLink && (
					<NavLink
								to="/chat"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
								style={{ position: 'relative' }}>
								<div className="nav-icon">
									<img src="/img/chat.png" alt="chat icons" />
								</div>
								<span className="nav-text">{t('sidebar.btnChat')}</span>
								{unreadCount > 0 && (
									<span className="sidebar-notification-badge">
										<span className="sidebar-notification-badge-count">
											{unreadCount > 99 ? '99+' : unreadCount}
										</span>
									</span>
								)}
							</NavLink>
					)}

					{showPremiumModules && (
					<NavLink
								to="/announcements"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
								style={{ position: 'relative' }}>
								<div className="nav-icon">
									<img src="/img/announcement.png" alt="announcement icon" />
								</div>
								<span className="nav-text">{t('sidebar.btnAnnouncements')}</span>
								{unreadAnnouncementsCount > 0 && !isAnnouncementsActive && (
									<span className="sidebar-notification-badge">
										<span className="sidebar-notification-badge-count">
											{unreadAnnouncementsCount > 99 ? '99+' : unreadAnnouncementsCount}
										</span>
									</span>
								)}
							</NavLink>
					)}

					{showAiAssistantLink && (
					<NavLink
						to="/ai-assistant"
						className={({ isActive }) => `nav-link nav-link--ai ${isActive ? 'active' : ''}`}>
						<div className="nav-icon nav-icon--planio">
							<img src={planioLogoSrc} alt="" aria-hidden />
						</div>
						<span className="nav-text">{t('sidebar.btnAssistant')}</span>
					</NavLink>
					)}

					{/* Admin Links - calendars-list i leave-list w jednym div */}
					{(showAdminCalendars || showAdminLeaveList) && (
						<div className="admin-section">
							{showAdminCalendars && (
								<NavLink
									to="/calendars-list"
									className={({ isActive }) => `nav-link ${isListOrCalendarActive || isActive ? 'active' : ''}`}>
									<div className="nav-icon">
										<img src="/img/schedule time works.png" alt="Work Calendars" />
									</div>
									<span className="nav-text">{t('sidebar.btn6')}</span>
								</NavLink>
							)}

							{showAdminLeaveList && (
								<NavLink
									to="/leave-list"
									className={({ isActive }) => `nav-link ${isListOrLeavereqActive || isActive ? 'active' : ''}`}
									style={{ position: 'relative' }}>
									<div className="nav-icon">
										<img src="/img/trip.png" alt="Leave List" />
									</div>
									<span className="nav-text">{t('sidebar.btn7')}</span>
									{pendingLeaveCount > 0 && (
										<span
											className="sidebar-notification-badge sidebar-notification-badge--leave-pending"
											title={t('sidebar.pendingLeaveRequests') || 'Pending leave requests'}
										>
											<span className="sidebar-notification-badge-count">
												{pendingLeaveCount > 99 ? '99+' : pendingLeaveCount}
											</span>
										</span>
									)}
								</NavLink>
							)}
						</div>
					)}
                        <div className="admin-section">
							<NavLink
								to="/settings"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
								<div className="nav-icon">
									<img src="/img/settings.png" alt="Settings" />
								</div>
								<span className="nav-text">{t('sidebar.btnSettings')}</span>
							</NavLink>
							
							{/* Przycisk "Jak korzystać" — widoczny dla wszystkich (także freemium) */}
							<button
								type="button"
								onClick={() => openTutorial()}
								className="nav-link"
								style={{
									background: 'rgba(102, 126, 234, 0.1)',
									border: '1px solid rgba(102, 126, 234, 0.2)',
									width: '100%',
									textAlign: 'left',
									cursor: 'pointer',
									margin: 0
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)'
									e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)'
									e.currentTarget.style.transform = 'translateX(5px)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
									e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)'
									e.currentTarget.style.transform = 'translateX(0)'
								}}
							>
								<div className="nav-icon">
									<img src="/img/info.png" alt="How to use" />
								</div>
								<span className="nav-text">
									{i18n.resolvedLanguage === 'pl' ? 'Jak korzystać?' : 'How to use?'}
								</span>
							</button>
						</div>

					{/* Admin / HR (pakiety); tworzenie użytk. i logi — jak wcześniej. Centrum pomocy nad Pakietami (jeden link Pakiety). */}
					{(canOpenCreateUser || isAdmin(role) || isHRRole || username === 'michalipka1@gmail.com') && (
						<div className="admin-section">
							{(canOpenCreateUser || username === 'michalipka1@gmail.com') && !compactFreemiumNav && (
							<NavLink
								to="/create-user"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
								<div className="nav-icon">
									<img src="/img/add-group.png" alt="Create User" />
								</div>
								<span className="nav-text">{t('sidebar.btn8')}</span>
							</NavLink>
							)}

							{(isAdmin(role) || username === 'michalipka1@gmail.com') && (
							<NavLink
								to="/team-management"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
								<div className="nav-icon">
									<img src="/img/contact-list.png" alt="Logs" />
								</div>
								<span className="nav-text">{t('sidebar.btn9')}</span>
							</NavLink>
							)}

							{isAdmin(role) && (
								<NavLink
									to="/helpcenter"
									className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
									<div className="nav-icon">
										<img src="/img/technical-support.png" alt="" />
									</div>
									<span className="nav-text">{t('tickets.title')}</span>
								</NavLink>
							)}

							{(isAdminRole || isHRRole) && (
								<NavLink
									to="/packages"
									className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
									<div className="nav-icon">
										<img src="/img/wallet.png" alt="" />
									</div>
									<span className="nav-text">{t('sidebar.btnPackages')}</span>
								</NavLink>
							)}
						</div>
					)}
				</div>

				{/* Logout Button */}
				<div className="sidebar-footer">
					<button
						onClick={handleLogoutClick}
						className="logout-btn"
						aria-label="Logout"
					>
						<div className="logout-icon">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</div>
						<span className="logout-text">{t('sidebar.btn10')}</span>
					</button>
				</div>
			</div>

			{/* Overlay for mobile */}
			{isMenuOpen && window.innerWidth <= 1500 && (
				<div className="sidebar-overlay" onClick={toggleMenu}></div>
			)}

		</div>
	)
}

export default Sidebar
