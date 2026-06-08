const removeDiacritics = (value) => (
	String(value || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
)

export const safeFilenamePart = (value, fallback = 'raport') => {
	const safe = removeDiacritics(value)
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase()
	return safe || fallback
}

export const buildReportFilename = ({ locale = 'pl', pl, en, parts = [], extension }) => {
	const language = String(locale || 'pl').toLowerCase().startsWith('pl') ? 'pl' : 'en'
	const title = language === 'pl' ? pl : en
	const body = [title, ...parts]
		.filter(Boolean)
		.map(part => safeFilenamePart(part))
		.join('-')
	const ext = String(extension || '').replace(/^\./, '')
	return ext ? `${body}.${ext}` : body
}
