import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * PWA Navigation Bar - Shows back/forward buttons only in PWA mode
 * This component detects if the app is running in standalone PWA mode
 * and provides browser-like navigation controls
 */
function PWANavigationBar() {
	const [isPWA, setIsPWA] = useState(false)
	const [canGoBack, setCanGoBack] = useState(false)
	const [canGoForward, setCanGoForward] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()
	const { t } = useTranslation()

	// Detect if running in PWA mode
	useEffect(() => {
		const checkPWA = () => {
			// Check for iOS standalone mode
			const isIOSStandalone = window.navigator.standalone === true
			
			// Check for Android/Chrome standalone mode
			const isStandalone = window.matchMedia('(display-mode: standalone)').matches
			
			// Check if running in fullscreen mode (another PWA indicator)
			const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches
			
			// Check if running in minimal-ui mode
			const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches
			
			// PWA is detected if any of these conditions are true
			const detectedPWA = isIOSStandalone || isStandalone || isFullscreen || isMinimalUI
			
			setIsPWA(detectedPWA)
		}

		checkPWA()
		
		// Re-check on resize (in case display mode changes)
		window.addEventListener('resize', checkPWA)
		return () => window.removeEventListener('resize', checkPWA)
	}, [])

	// Track if we've navigated back (to enable forward button)
	const [hasNavigatedBack, setHasNavigatedBack] = useState(false)
	const [navigationStack, setNavigationStack] = useState([location.pathname])

	// Update navigation stack when location changes
	useEffect(() => {
		// If this is a new path (not from back/forward navigation)
		if (!hasNavigatedBack && location.pathname !== navigationStack[navigationStack.length - 1]) {
			// Add new path to stack
			setNavigationStack(prev => [...prev, location.pathname])
			setHasNavigatedBack(false)
		} else {
			setHasNavigatedBack(false)
		}
	}, [location.pathname])

	// Check navigation availability
	useEffect(() => {
		// Can go back if we have more than one item in history
		const canBack = window.history.length > 1 && navigationStack.length > 1
		
		// Can go forward if we've navigated back (simplified - always show if history exists)
		// In practice, forward is only available after going back
		const canForward = window.history.length > 1
		
		setCanGoBack(canBack)
		setCanGoForward(canForward)
	}, [location, navigationStack])

	// Handle back navigation
	const handleGoBack = () => {
		if (canGoBack) {
			setHasNavigatedBack(true)
			navigate(-1)
		}
	}

	// Handle forward navigation
	const handleGoForward = () => {
		if (canGoForward) {
			navigate(1)
		}
	}

	// Don't render if not in PWA mode
	if (!isPWA) {
		return null
	}

	// Don't show on login/registration pages
	const hideOnRoutes = ['/login', '/team-registration', '/reset-password']
	if (hideOnRoutes.includes(location.pathname)) {
		return null
	}

	return (
		<div
			style={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				backgroundColor: '#ffffff',
				borderTop: '1px solid #e0e0e0',
				zIndex: 1000,
				display: 'flex',
				width: '100%',
				// Safe area for devices with notches
				paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
			}}
			className="pwa-navigation-bar"
		>
			{/* Back Button */}
			<button
				onClick={handleGoBack}
				disabled={!canGoBack}
				aria-label={t('pwaNav.back') || 'Wstecz'}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: '50%',
					height: '56px',
					border: 'none',
					borderRight: '1px solid #e0e0e0',
					backgroundColor: canGoBack ? '#ffffff' : '#f5f5f5',
					color: canGoBack ? '#2c3e50' : '#bdc3c7',
					cursor: canGoBack ? 'pointer' : 'not-allowed',
					transition: 'background-color 0.2s ease',
					outline: 'none',
					WebkitTapHighlightColor: 'transparent',
				}}
				onMouseEnter={(e) => {
					if (canGoBack) {
						e.target.style.backgroundColor = '#f8f9fa'
					}
				}}
				onMouseLeave={(e) => {
					if (canGoBack) {
						e.target.style.backgroundColor = '#ffffff'
					}
				}}
				onTouchStart={(e) => {
					if (canGoBack) {
						e.target.style.backgroundColor = '#f0f0f0'
					}
				}}
				onTouchEnd={(e) => {
					if (canGoBack) {
						e.target.style.backgroundColor = '#ffffff'
					}
				}}
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M15 18L9 12L15 6"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>

			{/* Forward Button */}
			<button
				onClick={handleGoForward}
				disabled={!canGoForward}
				aria-label={t('pwaNav.forward') || 'Do przodu'}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: '50%',
					height: '56px',
					border: 'none',
					backgroundColor: canGoForward ? '#ffffff' : '#f5f5f5',
					color: canGoForward ? '#2c3e50' : '#bdc3c7',
					cursor: canGoForward ? 'pointer' : 'not-allowed',
					transition: 'background-color 0.2s ease',
					outline: 'none',
					WebkitTapHighlightColor: 'transparent',
				}}
				onMouseEnter={(e) => {
					if (canGoForward) {
						e.target.style.backgroundColor = '#f8f9fa'
					}
				}}
				onMouseLeave={(e) => {
					if (canGoForward) {
						e.target.style.backgroundColor = '#ffffff'
					}
				}}
				onTouchStart={(e) => {
					if (canGoForward) {
						e.target.style.backgroundColor = '#f0f0f0'
					}
				}}
				onTouchEnd={(e) => {
					if (canGoForward) {
						e.target.style.backgroundColor = '#ffffff'
					}
				}}
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M9 18L15 12L9 6"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>
		</div>
	)
}

export default PWANavigationBar
