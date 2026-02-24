const getStatusCode = (statusKey = '') => {
	if (typeof statusKey !== 'string') return ''
	return statusKey.startsWith('status.') ? statusKey.slice('status.'.length) : statusKey
}

const translateByKeyOrFallback = (t, key, fallback) => {
	if (typeof t !== 'function') return fallback
	const translated = t(key)
	return translated && translated !== key ? translated : fallback
}

/**
 * Returns status text adjusted to grammar context.
 * context:
 * - default: generic status label
 * - requestFeminine: for sentences like "prośba została ..."
 */
const getLeaveStatusText = (statusKey, t, context = 'default') => {
	const statusCode = getStatusCode(statusKey)
	const fallback = typeof t === 'function' ? t(statusKey) : statusCode

	if (context === 'requestFeminine') {
		return translateByKeyOrFallback(t, `statusRequestFeminine.${statusCode}`, fallback)
	}

	return fallback
}

module.exports = {
	getLeaveStatusText
}
