import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AIAssistantHelpModules from './AIAssistantHelpModules'

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: key => {
			const map = {
				'aiAssistant.help.modulesLabel': 'Temat',
				'aiAssistant.help.suggestionsLabel': 'Przykładowe pytania',
				'aiAssistant.help.modulesLoadError': 'Nie udało się pobrać listy tematów.',
				'aiAssistant.help.modules.general': 'Planopia ogólnie',
				'aiAssistant.help.modules.qr': 'Kody QR',
			}
			return map[key] || key
		},
	}),
}))

const modules = [
	{ id: 'general', title: 'Planopia — ogólnie', summary: 'Start', suggestedQuestions: ['Od czego zacząć?', 'Czy działa na telefonie?'] },
	{ id: 'qr', title: 'Kody QR — wejście i wyjście', summary: 'QR', suggestedQuestions: ['Czy QR skanuje się telefonem?'] },
	{ id: 'leave', title: 'Urlopy i nieobecności', summary: 'Urlopy', suggestedQuestions: ['Jak złożyć wniosek?'] },
]

describe('AIAssistantHelpModules', () => {
	it('renderuje chipy z etykietami i18n (fallback: tytuł z API) i podpowiedzi modułu ogólnego', () => {
		render(<AIAssistantHelpModules modules={modules} activeModule={null} onSelectModule={() => {}} onAsk={() => {}} />)
		expect(screen.getByRole('button', { name: 'Planopia ogólnie' })).toBeTruthy()
		expect(screen.getByRole('button', { name: 'Kody QR' })).toBeTruthy()
		// brak klucza i18n dla "leave" w mocku → tytuł z API
		expect(screen.getByRole('button', { name: 'Urlopy i nieobecności' })).toBeTruthy()
		expect(screen.getByRole('button', { name: 'Od czego zacząć?' })).toBeTruthy()
		expect(screen.queryByRole('button', { name: 'Jak złożyć wniosek?' })).toBeNull()
	})

	it('aktywny chip ma aria-pressed, jego podpowiedzi są widoczne, ponowny klik odznacza', () => {
		const onSelectModule = vi.fn()
		render(<AIAssistantHelpModules modules={modules} activeModule="qr" onSelectModule={onSelectModule} onAsk={() => {}} />)
		const qr = screen.getByRole('button', { name: 'Kody QR' })
		expect(qr.getAttribute('aria-pressed')).toBe('true')
		expect(screen.getByRole('button', { name: 'Czy QR skanuje się telefonem?' })).toBeTruthy()
		fireEvent.click(qr)
		expect(onSelectModule).toHaveBeenCalledWith(null)
		fireEvent.click(screen.getByRole('button', { name: 'Urlopy i nieobecności' }))
		expect(onSelectModule).toHaveBeenCalledWith('leave')
	})

	it('klik podpowiedzi wysyła pytanie; disabled blokuje; błąd listy pokazuje komunikat', () => {
		const onAsk = vi.fn()
		const { rerender } = render(
			<AIAssistantHelpModules modules={modules} activeModule="qr" onSelectModule={() => {}} onAsk={onAsk} />
		)
		fireEvent.click(screen.getByRole('button', { name: 'Czy QR skanuje się telefonem?' }))
		expect(onAsk).toHaveBeenCalledWith('Czy QR skanuje się telefonem?')

		rerender(<AIAssistantHelpModules modules={modules} activeModule="qr" onSelectModule={() => {}} onAsk={onAsk} disabled loadError />)
		expect(screen.getByRole('button', { name: 'Kody QR' }).disabled).toBe(true)
		expect(screen.getByRole('status').textContent).toContain('Nie udało się pobrać')
	})
})
