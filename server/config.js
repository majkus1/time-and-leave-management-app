// server/config.js
const appUrl =
	process.env.NODE_ENV === 'production'
		? 'https://app.planopia.pl'
		: 'http://localhost:3001'

/** Adres w mailach do klientów — zawsze produkcyjny (mail wysłany z dev nie może prowadzić na localhost). */
const publicAppUrl = (process.env.APP_PUBLIC_URL || 'https://app.planopia.pl').replace(/\/$/, '')

module.exports = {
	appUrl,
	publicAppUrl,
}
