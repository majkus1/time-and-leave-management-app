const VALID_GROUPS = new Set(['line', 'task', 'other'])

function sanitizeWorkActivity(raw) {
	if (!raw || typeof raw.id !== 'string' || !raw.id.trim()) return null
	if (typeof raw.name !== 'string' || !raw.name.trim()) return null
	const group = VALID_GROUPS.has(raw.group) ? raw.group : 'other'
	const trackQuantity = raw.trackQuantity === true
	const unit = raw.unit && String(raw.unit).trim() ? String(raw.unit).trim().slice(0, 24) : ''
	return {
		id: raw.id.trim(),
		name: raw.name.trim(),
		nameEn: raw.nameEn && String(raw.nameEn).trim() ? String(raw.nameEn).trim() : undefined,
		group,
		trackQuantity,
		unit,
		isEnabled: raw.isEnabled !== false,
	}
}

function getEnabledWorkActivities(settings) {
	const list = Array.isArray(settings?.workActivities) ? settings.workActivities : []
	return list.filter(item => item && item.isEnabled !== false && item.id && item.name)
}

function getEnabledWorkActivityIds(settings) {
	return new Set(getEnabledWorkActivities(settings).map(item => item.id))
}

function getEnabledWorkActivityMap(settings) {
	const map = new Map()
	for (const activity of getEnabledWorkActivities(settings)) {
		map.set(activity.id, activity)
	}
	return map
}

function validateWorkActivitiesArray(activities) {
	if (!Array.isArray(activities)) {
		return { ok: false, message: 'workActivities must be an array' }
	}
	const sanitized = activities.map(sanitizeWorkActivity).filter(Boolean)
	const ids = new Set()
	for (const item of sanitized) {
		if (ids.has(item.id)) {
			return { ok: false, message: 'Duplicate work activity id' }
		}
		if (item.trackQuantity && !item.unit) {
			return { ok: false, message: 'Unit is required when quantity tracking is enabled' }
		}
		ids.add(item.id)
	}
	return { ok: true, activities: sanitized }
}

module.exports = {
	VALID_GROUPS,
	sanitizeWorkActivity,
	getEnabledWorkActivities,
	getEnabledWorkActivityIds,
	getEnabledWorkActivityMap,
	validateWorkActivitiesArray,
}
