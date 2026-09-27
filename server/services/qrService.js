const { firmDb } = require('../db/db')
const QRCode = require('../models/QRCode')(firmDb)
const User = require('../models/user')(firmDb)
const crypto = require('crypto')
const {
	normalizeQrMode,
	generateSecret,
	generateDisplayToken,
	evaluateScan,
	passForScan,
	WINDOW_SEC,
	QR_MODES,
} = require('../utils/qrScreenToken')
const {
	normalizeGeoPolicy,
	isValidLatLng,
	clampRadius,
	hasSite,
	parseGeoReading,
	evaluateGeo,
} = require('../utils/qrGeoCheck')

/**
 * Check if user has permission to manage QR codes (Admin or HR)
 * @param {string} userId - User ID
 * @returns {Promise<{hasPermission: boolean, user: Object|null}>}
 */
exports.checkQRCodePermission = async (userId) => {
	try {
		const user = await User.findById(userId)
		if (!user) {
			return { hasPermission: false, user: null }
		}

		const isAdmin = user.roles.includes('Admin')
		const isHR = user.roles.includes('HR')

		return {
			hasPermission: isAdmin || isHR,
			user
		}
	} catch (error) {
		console.error('Error checking QR code permission:', error)
		throw new Error('Błąd podczas sprawdzania uprawnień')
	}
}

/**
 * Generate unique QR code for team
 * @param {string} teamId - Team ID
 * @param {string} name - QR code name
 * @param {string} createdBy - User ID who created the code
 * @returns {Promise<Object>} Created QR code
 */
exports.generateQRCode = async (teamId, name, createdBy) => {
	try {
		if (!name || !name.trim()) {
			throw new Error('Nazwa kodu QR jest wymagana')
		}

		// Generate unique code
		let code
		let isUnique = false
		let attempts = 0
		const maxAttempts = 10 // Prevent infinite loop

		// Ensure code is unique
		while (!isUnique && attempts < maxAttempts) {
			const randomString = crypto.randomBytes(8).toString('hex')
			code = `${teamId.toString().slice(-6)}-${randomString}`

			const existing = await QRCode.findOne({ code })
			if (!existing) {
				isUnique = true
			}
			attempts++
		}

		if (!isUnique) {
			throw new Error('Nie udało się wygenerować unikalnego kodu QR. Spróbuj ponownie.')
		}

		// Create QR code
		const qrCode = new QRCode({
			teamId,
			code,
			name: name.trim(),
			createdBy
		})

		await qrCode.save()

		return {
			_id: qrCode._id,
			code: qrCode.code,
			name: qrCode.name,
			teamId: qrCode.teamId,
			isActive: qrCode.isActive,
			createdAt: qrCode.createdAt
		}
	} catch (error) {
		console.error('Error generating QR code:', error)
		throw error
	}
}

/**
 * Get all active QR codes for team
 * @param {string} teamId - Team ID
 * @returns {Promise<Array>} Array of QR codes
 */
exports.getTeamQRCodes = async (teamId) => {
	try {
		// screenSecret ma select:false — do listy trafia tylko token linku wyświetlacza (lista jest dla Admin/HR)
		const qrCodes = await QRCode.find({ teamId, isActive: true })
			.populate('createdBy', 'firstName lastName')
			.sort({ createdAt: -1 })

		return qrCodes
	} catch (error) {
		console.error('Error getting QR codes:', error)
		throw new Error('Błąd podczas pobierania kodów QR')
	}
}

/**
 * Delete (soft delete) QR code
 * @param {string} qrCodeId - QR code ID
 * @param {string} teamId - Team ID
 * @returns {Promise<Object>} Deleted QR code
 */
exports.deleteQRCode = async (qrCodeId, teamId) => {
	try {
		const qrCode = await QRCode.findOne({ _id: qrCodeId, teamId })
		if (!qrCode) {
			throw new Error('Kod QR nie znaleziony')
		}

		qrCode.isActive = false
		await qrCode.save()

		return { message: 'Kod QR został usunięty' }
	} catch (error) {
		console.error('Error deleting QR code:', error)
		throw error
	}
}

/**
 * Verify QR code (public - no auth required)
 * @param {string} code - QR code string
 * @returns {Promise<Object>} QR code verification result
 */
exports.verifyQRCode = async (code, { t, p } = {}) => {
	try {
		const qrCode = await QRCode.findOne({ code, isActive: true })
			.select('+screenSecret')
			.populate('teamId', 'name')

		if (!qrCode) {
			return {
				valid: false,
				message: 'Nieprawidłowy kod QR'
			}
		}

		// Tryb ekranu: sprawdzamy token z ekranu teraz (przed logowaniem) i wydajemy przepustkę na czas logowania
		const scan = exports.evaluateScan(qrCode, { t, p })
		const geoPolicy = normalizeGeoPolicy(qrCode.geo?.policy)
		return {
			valid: true,
			code: qrCode.code,
			name: qrCode.name,
			teamId: qrCode.teamId._id,
			teamName: qrCode.teamId.name,
			mode: normalizeQrMode(qrCode.mode),
			scanAllowed: scan.allowed,
			scanMethod: scan.method,
			scanReason: scan.reason || null,
			pass: passForScan(qrCode, scan, { p }),
			// Klient pyta o lokalizację tylko, gdy kod jej wymaga (pozycji miejsca nie ujawniamy)
			geoPolicy: geoPolicy !== 'off' && hasSite(qrCode.geo) ? geoPolicy : 'off',
		}
	} catch (error) {
		console.error('Error verifying QR code:', error)
		throw new Error('Błąd podczas weryfikacji kodu QR')
	}
}

