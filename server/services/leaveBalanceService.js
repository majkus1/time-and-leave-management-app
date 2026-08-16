// services/leaveBalanceService.js
//
// Zapis automatycznego rozliczenia puli urlopowej. Decyzję „co zrobić" podejmuje
// czysty moduł utils/leaveBalanceAutoDeduction — tutaj jest wyłącznie dostęp do bazy,
// żeby reguły dało się testować bez Mongo.
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const { resolveAutoDeductionPlan, resolveNextBalance } = require('../utils/leaveBalanceAutoDeduction')

const NOT_APPLIED = { applied: false, action: 'none' }

/**
 * Rozlicza pulę urlopową pracownika po zmianie statusu wniosku i zapisuje ślad.
 *
 * Wywołuj PO utrwaleniu nowego statusu wniosku — wtedy najgorszy możliwy skutek
 * awarii bazy w połowie operacji to nieruszona pula, którą admin poprawi ręcznie,
 * a nie oddanie dni, których nikt nie pobrał.
 *
 * @param {Object} params
 * @param {Object} params.settings - ustawienia zespołu
 * @param {Object} params.leaveRequest - dokument wniosku (mutowany o pola śladu)
 * @param {String} params.previousStatus - status sprzed zmiany
 * @param {String|null} params.nextStatus - status po zmianie; null przy usunięciu wniosku
 * @param {Boolean} [params.persistLedger=true] - false, gdy wniosek zaraz zniknie z bazy
 */
async function applyLeaveBalanceAutoDeduction({
	settings,
	leaveRequest,
	previousStatus,
	nextStatus,
	persistLedger = true,
}) {
	const plan = resolveAutoDeductionPlan({ settings, leaveRequest, previousStatus, nextStatus })
	if (plan.action === 'none') return NOT_APPLIED

	const user = await User.findById(leaveRequest.userId).select('leaveTypeDays').lean()
	if (!user) return NOT_APPLIED

	const leaveTypeDays = user.leaveTypeDays && typeof user.leaveTypeDays === 'object' ? user.leaveTypeDays : {}
	const nextBalance = resolveNextBalance(leaveTypeDays[leaveRequest.type], plan)

	// Pracownik nie ma przypisanej puli dla tego typu — automat jej nie tworzy.
	// Przy zwrocie kasujemy ślad, bo pobranie straciło pokrycie w danych.
	if (nextBalance === null) {
		if (plan.action === 'refund') await clearLedger(leaveRequest, persistLedger)
		return NOT_APPLIED
	}

	// Klucze leaveTypeDays zawierają kropki (np. „leaveform.option1"), więc $inc na
	// pojedynczym polu jest niemożliwy — zapisujemy cały obiekt.
	await User.updateOne(
		{ _id: leaveRequest.userId },
		{ $set: { leaveTypeDays: { ...leaveTypeDays, [leaveRequest.type]: nextBalance } } }
	)

	if (plan.action === 'deduct') {
		await writeLedger(leaveRequest, plan.amount, plan.unit, persistLedger)
	} else {
		await clearLedger(leaveRequest, persistLedger)
	}

	return { applied: true, action: plan.action, amount: plan.amount, unit: plan.unit, nextBalance }
}

async function writeLedger(leaveRequest, amount, unit, persist) {
	leaveRequest.autoDeductedAmount = amount
	leaveRequest.autoDeductedUnit = unit
	if (persist) {
		await LeaveRequest.updateOne(
			{ _id: leaveRequest._id },
			{ $set: { autoDeductedAmount: amount, autoDeductedUnit: unit } }
		)
	}
}

async function clearLedger(leaveRequest, persist) {
	leaveRequest.autoDeductedAmount = null
	leaveRequest.autoDeductedUnit = null
	if (persist) {
		await LeaveRequest.updateOne(
			{ _id: leaveRequest._id },
			{ $set: { autoDeductedAmount: null, autoDeductedUnit: null } }
		)
	}
}

module.exports = {
	applyLeaveBalanceAutoDeduction,
}
