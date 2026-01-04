// Helper functions for time selection with 15-minute intervals

// Generate time options (every 15 minutes) for select dropdown
// Returns array of objects: { value: '09:00', label: '09:00' }
export const generateTimeOptions = () => {
	const options = []
	for (let hour = 0; hour < 24; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const hourStr = String(hour).padStart(2, '0')
			const minuteStr = String(minute).padStart(2, '0')
			const value = `${hourStr}:${minuteStr}`
			options.push({ value, label: value })
		}
	}
	return options
}

// Calculate hours from time range
export const calculateHours = (timeFrom, timeTo) => {
	if (!timeFrom || !timeTo) return 0
	const parseTime = (timeStr) => {
		const [hours, minutes] = timeStr.split(':').map(Number)
		return hours + minutes / 60
	}
	const from = parseTime(timeFrom)
	const to = parseTime(timeTo)
	let hours = to - from
	if (hours < 0) hours += 24
	return Math.round(hours * 100) / 100
}