/**
 * Ocena skanu dla dokumentu kodu (musi mieć screenSecret, jeśli tryb ekranu) — logika w utils/qrScreenToken.
 * @returns {{ allowed: boolean, method: 'screen'|'print'|null, via: 'token'|'pass'|null, reason?: string }}
 */
exports.evaluateScan = (qrCode, { t, p } = {}) => evaluateScan(qrCode, { t, p })

/** Ocena lokalizacji przy skanie (utils/qrGeoCheck); `geo` z żądania: { lat, lng, accuracy } albo { error } */
exports.evaluateScanGeo = (qrCode, geo) =>
	evaluateGeo({ policy: qrCode?.geo?.policy, site: qrCode?.geo, reading: parseGeoReading(geo) })

/**
 * Lokalizacja przy skanie (Admin/HR, tylko własny zespół). Pozycja miejsca z przycisku „Użyj mojej pozycji”;
 * polityka inna niż 'off' wymaga ustawionej pozycji — inaczej sprawdzanie byłoby pozorne.
 */
exports.setQRCodeGeo = async (qrCodeId, teamId, { policy, lat, lng, accuracy, radiusM } = {}) => {
	const qrCode = await QRCode.findOne({ _id: qrCodeId, teamId, isActive: true })
	if (!qrCode) throw new Error('Kod QR nie znaleziony')
	const geo = qrCode.geo ? qrCode.geo.toObject() : {}
	if (lat !== undefined || lng !== undefined) {
		const toCoord = v => (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '') ? Number(v) : NaN)
		const la = toCoord(lat)
		const ln = toCoord(lng)
		if (!isValidLatLng(la, ln)) {
			const err = new Error('Nieprawidłowa pozycja miejsca')
			err.status = 400
			throw err
		}
		const acc = Number(accuracy)
		geo.lat = la
		geo.lng = ln
		geo.siteAccuracyM = Number.isFinite(acc) && acc > 0 ? Math.round(acc) : null
		geo.siteSetAt = new Date()
	}
	if (radiusM !== undefined) geo.radiusM = clampRadius(radiusM)
	if (policy !== undefined) geo.policy = normalizeGeoPolicy(policy)
	if (normalizeGeoPolicy(geo.policy) !== 'off' && !hasSite(geo)) {
		const err = new Error('Najpierw ustaw pozycję miejsca')
		err.status = 400
		err.code = 'GEO_SITE_REQUIRED'
		throw err
	}
	qrCode.geo = geo
	await qrCode.save()
	return { _id: qrCode._id, geo: qrCode.geo }
}

/** Ustawienie trybu kodu (Admin/HR, tylko własny zespół). Tryb ekranu dostaje sekret i link wyświetlacza przy pierwszym włączeniu. */
exports.setQRCodeMode = async (qrCodeId, teamId, mode) => {
	if (!QR_MODES.includes(mode)) {
		const err = new Error('Nieprawidłowy tryb kodu QR')
		err.status = 400
		throw err
	}
	const nextMode = normalizeQrMode(mode)
	const qrCode = await QRCode.findOne({ _id: qrCodeId, teamId, isActive: true }).select('+screenSecret')
	if (!qrCode) throw new Error('Kod QR nie znaleziony')
	qrCode.mode = nextMode
	if (nextMode !== 'print') {
		if (!qrCode.screenSecret) qrCode.screenSecret = generateSecret()
		if (!qrCode.displayToken) qrCode.displayToken = generateDisplayToken()
	}
	await qrCode.save()
	return { _id: qrCode._id, mode: qrCode.mode, displayToken: qrCode.displayToken }
}

/** Nowy link wyświetlacza i nowy sekret — stare wyświetlacze i zrobione wcześniej zdjęcia przestają działać. */
exports.rotateDisplayLink = async (qrCodeId, teamId) => {
	const qrCode = await QRCode.findOne({ _id: qrCodeId, teamId, isActive: true }).select('+screenSecret')
	if (!qrCode) throw new Error('Kod QR nie znaleziony')
	qrCode.screenSecret = generateSecret()
	qrCode.displayToken = generateDisplayToken()
	await qrCode.save()
	return { _id: qrCode._id, mode: qrCode.mode, displayToken: qrCode.displayToken }
}

/**
 * Dane dla wyświetlacza (publiczne, bez logowania — dostęp wyznacza token linku). Zwraca sekret, bo tablet liczy
 * token lokalnie (działa przy chwilowym braku sieci); kto ma link, ten i tak „stoi przed ekranem”. Link da się unieważnić.
 */
exports.getDisplayData = async displayToken => {
	if (!displayToken || typeof displayToken !== 'string' || displayToken.length < 16) return null
	const qrCode = await QRCode.findOne({ displayToken, isActive: true }).select('+screenSecret').populate('teamId', 'name isActive')
	// Zespół wyłączony albo trwale usunięty (populate → null) — wyświetlacz przestaje działać
	if (!qrCode || !qrCode.teamId || qrCode.teamId.isActive === false) return null
	if (normalizeQrMode(qrCode.mode) === 'print' || !qrCode.screenSecret) return null
	return {
		name: qrCode.name,
		code: qrCode.code,
		teamName: qrCode.teamId?.name || '',
		secret: qrCode.screenSecret,
		windowSec: WINDOW_SEC,
		serverTime: Date.now(),
	}
}
