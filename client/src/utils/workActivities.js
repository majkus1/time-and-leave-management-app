export const WORK_ACTIVITY_GROUPS = [
	{ id: 'line', labelKey: 'workcalendar.activities.groupLine' },
	{ id: 'task', labelKey: 'workcalendar.activities.groupTask' },
	{ id: 'other', labelKey: 'workcalendar.activities.groupOther' },
]

export function getEnabledWorkActivities(activities = []) {
	if (!Array.isArray(activities)) return []
	return activities.filter(item => item && item.isEnabled !== false && item.id && item.name)
}

export function getWorkActivityName(activity, locale = 'pl') {
	if (!activity) return ''
	if (locale === 'en' && activity.nameEn) return activity.nameEn
	return activity.name || ''
}

export function findWorkActivityById(activities, activityId) {
	return (activities || []).find(item => item.id === activityId) || null
}

export function teamHasWorkActivities(settings) {
	return getEnabledWorkActivities(settings?.workActivities).length > 0
}
