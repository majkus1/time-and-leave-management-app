const mongoose = require('mongoose')

/**
 * Powiązanie biura rachunkowego (zespół z organizationType 'office') z firmą-klientem. Biuro widzi dane kadrowe
 * firmy tylko przy statusie 'active', który ustawia Admin firmy po zgodzie (kto, kiedy, IP, przeglądarka, wersja DPA).
 * Odebranie dostępu działa od razu — każde zapytanie biura sprawdza status.
 */
const officeAccessSchema = new mongoose.Schema(
	{
		officeTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
		/** Firma; przy zaproszeniu od biura puste do chwili, gdy firma je przyjmie albo odrzuci */
		clientTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
		status: { type: String, enum: ['pending', 'active', 'declined', 'revoked'], required: true },
		/** Kto zaczął: firma (kod biura) albo biuro (zaproszenie na e-mail admina firmy) */
		initiatedBy: { type: String, enum: ['company', 'office'], required: true },
		/**
		 * Zaproszenie od biura: e-mail administratora firmy. Zapisujemy je zawsze (także gdy takiej firmy nie ma),
		 * żeby biuro nie mogło sprawdzać, kto ma konto w Planopii; firma widzi je po e-mailu swojego administratora.
		 */
		invitedEmail: { type: String, default: '', lowercase: true, trim: true, maxlength: 200 },
		createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		acceptedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
		acceptedAt: { type: Date, default: null },
		consentIp: { type: String, default: '', maxlength: 100 },
		consentUserAgent: { type: String, default: '', maxlength: 500 },
		dpaVersion: { type: String, default: '', maxlength: 50 },
		endedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
		endedBy: { type: String, enum: ['company', 'office', 'admin', null], default: null },
		endedAt: { type: Date, default: null },
	},
	{ collection: 'officeaccesses', timestamps: true }
)

// Jedno aktywne powiązanie na parę biuro–firma i jedno oczekujące zaproszenie biura na dany e-mail
officeAccessSchema.index(
	{ officeTeamId: 1, clientTeamId: 1 },
	{ unique: true, partialFilterExpression: { status: 'active' }, name: 'office_client_active_unique' }
)
officeAccessSchema.index(
	{ officeTeamId: 1, invitedEmail: 1 },
	{ unique: true, partialFilterExpression: { status: 'pending' }, name: 'office_invite_pending_unique' }
)
officeAccessSchema.index({ clientTeamId: 1, status: 1 })
officeAccessSchema.index({ invitedEmail: 1, status: 1 })
officeAccessSchema.index({ officeTeamId: 1, status: 1 })

module.exports = conn => conn.models.OfficeAccess || conn.model('OfficeAccess', officeAccessSchema)
