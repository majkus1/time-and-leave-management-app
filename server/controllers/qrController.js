const { firmDb } = require('../db/db')
const QRCode = require('../models/QRCode')(firmDb)
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)

// Generate QR code for team (Admin/HR only)
exports.generateQRCode = async (req, res) => {
	try {
		const { name } = req.body
		const userId = req.user.userId
		const teamId = req.user.teamId

		if (!name || !name.trim()) {
			return res.status(400).json({ message: 'Nazwa kodu QR jest wymagana' })
		}

		// Check if user is Admin or HR
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		const isAdmin = user.roles.includes('Admin')
		const isHR = user.roles.includes('HR')

		if (!isAdmin && !isHR) {
			return res.status(403).json({ message: 'Brak uprawnień' })
		}

		// Generate unique code
		const crypto = require('crypto')
		let code
		let isUnique = false
		
		// Ensure code is unique
		while (!isUnique) {
			const randomString = crypto.randomBytes(8).toString('hex')
			code = `${teamId.toString().slice(-6)}-${randomString}`
			
			const existing = await QRCode.findOne({ code })
			if (!existing) {
				isUnique = true
			}
		}

		// Create QR code
		const qrCode = new QRCode({
			teamId,
			code,
			name: name.trim(),
			createdBy: userId
		})

		await qrCode.save()

		res.status(201).json({
			_id: qrCode._id,
			code: qrCode.code,
			name: qrCode.name,
			teamId: qrCode.teamId,
			isActive: qrCode.isActive,
			createdAt: qrCode.createdAt
		})
	} catch (error) {
		console.error('Error generating QR code:', error)
		res.status(500).json({ message: 'Błąd podczas generowania kodu QR' })
	}
}

// Get all QR codes for team
exports.getTeamQRCodes = async (req, res) => {
	try {
		const teamId = req.user.teamId
		const userId = req.user.userId

		// Check if user is Admin or HR
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		const isAdmin = user.roles.includes('Admin')
		const isHR = user.roles.includes('HR')

		if (!isAdmin && !isHR) {
			return res.status(403).json({ message: 'Brak uprawnień' })
		}

		const qrCodes = await QRCode.find({ teamId, isActive: true })
			.populate('createdBy', 'firstName lastName')
			.sort({ createdAt: -1 })

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

		// Check if user is Admin or HR
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		const isAdmin = user.roles.includes('Admin')
		const isHR = user.roles.includes('HR')

		if (!isAdmin && !isHR) {
			return res.status(403).json({ message: 'Brak uprawnień' })
		}

		const qrCode = await QRCode.findOne({ _id: id, teamId })
		if (!qrCode) {
			return res.status(404).json({ message: 'Kod QR nie znaleziony' })
		}

		qrCode.isActive = false
		await qrCode.save()

		res.json({ message: 'Kod QR został usunięty' })
	} catch (error) {
		console.error('Error deleting QR code:', error)
		res.status(500).json({ message: 'Błąd podczas usuwania kodu QR' })
	}
}

// Verify QR code (public endpoint - no auth required)
exports.verifyQRCode = async (req, res) => {
	try {
		const { code } = req.params

		const qrCode = await QRCode.findOne({ code, isActive: true })
			.populate('teamId', 'name')

		if (!qrCode) {
			return res.status(404).json({ message: 'Nieprawidłowy kod QR' })
		}

		res.json({
			valid: true,
			code: qrCode.code,
			name: qrCode.name,
			teamId: qrCode.teamId._id,
			teamName: qrCode.teamId.name
		})
	} catch (error) {
		console.error('Error verifying QR code:', error)
		res.status(500).json({ message: 'Błąd podczas weryfikacji kodu QR' })
	}
}
