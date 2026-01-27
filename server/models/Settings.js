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

// Schemat dla typu wniosku urlopowego/nieobecności
const leaveRequestTypeSchema = new mongoose.Schema({
	id: { type: String, required: true }, // Unikalny identyfikator (dla systemowych: 'leaveform.option1', dla niestandardowych: 'custom-xxx')
	name: { type: String, required: true }, // Nazwa typu (w języku zespołu)
	nameEn: { type: String }, // Nazwa w języku angielskim (opcjonalna)
	isSystem: { type: Boolean, default: false }, // Czy to typ systemowy
	isEnabled: { type: Boolean, default: true }, // Czy typ jest włączony dla zespołu
	requireApproval: { type: Boolean, default: true }, // Czy wymaga zatwierdzenia (false = automatycznie akceptowany jak L4)
	allowDaysLimit: { type: Boolean, default: false }, // Czy można ustawiać limit dni dla usera (dla systemowych: można włączyć/wyłączyć, dla custom: zawsze jeśli true)
	minDaysBefore: { type: Number, default: null }, // Minimalna liczba dni przed urlopem, na ile trzeba złożyć wniosek (null = brak limitu, np. 5 = trzeba złożyć minimum 5 dni przed)
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
	// Wspólne godziny pracy dla wszystkich dni roboczych (tablica konfiguracji)
	workHours: {
		type: [{
			timeFrom: {
				type: String, // Format: HH:mm (e.g., "09:00")
				required: true,
				validate: {
					validator: function(v) {
						return v && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
					},
					message: 'timeFrom must be in HH:mm format'
				}
			},
			timeTo: {
				type: String, // Format: HH:mm (e.g., "17:00")
				required: true,
				validate: {
					validator: function(v) {
						return v && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
					},
					message: 'timeTo must be in HH:mm format'
				}
			},
			hours: {
				type: Number, // Obliczone godziny (e.g., 8 dla 09:00-17:00)
				required: true,
				min: 0,
				max: 24
			}
		}],
		default: []
	},
	// Konfiguracja typów wniosków urlopowych/nieobecności
	leaveRequestTypes: {
		type: [leaveRequestTypeSchema],
		default: []
	},
	// Konfiguracja obliczania urlopów: 'days' lub 'hours'
	leaveCalculationMode: {
		type: String,
		enum: ['days', 'hours'],
		default: 'days',
		required: true
	},
	// Liczba godzin na jeden dzień urlopu (używane gdy leaveCalculationMode === 'hours')
	leaveHoursPerDay: {
		type: Number,
		default: 8,
		min: 0.5,
		max: 24,
		required: true
	}
}, {
	timestamps: true
})

// Domyślne typy systemowe wniosków urlopowych
const getDefaultSystemLeaveTypes = () => [
	{ id: 'leaveform.option1', name: 'Urlop wypoczynkowy', nameEn: 'Paid Vacation', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: true },
	{ id: 'leaveform.option2', name: 'Urlop okolicznościowy', nameEn: 'Special Leave', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: false },
	{ id: 'leaveform.option3', name: 'Urlop na żądanie', nameEn: 'On-Demand Leave', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: false },
	{ id: 'leaveform.option4', name: 'Urlop bezpłatny', nameEn: 'Unpaid Leave', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: false },
	{ id: 'leaveform.option5', name: 'Inna nieobecność', nameEn: 'Other Absence', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: false },
	{ id: 'leaveform.option6', name: 'Zwolnienie Lekarskie (L4)', nameEn: 'Sick Leave (L4)', isSystem: true, isEnabled: true, requireApproval: false, allowDaysLimit: false } // L4 - automatycznie akceptowany
]

// Pobierz ustawienia dla danego zespołu (jeden dokument na zespół)
settingsSchema.statics.getSettings = async function(teamId) {
	if (!teamId) {
		throw new Error('teamId is required')
	}
	
	let settings = await this.findOne({ teamId })
	if (!settings) {
		// Utwórz domyślne ustawienia dla zespołu z domyślnymi typami systemowymi
		settings = await this.create({ 
			teamId,
			workOnWeekends: true,
			includePolishHolidays: false,
			includeCustomHolidays: false,
			customHolidays: [],
			leaveRequestTypes: getDefaultSystemLeaveTypes()
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
		
		// Migracja: inicjalizuj leaveRequestTypes jeśli nie istnieje
		if (!settings.leaveRequestTypes || settings.leaveRequestTypes.length === 0) {
			settings.leaveRequestTypes = getDefaultSystemLeaveTypes()
			await settings.save()
		} else {
			// Upewnij się, że wszystkie typy systemowe są obecne (mogły zostać usunięte)
			const defaultTypes = getDefaultSystemLeaveTypes()
			const existingTypeIds = new Set(settings.leaveRequestTypes.map(t => t.id))
			const systemTypesToAdd = defaultTypes.filter(dt => !existingTypeIds.has(dt.id))
			if (systemTypesToAdd.length > 0) {
				settings.leaveRequestTypes.push(...systemTypesToAdd)
				await settings.save()
			}
		}
		
		// Migracja: jeśli workHours jest starym formatem (obiekt), zamień na tablicę
		if (settings.workHours && !Array.isArray(settings.workHours)) {
			// Stary format: { timeFrom, timeTo, hours }
			if (settings.workHours.timeFrom && settings.workHours.timeTo && settings.workHours.hours) {
				settings.workHours = [{
					timeFrom: settings.workHours.timeFrom,
					timeTo: settings.workHours.timeTo,
					hours: settings.workHours.hours
				}]
				await settings.save()
			} else {
				// Jeśli stary format jest pusty/null, ustaw jako pustą tablicę
				settings.workHours = []
				await settings.save()
			}
		}
		// Upewnij się, że workHours jest tablicą
		if (!Array.isArray(settings.workHours)) {
			settings.workHours = []
			await settings.save()
		}
		
		await settings.save()
	}
	return settings
}

module.exports = conn => (conn.models.Settings || conn.model('Settings', settingsSchema))

