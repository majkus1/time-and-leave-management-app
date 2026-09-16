import React, { createContext, useCallback, useContext, useState } from 'react'
import TutorialModal from '../components/tutorial/TutorialModal'

const TutorialContext = createContext(null)

export function TutorialProvider({ children }) {
	const [isOpen, setIsOpen] = useState(false)

	const openTutorial = useCallback(() => {
		setIsOpen(true)
	}, [])

	const closeTutorial = useCallback(() => {
		setIsOpen(false)
	}, [])

	return (
		<TutorialContext.Provider value={{ isOpen, openTutorial, closeTutorial }}>
			{children}
			<TutorialModal isOpen={isOpen} onClose={closeTutorial} />
		</TutorialContext.Provider>
	)
}

export function useTutorial() {
	const ctx = useContext(TutorialContext)
	if (!ctx) {
		throw new Error('useTutorial must be used within TutorialProvider')
	}
	return ctx
}
