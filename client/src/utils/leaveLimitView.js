// utils/leaveLimitView.js
//
// Pogodzenie zapisanej puli urlopowej z opcją automatycznego rozliczania.
//
// Bez tej opcji leaveTypeDays to ROCZNA PULA, a „pozostało" wychodzi
// z odjęcia zużycia policzonego z wniosków — dokładnie jak dotąd.
//
// Z włączoną opcją ta sama liczba jest już BIEŻĄCYM SALDEM, bo automat
// pomniejszył ją przy zatwierdzeniu. Odjęcie zużycia drugi raz pokazałoby
// 7 zamiast 11, więc pulę odtwarzamy z tego, co automat faktycznie pobrał.
//
// Bliźniaczy plik: server/utils/leaveLimitView.js — zmiany trzymać zgodnie.
import { convertLeaveAmount } from './leaveSettlement'

const round = value => Math.round((Number(value) || 0) * 10) / 10
const clampPercent = value => Math.min(100, Math.max(0, value))

/**
 * Ile automat pobrał z puli danego typu, w jednostce tego typu.
 * Czyta ślad zapisany na wnioskach, a nie przelicza ich od nowa — dzięki temu
 * późniejsza zmiana jednostki typu nie przesuwa odtworzonej puli.
 */
export function sumAutoDeductedAmount(requests, typeId, targetUnit, hoursPerDay) {
	if (!Array.isArray(requests)) return 0

	const total = requests.reduce((sum, request) => {
		if (!request || request.type !== typeId) return sum
		const amount = Number(request.autoDeductedAmount) || 0
		if (amount <= 0) return sum
		return sum + convertLeaveAmount(amount, request.autoDeductedUnit || targetUnit, targetUnit, hoursPerDay)
	}, 0)

	return round(total)
}

/**
 * Liczby do pokazania na pasku limitu.
 * @param {Object} params
 * @param {Number} params.storedValue - leaveTypeDays dla typu
 * @param {Number} params.used - zużycie policzone z wniosków
 * @param {Number} params.pending - wnioski oczekujące
 * @param {Number} params.autoDeducted - ile pobrał automat (0 przy wyłączonej opcji)
 * @param {Boolean} params.autoMode - czy zespół ma włączone automatyczne rozliczanie
 * @returns {{ limit, remaining, usagePercent, isExceeded, isAtRisk }}
 */
export function resolveLeaveLimitView({ storedValue, used = 0, pending = 0, autoDeducted = 0, autoMode = false }) {
	const stored = Number(storedValue) || 0
	const usedAmount = Number(used) || 0
	const pendingAmount = Number(pending) || 0

	if (!autoMode) {
		return {
			limit: stored,
			remaining: round(stored - usedAmount),
			usagePercent: stored > 0 ? clampPercent((usedAmount / stored) * 100) : 0,
			isExceeded: stored > 0 && usedAmount > stored,
			isAtRisk: stored > 0 && usedAmount <= stored && usedAmount + pendingAmount > stored,
		}
	}

	// Saldo jest źródłem prawdy; pulę odtwarzamy, żeby pasek postępu miał sens.
	const remaining = round(stored)
	const limit = round(stored + (Number(autoDeducted) || 0))

	return {
		limit,
		remaining,
		usagePercent: limit > 0 ? clampPercent(((limit - remaining) / limit) * 100) : 0,
		isExceeded: remaining < 0,
		isAtRisk: remaining >= 0 && remaining - pendingAmount < 0,
	}
}
