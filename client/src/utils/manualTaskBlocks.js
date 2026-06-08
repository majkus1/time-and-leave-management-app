import { calculateHoursFromRange } from './manualActivityBlockTime'

export const EMPTY_TASK_BLOCK = {
	taskId: '',
	hours: '',
	timeFrom: '',
	timeTo: '',
}

export function blocksFromWorkdayTasks(workday) {
	if (!workday || !Array.isArray(workday.manualTaskBlocks) || workday.manualTaskBlocks.length === 0) {
		return []
	}
	return workday.manualTaskBlocks.map(block => ({
		taskId: block.taskId ? String(block.taskId._id || block.taskId) : '',
		hours: block.hours != null ? String(block.hours) : '',
		timeFrom: block.timeFrom || '',
		timeTo: block.timeTo || '',
	}))
}

export function createDefaultTaskBlock(defaultTaskId = '') {
	return { ...EMPTY_TASK_BLOCK, taskId: defaultTaskId }
}

export function sumTaskBlockHours(blocks) {
	let total = 0
	for (const block of blocks) {
		const hours = resolveTaskBlockHours(block)
		if (hours != null && hours > 0) total += hours
	}
	return Math.round(total * 2) / 2
}

export function resolveTaskBlockHours(block) {
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

export function buildRealTimeFromTaskBlocks(blocks) {
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

export function serializeTaskBlocks(blocks) {
	return blocks
		.map(block => {
			const hours = resolveTaskBlockHours(block)
			if (!block.taskId?.trim() || hours == null || hours <= 0) return null
			return {
				taskId: block.taskId.trim(),
				hours,
				timeFrom: block.timeFrom?.trim() || null,
				timeTo: block.timeTo?.trim() || null,
			}
		})
		.filter(Boolean)
}

export function validateTaskBlocksClient(blocks, t) {
	if (!blocks.length) {
		return t('workcalendar.tasks.errors.atLeastOne')
	}
	let total = 0
	for (let i = 0; i < blocks.length; i += 1) {
		const block = blocks[i]
		if (!block.taskId?.trim()) {
			return t('workcalendar.tasks.errors.taskRequired', { row: i + 1 })
		}
		const hours = resolveTaskBlockHours(block)
		if (hours == null || hours <= 0 || hours > 24) {
			return t('workcalendar.tasks.errors.invalidHours', { row: i + 1 })
		}
		if ((block.timeFrom?.trim() && !block.timeTo?.trim()) || (!block.timeFrom?.trim() && block.timeTo?.trim())) {
			return t('workcalendar.tasks.errors.timePair', { row: i + 1 })
		}
		total += hours
	}
	if (total > 24) {
		return t('workcalendar.tasks.errors.dayTotalExceeded')
	}
	return null
}
