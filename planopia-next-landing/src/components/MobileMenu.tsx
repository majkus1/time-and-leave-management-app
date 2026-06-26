'use client'

import React, { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { resetBodyScrollLock } from '@/lib/bodyScrollLock'

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
	loginHref?: string
	registerHref?: string
	languageSwitcher?: {
		href: string
		flagSrc: string
		alt: string
	}
	/** Sekcja pod główną nawigacją (np. Branże) */
	industrySectionTitle?: string
	industryLinks?: Array<{ href: string; label: string }>
	/** Po ilu elementach z menuItems wstawić „Branże” (np. 3 = po Cenniku). Brak = na końcu listy (stare zachowanie). */
	industryInsertIndex?: number
}

export default function MobileMenu({
	isOpen,
	onClose,
	onCloseRequest,
	lang = 'pl',
	menuItems = [],
	loginHref = 'https://app.planopia.pl/',
	registerHref = 'https://app.planopia.pl/team-registration',
	languageSwitcher,
	industrySectionTitle,
	industryLinks = [],
	industryInsertIndex
}: MobileMenuProps) {
	const [isClosing, setIsClosing] = React.useState(false)
	const [industryOpen, setIndustryOpen] = React.useState(false)
	const isPL = lang === 'pl'

	// Reset closing state when menu opens
	useEffect(() => {
		if (isOpen) {
			setIsClosing(false)
		}
	}, [isOpen])

	useEffect(() => {
		if (!isOpen && !isClosing) {
			setIndustryOpen(false)
		}
	}, [isOpen, isClosing])

	// Klasa wizualna (header, czat) — także w trakcie animacji zamykania
	const menuVisible = isOpen || isClosing
	useEffect(() => {
		if (menuVisible) {
			document.body.classList.add('mobile-menu-open')
		} else {
			document.body.classList.remove('mobile-menu-open')
		}
		return () => {
			document.body.classList.remove('mobile-menu-open')
		}
	}, [menuVisible])

	// Blokada scrolla tylko gdy menu jest otwarte (nie podczas animacji zamykania / nawigacji)
	useEffect(() => {
		if (isOpen && !isClosing) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen, isClosing])

	// Handle close with animation
	const handleClose = useCallback(() => {
		if (isClosing) return // Prevent multiple clicks
		resetBodyScrollLock()
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
	const defaultMenuItems =
		menuItems.length > 0
			? menuItems
			: [
					{ href: isPL ? '/#oaplikacji' : '/en#aboutapp', label: isPL ? 'O Aplikacji' : 'About the App' },
					{ href: isPL ? '/#asystent-ai' : '/en#ai-assistant', label: isPL ? 'Asystent AI' : 'AI Assistant' },
					{ href: isPL ? '/#cennik' : '/en#prices', label: isPL ? 'Cennik' : 'Pricing' },
					{ href: isPL ? '/blog' : '/en/blog', label: 'Blog' },
					{ href: isPL ? '/#kontakt' : '/en#contact', label: isPL ? 'Kontakt' : 'Contact' },
				]

	const hasIndustry = Boolean(industrySectionTitle && industryLinks.length > 0)
	const insertIdx =
		hasIndustry && industryInsertIndex !== undefined
			? Math.max(0, Math.min(industryInsertIndex, defaultMenuItems.length))
			: hasIndustry
				? defaultMenuItems.length
				: null
	const navBefore = insertIdx === null ? defaultMenuItems : defaultMenuItems.slice(0, insertIdx)
	const navAfter = insertIdx === null ? [] : defaultMenuItems.slice(insertIdx)
	/* sloty nawigacji: linki + ewentualnie przycisk „Branże”; przy rozwinięciu + podlinki */
	const collapsedNavSlots = navBefore.length + (hasIndustry ? 1 : 0) + navAfter.length
	const menuCount = collapsedNavSlots + (industryOpen ? industryLinks.length : 0)

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
						{navBefore.map((item, index) => (
							<Link
								key={`b-${index}-${item.href}`}
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
						{hasIndustry && (
							<>
								<button
									type="button"
									className="mobile-menu-item mobile-menu-industry-toggle !text-blue-600 hover:!text-blue-600"
									style={{ animationDelay: `${navBefore.length * 0.05}s` }}
									onClick={() => setIndustryOpen((v) => !v)}
									aria-expanded={industryOpen}
									aria-controls="mobile-menu-industry-list">
									<span className="!text-blue-600">{industrySectionTitle}</span>
									<span className="mobile-menu-industry-chevron !text-blue-600" aria-hidden>
										{industryOpen ? '▾' : '▸'}
									</span>
								</button>
								{industryOpen && (
									<div id="mobile-menu-industry-list" className="mobile-menu-industry-children">
										{industryLinks.map((item, i) => (
											<Link
												key={item.href}
												href={item.href}
												onClick={handleClose}
												className="mobile-menu-item mobile-menu-industry-child"
												style={{
													animationDelay: `${(navBefore.length + 1 + i) * 0.05}s`
												}}>
												{item.label}
											</Link>
										))}
									</div>
								)}
							</>
						)}
						{navAfter.map((item, index) => {
							const slot =
								navBefore.length + (hasIndustry ? 1 : 0) + (industryOpen ? industryLinks.length : 0) + index
							return (
								<Link
									key={`a-${index}-${item.href}`}
									href={item.href}
									onClick={() => {
										handleClose()
										if (item.onClick) item.onClick()
									}}
									className="mobile-menu-item"
									style={{
										animationDelay: `${slot * 0.05}s`
									}}
								>
									{item.label}
								</Link>
							)
						})}
					</nav>

					{/* Action Buttons */}
					<div className="mobile-menu-actions">
						<Link
							href={loginHref}
							onClick={handleClose}
							className="mobile-menu-button mobile-menu-button-login"
							style={{
								animationDelay: `${menuCount * 0.05}s`
							}}
						>
							{isPL ? 'Logowanie' : 'Login'}
						</Link>

						<Link
							href={registerHref}
							onClick={handleClose}
							className="mobile-menu-button mobile-menu-button-register"
							style={{
								animationDelay: `${(menuCount + 1) * 0.05}s`
							}}
						>
							{isPL ? 'Załóż darmowy zespół' : 'Create your free team'}
						</Link>
					</div>

					{/* Language Switcher */}
					{languageSwitcher && (
						<div
							className="mobile-menu-language"
							style={{
								animationDelay: `${(menuCount + 2) * 0.05}s`
							}}
						>
							<Link href={languageSwitcher.href} onClick={handleClose} className="mobile-menu-language-link">
								<img src={languageSwitcher.flagSrc} alt={languageSwitcher.alt} className="w-6 h-6" />
							</Link>
						</div>
					)}
				</div>
			</div>
		</>
	)
}
