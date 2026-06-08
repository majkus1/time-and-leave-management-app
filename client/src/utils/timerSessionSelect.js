import { getWorkActivityName } from './workActivities'

export function buildTimerSelectValue({ activityId = '', taskId = '', workDescription = '' } = {}) {
	if (activityId) return `activity_${activityId}`
	if (taskId) return `task_${taskId}`
	if (workDescription) return `work_${workDescription}`
	return ''
}

export function parseTimerSelectValue(value, { allTasks = [], workActivities = [], locale = 'pl' } = {}) {
	if (!value) {
		return { activityId: '', taskId: '', workDescription: '' }
	}
	if (value.startsWith('activity_')) {
		const activityId = value.replace('activity_', '')
		const activity = workActivities.find(item => item.id === activityId)
		return {
			activityId,
			taskId: '',
			workDescription: getWorkActivityName(activity, locale) || '',
		}
	}
	if (value.startsWith('task_')) {
		const taskId = value.replace('task_', '')
		const task = allTasks.find(item => String(item._id) === String(taskId))
		return {
			activityId: '',
			taskId,
			workDescription: task?.title || '',
		}
	}
	if (value.startsWith('work_')) {
		const workDescription = value.replace('work_', '')
		return {
			activityId: '',
			taskId: '',
			workDescription,
		}
	}
	return { activityId: '', taskId: '', workDescription: '' }
}

export function getTimerSessionDisplayName(group, locale, t) {
	if (group.activityId && group.activityName) {
		return group.activityName
	}
	if (group.activityId && group.activityNameEn && locale === 'en') {
		return group.activityNameEn
	}
	if (group.task?.title) return group.task.title
	if (group.workDescription) return group.workDescription
	return t('sessions.noDescription')
}
