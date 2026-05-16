const path = require('path')

function normalizeStoredFilename(raw) {
	if (!raw || typeof raw !== 'string') return null
	const decoded = decodeURIComponent(raw).replace(/\\/g, '/')
	const basename = path.basename(decoded)
	if (!basename || basename === '.' || basename.includes('..')) return null
	return basename
}

module.exports = {
	normalizeStoredFilename,
}
