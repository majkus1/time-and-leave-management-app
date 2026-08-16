// utils/leaveBalanceAutoDeduction.js
//
// Automatyczne rozliczanie puli urlopowej — opcja zespołu, domyślnie wyłączona.
// Gdy jest włączona, zatwierdzenie wniosku pomniejsza saldo pracownika
// (User.leaveTypeDays), a cofnięcie zatwierdzenia albo anulowanie je oddaje.
//
// Cała logika decyzyjna siedzi tutaj i jest czysta — bez bazy, bez zapisów —
// żeby dało się ją przetestować i żeby ścieżki zapisu miały jedno źródło prawdy.
const { getLeaveRequestTypeById } = require('./leaveRequestTypes')
const { resolveLeaveTypeSettlement, getLeaveRequestAmountInUnit } = require('./leaveSettlement')

// Typy systemowe, których automat nigdy nie rusza.
// Zwolnienie lekarskie: pracodawca nie ustala pracownikowi rocznej puli L4,
// więc pomniejszanie czegokolwiek po jego złożeniu byłoby błędem merytorycznym.
const AUTO_DEDUCTION_EXCLUDED_TYPE_IDS = ['leaveform.option6']

// Statusy, w których wniosek realnie zajmuje pulę. Zgodne z tym, jak zużycie
// liczą istniejące podsumowania (dashboard i modal statystyk).
const BALANCE_CONSUMING_STATUSES = ['status.accepted', 'status.sent']

const NO_CHANGE = { action: 'none', amount: 0, unit: null }

const roundAmount = value => Math.round((Number(value) || 0) * 10) / 10

function isBalanceConsumingStatus(status) {
	return BALANCE_CONSUMING_STATUSES.includes(status)
}

function isAutoDeductionEnabled(settings) {
	return settings?.autoDeductLeaveLimits === true
}

/**
 * Czy z tego typu automat w ogóle może pobierać.
 * Wymaga włączonej opcji, typu spoza listy wykluczonych i typu z włączoną pulą dni.
 */
function isAutoDeductibleType(settings, typeId) {
	if (!isAutoDeductionEnabled(settings)) return false
	if (AUTO_DEDUCTION_EXCLUDED_TYPE_IDS.includes(typeId)) return false
	return getLeaveRequestTypeById(settings, typeId)?.allowDaysLimit === true
}

/**
 * Co zrobić z saldem przy przejściu wniosku między statusami.
 *
 * Zwrot zależy WYŁĄCZNIE od śladu zapisanego na wniosku, nigdy od bieżącego
 * ustawienia — dzięki temu wyłączenie opcji nie zabiera pracownikowi dni,
 * które automat wcześniej pobrał.
 *
 * @param {Object} params
 * @param {Object} params.settings - ustawienia zespołu
 * @param {Object} params.leaveRequest - wniosek (z autoDeductedAmount/autoDeductedUnit)
 * @param {String} params.previousStatus - status przed zmianą
 * @param {String|null} params.nextStatus - status po zmianie; null oznacza usunięcie wniosku
 * @returns {{ action: 'deduct'|'refund'|'none', amount: Number, unit: String|null }}
 */
function resolveAutoDeductionPlan({ settings, leaveRequest, previousStatus, nextStatus }) {
	if (!leaveRequest) return NO_CHANGE

	const wasConsuming = isBalanceConsumingStatus(previousStatus)
	const willConsume = isBalanceConsumingStatus(nextStatus)
	const alreadyDeducted = roundAmount(leaveRequest.autoDeductedAmount)

	// Wniosek przestaje zajmować pulę — oddaj dokładnie tyle, ile zostało pobrane.
	if (wasConsuming && !willConsume) {
		if (alreadyDeducted <= 0) return NO_CHANGE
		return { action: 'refund', amount: alreadyDeducted, unit: leaveRequest.autoDeductedUnit || null }
	}

	// Wniosek zaczyna zajmować pulę.
	if (!wasConsuming && willConsume) {
		// Ślad już jest — nie pobieraj drugi raz (np. dwukrotne zatwierdzenie).
		if (alreadyDeducted > 0) return NO_CHANGE
		if (!isAutoDeductibleType(settings, leaveRequest.type)) return NO_CHANGE

		const settlement = resolveLeaveTypeSettlement(settings, leaveRequest.type)
		const amount = roundAmount(
			getLeaveRequestAmountInUnit(leaveRequest, settlement.unit, settlement.hoursPerDay)
		)
		if (amount <= 0) return NO_CHANGE
		return { action: 'deduct', amount, unit: settlement.unit }
	}

	return NO_CHANGE
}

/**
 * Nowe saldo po wykonaniu planu.
 * Zwraca null, gdy pracownik nie ma przypisanej puli dla tego typu — automat
 * niczego wtedy nie tworzy ani nie zmienia (pusta pula to świadoma decyzja admina).
 */
function resolveNextBalance(currentBalance, plan) {
	if (!plan || plan.action === 'none') return null
	if (currentBalance === undefined || currentBalance === null || currentBalance === '') return null

	const current = Number(currentBalance)
	if (!Number.isFinite(current)) return null

	// Saldo może zejść poniżej zera — to sygnał dla admina, że pula została
	// przekroczona. Ucinanie do zera ukrywałoby problem i gubiło informację.
	return roundAmount(plan.action === 'deduct' ? current - plan.amount : current + plan.amount)
}

module.exports = {
	AUTO_DEDUCTION_EXCLUDED_TYPE_IDS,
	BALANCE_CONSUMING_STATUSES,
	isBalanceConsumingStatus,
	isAutoDeductionEnabled,
	isAutoDeductibleType,
	resolveAutoDeductionPlan,
	resolveNextBalance,
}
