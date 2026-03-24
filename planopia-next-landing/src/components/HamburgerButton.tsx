'use client'

import React from 'react'

interface HamburgerButtonProps {
	isOpen: boolean
	onClick: () => void
}

export default function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
	return (
		<button
			className={`mobile-menu-hamburger ${isOpen ? 'active' : ''} desktop:hidden`}
			onClick={onClick}
			aria-label={isOpen ? 'Zamknij menu' : 'Otwórz menu'}
			aria-expanded={isOpen}
		>
			<span />
			<span />
			<span />
		</button>
	)
}

