const mongoose = require('mongoose')

const customHolidaySchema = new mongoose.Schema({
	date: {
		type: String, // Format: YYYY-MM-DD
		required: true
	},
	name: {
		type: String,
		required: true
	}
}, { _id: false })

const settingsSchema = new mongoose.Schema({
	teamId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Team',
		required: true,
		unique: true,
		index: true
	},
	workOnWeekends: {
		type: Boolean,
		default: true, // Domyślnie pracuje się w weekendy
		required: true
	},
	includePolishHolidays: {
		type: Boolean,
		default: false, // Domyślnie wyłączone
		required: true
	},
	includeCustomHolidays: {
		type: Boolean,
		default: false, // Domyślnie wyłączone
		required: true
	},
	customHolidays: {
		type: [customHolidaySchema],
		default: []
	},
	// Wspólne godziny pracy dla wszystkich dni roboczych
	workHours: {
		timeFrom: {
			type: String, // Format: HH:mm (e.g., "09:00")
			required: false,
			validate: {
				validator: function(v) {
					return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
				},
				message: 'timeFrom must be in HH:mm format'
			}
		},
		timeTo: {
			type: String, // Format: HH:mm (e.g., "17:00")
			required: false,
			validate: {
				validator: function(v) {
					return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
				},
				message: 'timeTo must be in HH:mm format'
			}
		},
		hours: {
			type: Number, // Obliczone godziny (e.g., 8 dla 09:00-17:00)
			required: false,
			min: 0,
			max: 24
		}
	}
}, {
	timestamps: true
})

// Pobierz ustawienia dla danego zespołu (jeden dokument na zespół)
settingsSchema.statics.getSettings = async function(teamId) {
	if (!teamId) {
		throw new Error('teamId is required')
	}
	
	let settings = await this.findOne({ teamId })
	if (!settings) {
		// Utwórz domyślne ustawienia dla zespołu
		settings = await this.create({ 
			teamId,
			workOnWeekends: true,
			includePolishHolidays: false,
			includeCustomHolidays: false,
			customHolidays: []
		})
	} else {
		// Migracja: jeśli istnieje stary dokument z includeHolidays, zamień na includePolishHolidays
		if (settings.includeHolidays !== undefined && settings.includePolishHolidays === undefined) {
			settings.includePolishHolidays = settings.includeHolidays
			settings.includeCustomHolidays = false
			delete settings.includeHolidays
			await settings.save()
		}
		// Migracja: jeśli brakuje teamId, ustaw go (dla starych dokumentów)
		if (!settings.teamId) {
			settings.teamId = teamId
			await settings.save()
		}
		// Upewnij się, że nowe pola istnieją
		if (settings.includePolishHolidays === undefined) settings.includePolishHolidays = false
		if (settings.includeCustomHolidays === undefined) settings.includeCustomHolidays = false
		if (settings.customHolidays === undefined) settings.customHolidays = []
		await settings.save()
	}
	return settings
}

module.exports = conn => (conn.models.Settings || conn.model('Settings', settingsSchema))

