import { calculateHoursFromRange } from './manualActivityBlockTime'

export const EMPTY_ACTIVITY_BLOCK = {
	activityId: '',
	hours: '',
	timeFrom: '',
	timeTo: '',
	quantity: '',
}

export function blocksFromWorkday(workday) {
	if (!workday || !Array.isArray(workday.manualActivityBlocks) || workday.manualActivityBlocks.length === 0) {
		return []
	}
	return workday.manualActivityBlocks.map(block => ({
		activityId: block.activityId || '',
		hours: block.hours != null ? String(block.hours) : '',
		timeFrom: block.timeFrom || '',
		timeTo: block.timeTo || '',
		quantity: block.quantity != null ? String(block.quantity) : '',
	}))
}

export function createDefaultActivityBlock(defaultActivityId = '') {
	return { ...EMPTY_ACTIVITY_BLOCK, activityId: defaultActivityId }
}

export function sumBlockHours(blocks) {
	let total = 0
	for (const block of blocks) {
		const hours = resolveBlockHours(block)
		if (hours != null && hours > 0) total += hours
	}
	return Math.round(total * 2) / 2
}

export function resolveBlockHours(block) {
	if (!block) return null
	const fromTime = block.timeFrom?.trim() && block.timeTo?.trim()
		? calculateHoursFromRange(block.timeFrom.trim(), block.timeTo.trim())
		: null
	if (block.hours !== '' && block.hours != null) {
		const parsed = parseFloat(block.hours)
		if (!Number.isNaN(parsed) && parsed > 0) {
			return fromTime != null ? fromTime : Math.round(parsed * 2) / 2
		}
	}
	return fromTime
}

export function buildRealTimeFromBlocks(blocks) {
	return blocks
		.map(block => {
			if (block.timeFrom?.trim() && block.timeTo?.trim()) {
				return `${block.timeFrom.trim()}-${block.timeTo.trim()}`
			}
			return null
		})
		.filter(Boolean)
		.join(', ')
}

export function serializeActivityBlocks(blocks) {
	return blocks
		.map(block => {
			const hours = resolveBlockHours(block)
			if (!block.activityId?.trim() || hours == null || hours <= 0) return null
			return {
				activityId: block.activityId.trim(),
				hours,
				timeFrom: block.timeFrom?.trim() || null,
				timeTo: block.timeTo?.trim() || null,
				quantity: block.quantity !== '' && block.quantity != null ? Number(block.quantity) : null,
			}
		})
		.filter(Boolean)
}

export function validateActivityBlocksClient(blocks, t) {
	if (!blocks.length) {
		return t('workcalendar.activities.errors.atLeastOne')
	}
	let total = 0
	for (let i = 0; i < blocks.length; i += 1) {
		const block = blocks[i]
		if (!block.activityId?.trim()) {
			return t('workcalendar.activities.errors.activityRequired', { row: i + 1 })
		}
		const hours = resolveBlockHours(block)
		if (hours == null || hours <= 0 || hours > 24) {
			return t('workcalendar.activities.errors.invalidHours', { row: i + 1 })
		}
		if ((block.timeFrom?.trim() && !block.timeTo?.trim()) || (!block.timeFrom?.trim() && block.timeTo?.trim())) {
			return t('workcalendar.activities.errors.timePair', { row: i + 1 })
		}
		if (block.quantity !== '' && block.quantity != null) {
			const quantity = Number(block.quantity)
			if (!Number.isFinite(quantity) || quantity < 0) {
				return t('workcalendar.activities.errors.invalidQuantity', { row: i + 1 })
			}
		}
		total += hours
	}
	if (total > 24) {
		return t('workcalendar.activities.errors.dayTotalExceeded')
	}
	return null
}

export function isHalfHourStep(value) {
	const num = parseFloat(value)
	if (Number.isNaN(num)) return false
	const doubled = num * 2
	return Math.abs(doubled - Math.round(doubled)) < 0.01
}
