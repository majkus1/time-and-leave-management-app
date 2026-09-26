const qrService = require('../services/qrService')
const { mapQrServiceError } = require('../utils/safeHttpErrors')

// Generate QR code for team (Admin/HR only)
exports.generateQRCode = async (req, res) => {
	try {
		const { name } = req.body
		const userId = req.user.userId
		const teamId = req.user.teamId

		// Check permissions
		const { hasPermission, user } = await qrService.checkQRCodePermission(userId)
		if (!hasPermission) {
			if (!user) {
				return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
			}
			return res.status(403).json({ message: 'Brak uprawnień' })
		}

		// Generate QR code (business logic in service)
		const qrCode = await qrService.generateQRCode(teamId, name, userId)

		res.status(201).json(qrCode)
	} catch (error) {
		console.error('Error generating QR code:', error)
		const { status, body } = mapQrServiceError(error, 'Błąd podczas generowania kodu QR')
		res.status(status).json(body)
	}
}

// Get all QR codes for team
exports.getTeamQRCodes = async (req, res) => {
	try {
		const teamId = req.user.teamId
		const userId = req.user.userId

		// Check permissions
		const { hasPermission, user } = await qrService.checkQRCodePermission(userId)
		if (!hasPermission) {
			if (!user) {
				return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
			}
			return res.status(403).json({ message: 'Brak uprawnień' })
		}

		// Get QR codes (business logic in service)
		const qrCodes = await qrService.getTeamQRCodes(teamId)

		res.json(qrCodes)
	} catch (error) {
		console.error('Error getting QR codes:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania kodów QR' })
	}
}

// Delete QR code
exports.deleteQRCode = async (req, res) => {
	try {
		const { id } = req.params
		const userId = req.user.userId
		const teamId = req.user.teamId

		// Check permissions
		const { hasPermission, user } = await qrService.checkQRCodePermission(userId)
		if (!hasPermission) {
			if (!user) {
				return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
			}
			return res.status(403).json({ message: 'Brak uprawnień' })
		}

		// Delete QR code (business logic in service)
		const result = await qrService.deleteQRCode(id, teamId)

		res.json(result)
	} catch (error) {
		console.error('Error deleting QR code:', error)
		const { status, body } = mapQrServiceError(error, 'Błąd podczas usuwania kodu QR')
		res.status(status).json(body)
	}
}

async function requireQrManager(req, res) {
	const { hasPermission, user } = await qrService.checkQRCodePermission(req.user.userId)
	if (!hasPermission) {
		res.status(user ? 403 : 404).json({ message: user ? 'Brak uprawnień' : 'Użytkownik nie znaleziony' })
		return false
	}
	return true
}

// Tryb kodu: wydruk / ekran / ekran + wydruk awaryjnie (Admin/HR)
exports.setQRCodeMode = async (req, res) => {
	try {
		if (!(await requireQrManager(req, res))) return
		const result = await qrService.setQRCodeMode(req.params.id, req.user.teamId, req.body?.mode)
		res.json(result)
	} catch (error) {
		console.error('Error setting QR mode:', error)
		const { status, body } = mapQrServiceError(error, 'Błąd podczas zmiany trybu kodu QR')
		res.status(status).json(body)
	}
}

// Nowy link wyświetlacza (unieważnia poprzedni i wcześniejsze tokeny) — Admin/HR
exports.rotateDisplayLink = async (req, res) => {
	try {
		if (!(await requireQrManager(req, res))) return
		res.json(await qrService.rotateDisplayLink(req.params.id, req.user.teamId))
	} catch (error) {
		console.error('Error rotating QR display link:', error)
		const { status, body } = mapQrServiceError(error, 'Błąd podczas tworzenia nowego linku')
		res.status(status).json(body)
	}
}

// Wyświetlacz (publiczny, bez logowania): dane do liczenia rotującego kodu
exports.getDisplayData = async (req, res) => {
	try {
		const data = await qrService.getDisplayData(req.params.displayToken)
		if (!data) return res.status(404).json({ message: 'Link wyświetlacza jest nieaktualny' })
		res.set('Cache-Control', 'no-store')
		res.json(data)
	} catch (error) {
		console.error('Error getting QR display data:', error)
		res.status(500).json({ message: 'Błąd wyświetlacza' })
	}
}

// Verify QR code (public endpoint - no auth required)
exports.verifyQRCode = async (req, res) => {
	try {
		const { code } = req.params

		// Verify QR code (business logic in service); t = token z ekranu, p = przepustka po logowaniu
		const result = await qrService.verifyQRCode(code, { t: req.query.t, p: req.query.p })

		if (!result.valid) {
			return res.status(404).json({ message: result.message || 'Nieprawidłowy kod QR' })
		}

		res.json(result)
	} catch (error) {
		console.error('Error verifying QR code:', error)
		res.status(500).json({ message: 'Błąd podczas weryfikacji kodu QR' })
	}
}
