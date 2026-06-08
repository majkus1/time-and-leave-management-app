const { getEnabledWorkActivityIds } = require('./workActivities')

async function resolveTimerActivityId(Settings, teamId, activityId) {
	if (activityId === undefined) return undefined
	if (activityId === null || activityId === '') return null
	const settings = await Settings.getSettings(teamId)
	const enabledIds = getEnabledWorkActivityIds(settings)
	const trimmed = String(activityId).trim()
	return enabledIds.has(trimmed) ? trimmed : null
}

function buildSessionGroupKey(session) {
	if (session.activityId) return `activity_${session.activityId}`
	if (session.taskId) return `task_${session.taskId.toString()}`
	return `desc_${(session.workDescription || '').trim().toLowerCase()}`
}

function getActivityFromSettings(settings, activityId) {
	if (!activityId || !settings?.workActivities) return null
	return settings.workActivities.find(item => item.id === activityId) || null
}

async function getTimerActivitySnapshot(Settings, teamId, activityId, rawQuantity) {
	if (!activityId) {
		return {
			activityName: '',
			activityNameEn: '',
			activityGroup: '',
			quantity: null,
			unit: '',
		}
	}

	const settings = await Settings.getSettings(teamId)
	const activity = getActivityFromSettings(settings, activityId)
	let quantity = null
	if (activity?.trackQuantity === true && rawQuantity !== undefined && rawQuantity !== null && rawQuantity !== '') {
		const parsed = Number(rawQuantity)
		if (!Number.isFinite(parsed) || parsed < 0) {
			return { error: 'INVALID_QUANTITY' }
		}
		quantity = parsed
	}

	return {
		activityName: activity?.name || '',
		activityNameEn: activity?.nameEn || '',
		activityGroup: activity?.group || '',
		quantity,
		unit: activity?.trackQuantity === true ? activity?.unit || '' : '',
	}
}

function groupTimerSessions(allSessions, settings, calculateMinutes) {
	const groupedSessions = {}

	for (const session of allSessions) {
		if (session.isBreak) continue

		const groupKey = buildSessionGroupKey(session)
		const activity = session.activityId ? getActivityFromSettings(settings, session.activityId) : null

		if (!groupedSessions[groupKey]) {
			groupedSessions[groupKey] = {
				workDescription: session.workDescription || '',
				task: session.task || null,
				taskId: session.taskId || null,
				activityId: session.activityId || null,
				activityName: session.activityName || activity?.name || '',
				activityNameEn: session.activityNameEn || activity?.nameEn || '',
				quantity: 0,
				unit: session.unit || activity?.unit || '',
				efficiency: null,
				sessions: [],
				totalMinutes: 0,
				totalHours: 0,
				percentage: 0,
			}
		}

		if (session.startTime && session.endTime) {
			const minutes = calculateMinutes(session.startTime, session.endTime)
			groupedSessions[groupKey].sessions.push(session)
			groupedSessions[groupKey].totalMinutes += minutes
			if (Number.isFinite(Number(session.quantity))) {
				groupedSessions[groupKey].quantity += Number(session.quantity)
				if (!groupedSessions[groupKey].unit && session.unit) groupedSessions[groupKey].unit = session.unit
			}
		}
	}

	Object.values(groupedSessions).forEach(group => {
		const hours = group.totalMinutes / 60
		group.quantity = Math.round(group.quantity * 100) / 100
		group.efficiency = group.quantity > 0 && hours > 0
			? Math.round((group.quantity / hours) * 100) / 100
			: null
	})

	return groupedSessions
}

module.exports = {
	resolveTimerActivityId,
	buildSessionGroupKey,
	getActivityFromSettings,
	getTimerActivitySnapshot,
	groupTimerSessions,
}
