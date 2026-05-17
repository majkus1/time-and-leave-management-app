import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTutorial } from '../../context/TutorialContext'

function TutorialInfoBar() {
	const { i18n } = useTranslation()
	const { openTutorial } = useTutorial()
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		// Sprawdź czy pasek był zamknięty w localStorage
		const isDismissed = localStorage.getItem('tutorialInfoBarDismissed') === 'true'
		if (!isDismissed) {
			setIsVisible(true)
		}
	}, [])

	const handleDismiss = () => {
		setIsVisible(false)
		localStorage.setItem('tutorialInfoBarDismissed', 'true')
	}

	const handleOpenTutorial = () => {
		openTutorial()
	}

	if (!isVisible) {
		return null
	}

	return (
		<>
			<div className="tutorial-info-bar">
				<div style={{
					display: 'flex',
					alignItems: 'center',
					gap: '12px',
					flex: 1,
					minWidth: 0
				}}>
					<div style={{
						width: '24px',
						height: '24px',
						flexShrink: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#667eea'
					}}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="16" x2="12" y2="12"></line>
							<line x1="12" y1="8" x2="12.01" y2="8"></line>
						</svg>
					</div>
					<div style={{
						flex: 1,
						minWidth: 0
					}}>
						<span className="tutorial-info-text">
							{i18n.resolvedLanguage === 'pl' 
								? (
									<>
										Nowa instrukcja dostępna.{' '}
										<button
											onClick={handleOpenTutorial}
											className="tutorial-info-link"
										>
											Zobacz tutaj
										</button>
									</>
								)
								: (
									<>
										New guide available.{' '}
										<button
											onClick={handleOpenTutorial}
											className="tutorial-info-link"
										>
											View here
										</button>
									</>
								)
							}
						</span>
					</div>
				</div>
				<button
					onClick={handleDismiss}
					style={{
						background: 'transparent',
						border: 'none',
						cursor: 'pointer',
						padding: '4px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: '4px',
						color: '#6b7280',
						transition: 'all 0.2s',
						flexShrink: 0,
						width: '24px',
						height: '24px'
					}}
					onMouseEnter={(e) => {
						e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
						e.target.style.color = '#1f2937'
					}}
					onMouseLeave={(e) => {
						e.target.style.backgroundColor = 'transparent'
						e.target.style.color = '#6b7280'
					}}
					aria-label={i18n.resolvedLanguage === 'pl' ? 'Zamknij' : 'Close'}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

		</>
	)
}

export default TutorialInfoBar
