import React, { useState, useEffect } from 'react'
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { isAdmin, isHR, isDepartmentSupervisor, isDepartmentViewer, isWorker } from '../../utils/roleHelpers'
import { useUnreadCount } from '../../hooks/useChat'

function Sidebar() {
	const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth > 1500)
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false) // Nowy state dla schowanego sidebaru na desktop
	const [isAnimating, setIsAnimating] = useState(false)
	const [isNavbarVisible, setIsNavbarVisible] = useState(true)
	const [lastScrollY, setLastScrollY] = useState(0)
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const location = useLocation()
	const { role, logout, username, loggedIn } = useAuth()
	const { data: unreadCount = 0 } = useUnreadCount({ enabled: !!loggedIn })

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

	useEffect(() => {
		function handleResize() {
			const isDesktop = window.innerWidth > 1500
			setIsMenuOpen(isDesktop)
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
			<nav className={`navbar navbar-expand-lg d-md-none mobile-navbar ${isNavbarVisible ? 'navbar-visible' : 'navbar-hidden'}`}>
					<Link to="/" className="navbar-brand">
						<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" className="mobile-logo" />
					</Link>
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
			<div className={`sidebar text-white ${isMenuOpen && !isSidebarCollapsed ? 'opened' : 'closed'} ${isSidebarCollapsed ? 'collapsed' : ''} ${isAnimating ? 'animating' : ''}`}>
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
					<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" />
				</Link>

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

				{/* User Header */}
				<div className="sidebar-header">
					<div className="user-info">
						<h5 className="username">{username}</h5>
					</div>
				</div>

				{/* Navigation Buttons */}
				<div className="sidebar-navigation">
					<NavLink
						to="/edit-profile"
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/user-avatar.png" alt="Profile" />
						</div>
						<span className="nav-text">{t('sidebar.btn1')}</span>
					</NavLink>

					<NavLink
						to="/dashboard"
						style={{ marginTop: '20px'}}
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/clock.png" alt="Dashboard" />
						</div>
						<span className="nav-text">{t('sidebar.btn2')}</span>
					</NavLink>

					<NavLink
						to="/schedule"
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/project.png" alt="Schedule" />
						</div>
						<span className="nav-text">{t('sidebar.btnSchedule')}</span>
					</NavLink>

					<NavLink
						to="/leave-request"
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/sunbed.png" alt="Leave Request" />
						</div>
						<span className="nav-text">{t('sidebar.btn3')}</span>
					</NavLink>

					<NavLink
						to="/leave-planner"
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/calendar.png" alt="Leave Planner" />
						</div>
						<span className="nav-text">{t('sidebar.btn4')}</span>
					</NavLink>

					<NavLink
						to="/all-leave-plans"
						className={({ isActive }) => `nav-link ${isLeavePlans ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/schedule.png" alt="Leave Plans" />
						</div>
						<span className="nav-text">{t('sidebar.btn5')}</span>
					</NavLink>

					<NavLink
								to="/boards"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
								style={{ position: 'relative', marginTop: '20px' }}>
								<div className="nav-icon">
								<img src="/img/task-list.png" alt='icon of boards' />
								</div>
								<span className="nav-text">{t('sidebar.btnBoards')}</span>
							</NavLink>

					<NavLink
								to="/chat"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
								style={{ position: 'relative' }}>
								<div className="nav-icon">
									<img src="/img/chat.png" alt="chat icons" />
								</div>
								<span className="nav-text">{t('sidebar.btnChat')}</span>
								{unreadCount > 0 && (
									<span className="unread-badge-sidebar" style={{
										position: 'absolute',
										right: '10px',
										top: '50%',
										transform: 'translateY(-50%)',
										background: '#e74c3c',
										color: 'white',
										borderRadius: '12px',
										padding: '2px 8px',
										fontSize: '12px',
										fontWeight: '600',
										minWidth: '20px',
										textAlign: 'center'
									}}>
										{unreadCount > 99 ? '99+' : unreadCount}
									</span>
								)}
							</NavLink>

					{/* Admin Links - calendars-list i leave-list w jednym div */}
					{((isAdmin(role) || isHR(role) || isDepartmentViewer(role) || isDepartmentSupervisor(role))) && (
						<div className="admin-section">
							{/* calendars-list - dla Admin, HR, DepartmentViewer */}
							{(isAdmin(role) || isHR(role) || isDepartmentViewer(role)) && (
								<NavLink
									to="/calendars-list"
									className={({ isActive }) => `nav-link ${isListOrCalendarActive || isActive ? 'active' : ''}`}>
									<div className="nav-icon">
										<img src="/img/schedule time works.png" alt="Work Calendars" />
									</div>
									<span className="nav-text">{t('sidebar.btn6')}</span>
								</NavLink>
							)}

							{/* leave-list - dla Admin, HR, DepartmentSupervisor */}
							{(isAdmin(role) || isHR(role) || isDepartmentSupervisor(role)) && (
								<NavLink
									to="/leave-list"
									className={({ isActive }) => `nav-link ${isListOrLeavereqActive || isActive ? 'active' : ''}`}>
									<div className="nav-icon">
										<img src="/img/trip.png" alt="Leave List" />
									</div>
									<span className="nav-text">{t('sidebar.btn7')}</span>
								</NavLink>
							)}
						</div>
					)}

					{/* Admin Links */}
					{isAdmin(role) && (
						<div className="admin-section">
							
							<NavLink
								to="/create-user"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
								<div className="nav-icon">
									<img src="/img/add-group.png" alt="Create User" />
								</div>
								<span className="nav-text">{t('sidebar.btn8')}</span>
							</NavLink>

							<NavLink
								to="/logs"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
								<div className="nav-icon">
									<img src="/img/contact-list.png" alt="Logs" />
								</div>
								<span className="nav-text">{t('sidebar.btn9')}</span>
							</NavLink>

							<NavLink
								to="/helpcenter"
								className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
								<div className="nav-icon">
									<img src="/img/technical-support.png" alt="Help Center" />
								</div>
								<span className="nav-text">{t('tickets.title')}</span>
							</NavLink>
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
