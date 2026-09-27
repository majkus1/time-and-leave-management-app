import { describe, expect, it } from 'vitest'
import { ownedSaleModules, saleModuleForCapability, usedSaleModules } from './planModules'

const modules = [
	{ id: 'timer_qr', capabilities: ['timer_qr'], monthlyNetPln: 39 },
	{ id: 'schedules_ai', capabilities: ['schedules_ai'], monthlyNetPln: 59 },
	{ id: 'tasks_chat', capabilities: ['tasks', 'chat'], monthlyNetPln: 59 },
]

describe('ownedSaleModules', () => {
	it('moduł z kilkoma funkcjami liczy się tylko, gdy zespół ma wszystkie', () => {
		expect(ownedSaleModules(modules, ['timer_qr', 'tasks', 'ai_assistant'])).toEqual(['timer_qr'])
		expect(ownedSaleModules(modules, ['tasks', 'chat'])).toEqual(['tasks_chat'])
	})

	it('pakiet ze wszystkimi funkcjami ma wszystkie moduły', () => {
		expect(ownedSaleModules(modules, ['timer_qr', 'schedules_ai', 'tasks', 'chat', 'ai_assistant'])).toEqual([
			'timer_qr',
			'schedules_ai',
			'tasks_chat',
		])
	})

	it('brak danych to brak modułów', () => {
		expect(ownedSaleModules(modules, undefined)).toEqual([])
		expect(ownedSaleModules(undefined, ['timer_qr'])).toEqual([])
	})
})

describe('usedSaleModules', () => {
	it('stary moduł „Zadania” podpowiada „Zadania i czat”', () => {
		expect(usedSaleModules(modules, ['tasks'])).toEqual(['tasks_chat'])
	})
})

describe('saleModuleForCapability', () => {
	it('czat i zadania kupuje się jako „Zadania i czat”', () => {
		expect(saleModuleForCapability(modules, 'chat')?.id).toBe('tasks_chat')
		expect(saleModuleForCapability(modules, 'tasks')?.id).toBe('tasks_chat')
		expect(saleModuleForCapability(modules, 'schedules_ai')?.monthlyNetPln).toBe(59)
	})

	it('asystent AI nie jest modułem do kupienia (jest w Core)', () => {
		expect(saleModuleForCapability(modules, 'ai_assistant')).toBeNull()
	})
})
