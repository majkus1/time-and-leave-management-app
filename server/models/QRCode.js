const mongoose = require('mongoose')
const crypto = require('crypto')

const qrCodeSchema = new mongoose.Schema({
	teamId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Team',
		required: true,
		index: true
	},
	code: {
		type: String,
		required: true,
		unique: true,
		index: true,
		sparse: true
	},
	name: {
		type: String,
		required: true,
		trim: true
	},
	isActive: {
		type: Boolean,
		default: true
	},
	/**
	 * Tryb skanu (utils/qrScreenToken): 'print' — stały wydruk (jak dotąd, domyślnie);
	 * 'screen' — tylko rotujący kod z ekranu (tablet); 'screen_or_print' — ekran, a wydruk awaryjnie z oznaczeniem.
	 */
	mode: {
		type: String,
		enum: ['print', 'screen', 'screen_or_print'],
		default: 'print'
	},
	/** Sekret HMAC tokenu ekranu — nigdy w listach dla klienta (select: false); zmiana unieważnia wyświetlacze */
	screenSecret: {
		type: String,
		default: null,
		select: false
	},
	/** Token linku wyświetlacza /qr-display/<token> (bez logowania) — Admin może go unieważnić */
	displayToken: {
		type: String,
		default: null,
		index: true,
		sparse: true
	},
	/**
	 * Lokalizacja przy skanie (utils/qrGeoCheck): polityka + pozycja miejsca i promień. Pozycję ustawia Admin/HR
	 * przyciskiem „Użyj mojej pozycji” na miejscu. Brak pola = 'off' (kody sprzed tej funkcji).
	 */
	geo: {
		type: new mongoose.Schema({
			policy: { type: String, enum: ['off', 'record', 'flag', 'block'], default: 'off' },
			lat: { type: Number, default: null },
			lng: { type: Number, default: null },
			radiusM: { type: Number, default: 150 },
			siteAccuracyM: { type: Number, default: null },
			siteSetAt: { type: Date, default: null }
		}, { _id: false }),
		default: () => ({})
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	}
}, {
	timestamps: true
})

module.exports = conn => conn.models.QRCode || conn.model('QRCode', qrCodeSchema)
