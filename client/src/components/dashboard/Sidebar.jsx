import React, { useState, useEffect } from 'react'
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { isAdmin, isHR, isDepartmentSupervisor, isDepartmentViewer, isWorker } from '../../utils/roleHelpers'

function Sidebar() {
	const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth > 1500)
	const [isAnimating, setIsAnimating] = useState(false)
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const location = useLocation()
	const { role, logout, username } = useAuth()

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
			setIsMenuOpen(window.innerWidth > 1500)
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const toggleMenu = () => {
		if (isAnimating) return
		setIsAnimating(true)
		setIsMenuOpen(!isMenuOpen)
		
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
				<nav className="navbar navbar-expand-lg d-md-none mobile-navbar">
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

			{/* Sidebar */}
			<div className={`sidebar text-white ${isMenuOpen ? 'opened' : 'closed'} ${isAnimating ? 'animating' : ''}`}>
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
						className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
						<div className="nav-icon">
							<img src="/img/clock.png" alt="Dashboard" />
						</div>
						<span className="nav-text">{t('sidebar.btn2')}</span>
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

					{/* Admin Links */}
					{(isAdmin(role) || isHR(role) || isDepartmentSupervisor(role) || isDepartmentViewer(role)) && (
						<div className="admin-section">
							
							<NavLink
								to="/calendars-list"
								className={({ isActive }) => `nav-link ${isListOrCalendarActive || isActive ? 'active' : ''}`}>
								<div className="nav-icon">
									<img src="/img/schedule time works.png" alt="Work Calendars" />
								</div>
								<span className="nav-text">{t('sidebar.btn6')}</span>
							</NavLink>

							<NavLink
								to="/leave-list"
								className={({ isActive }) => `nav-link ${isListOrLeavereqActive || isActive ? 'active' : ''}`}>
								<div className="nav-icon">
									<img src="/img/trip.png" alt="Leave List" />
								</div>
								<span className="nav-text">{t('sidebar.btn7')}</span>
							</NavLink>
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
