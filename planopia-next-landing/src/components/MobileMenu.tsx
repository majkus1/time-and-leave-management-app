'use client'

import React, { useEffect, useCallback } from 'react'
import Link from 'next/link'

interface MobileMenuProps {
	isOpen: boolean
	onClose: () => void
	onCloseRequest?: (closeHandler: () => void) => void // Callback to expose handleClose to parent
	lang?: 'pl' | 'en'
	menuItems?: Array<{
		href: string
		label: string
		onClick?: () => void
	}>
	legalItems?: Array<{
		href: string
		label: string
	}>
	loginHref?: string
	registerHref?: string
	languageSwitcher?: {
		href: string
		flagSrc: string
		alt: string
	}
}

export default function MobileMenu({
	isOpen,
	onClose,
	onCloseRequest,
	lang = 'pl',
	menuItems = [],
	legalItems = [],
	loginHref = 'https://app.planopia.pl/',
	registerHref = 'https://app.planopia.pl/team-registration',
	languageSwitcher
}: MobileMenuProps) {
	const [legalDropdownOpen, setLegalDropdownOpen] = React.useState(false)
	const [isClosing, setIsClosing] = React.useState(false)
	const isPL = lang === 'pl'

	// Reset closing state when menu opens
	useEffect(() => {
		if (isOpen) {
			setIsClosing(false)
		}
	}, [isOpen])

	// Lock body scroll when menu is open and add class for styling
	useEffect(() => {
		if (isOpen && !isClosing) {
			document.body.style.overflow = 'hidden'
			document.body.classList.add('mobile-menu-open')
		} else {
			document.body.style.overflow = ''
			document.body.classList.remove('mobile-menu-open')
		}
		return () => {
			document.body.style.overflow = ''
			document.body.classList.remove('mobile-menu-open')
		}
	}, [isOpen, isClosing])

	// Handle close with animation
	const handleClose = useCallback(() => {
		if (isClosing) return // Prevent multiple clicks
		setIsClosing(true)
		
		// Wait for animation to complete before actually closing
		setTimeout(() => {
			onClose()
			setIsClosing(false)
		}, 400) // Match animation duration (0.4s = 400ms)
	}, [isClosing, onClose])

	// Expose handleClose to parent component via callback (only when menu opens)
	useEffect(() => {
		if (onCloseRequest && isOpen && !isClosing) {
			onCloseRequest(handleClose)
		}
	}, [isOpen]) // Only depend on isOpen to avoid infinite loop

	// Close menu when pressing Escape
	useEffect(() => {
		if (!isOpen || isClosing) return
		
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				handleClose()
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [isOpen, isClosing, handleClose])

	// Default menu items if not provided
	const defaultMenuItems = menuItems.length > 0 
		? menuItems 
		: [
				{ href: isPL ? '/#oaplikacji' : '/en#aboutapp', label: isPL ? 'O Aplikacji' : 'About the App' },
				{ href: isPL ? '/#cennik' : '/en#prices', label: isPL ? 'Cennik' : 'Pricing' },
				{ href: isPL ? '/#kontakt' : '/en#contact', label: isPL ? 'Kontakt' : 'Contact' },
				{ href: isPL ? '/blog' : '/en/blog', label: 'Blog' },
			]

	// Default legal items if not provided
	const defaultLegalItems = legalItems.length > 0
		? legalItems
		: [
				{ href: isPL ? '/terms' : '/en/terms', label: isPL ? 'Regulamin' : 'Terms of Service' },
				{ href: isPL ? '/privacy' : '/en/privacy', label: isPL ? 'Polityka prywatności' : 'Privacy Policy' },
				{ href: isPL ? '/dpa' : '/en/dpa', label: isPL ? 'Umowa DPA' : 'Data Processing Agreement' },
			]

	// Keep menu visible during closing animation even if isOpen becomes false
	if (!isOpen && !isClosing) return null

	return (
		<>
			{/* Backdrop with blur */}
			<div
				className={`mobile-menu-backdrop ${isClosing ? 'closing' : ''}`}
				onClick={handleClose}
				aria-hidden="true"
			/>

			{/* Mobile Menu Panel */}
			<div className={`mobile-menu-panel ${isClosing ? 'closing' : ''}`}>
				<div className="mobile-menu-content">
					{/* Menu Items */}
					<nav className="mobile-menu-nav">
						{defaultMenuItems.map((item, index) => (
							<Link
								key={index}
								href={item.href}
								onClick={() => {
									handleClose()
									if (item.onClick) item.onClick()
								}}
								className="mobile-menu-item"
								style={{
									animationDelay: `${index * 0.05}s`
								}}
							>
								{item.label}
							</Link>
						))}

						{/* Legal Dropdown */}
						{defaultLegalItems.length > 0 && (
							<div className="mobile-menu-legal-dropdown">
								<button
									onClick={() => setLegalDropdownOpen(!legalDropdownOpen)}
									className="mobile-menu-legal-button"
									style={{
										animationDelay: `${defaultMenuItems.length * 0.05}s`
									}}
								>
									<span>{isPL ? 'Regulaminy' : 'Legal'}</span>
									<svg 
										className={`mobile-menu-legal-icon ${legalDropdownOpen ? 'rotate-180' : ''}`}
										fill="none" 
										stroke="currentColor" 
										viewBox="0 0 24 24"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</button>
								{legalDropdownOpen && (
									<div className="mobile-menu-legal-items">
										{defaultLegalItems.map((item, index) => (
											<Link
												key={index}
												href={item.href}
												onClick={handleClose}
												className="mobile-menu-legal-item"
											>
												{item.label}
											</Link>
										))}
									</div>
								)}
							</div>
						)}
					</nav>

					{/* Action Buttons */}
					<div className="mobile-menu-actions">
						<Link
							href={loginHref}
							onClick={handleClose}
							className="mobile-menu-button mobile-menu-button-login"
							style={{
								animationDelay: `${(defaultMenuItems.length + (defaultLegalItems.length > 0 ? 1 : 0)) * 0.05}s`
							}}
						>
							{isPL ? 'Logowanie' : 'Login'}
						</Link>

						<Link
							href={registerHref}
							onClick={handleClose}
							className="mobile-menu-button mobile-menu-button-register"
							style={{
								animationDelay: `${(defaultMenuItems.length + (defaultLegalItems.length > 0 ? 1 : 0) + 1) * 0.05}s`
							}}
						>
							{isPL ? 'Załóż darmowy zespół' : 'Create a free team'}
						</Link>
					</div>

					{/* Language Switcher */}
					{languageSwitcher && (
						<div 
							className="mobile-menu-language"
							style={{
								animationDelay: `${(defaultMenuItems.length + (defaultLegalItems.length > 0 ? 1 : 0) + 2) * 0.05}s`
							}}
						>
							<Link
								href={languageSwitcher.href}
								onClick={handleClose}
								className="mobile-menu-language-link"
							>
								<img 
									src={languageSwitcher.flagSrc} 
									alt={languageSwitcher.alt} 
									className="w-6 h-6" 
								/>
							</Link>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

