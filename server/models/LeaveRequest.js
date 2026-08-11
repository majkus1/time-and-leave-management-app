const mongoose = require('mongoose')

const leaveRequestSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	type: {
		type: String,
		required: true, // Nie używamy już enum - typy są dynamiczne z Settings
	},
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	// UWAGA na wspolistnienie pol ilosciowych (szczegoly: server/utils/leaveSettlement.js):
	// - daysRequested jest wymagane ZAWSZE. Wniosek godzinowy zapisuje tu 1 (nie 0), bo pracownik
	//   faktycznie jest czesciowo nieobecny tego dnia — dzieki temu kalendarze i liczniki dni
	//   pozostaja spojne, a mieszanie jednostek naprawiamy jawnie w agregatach.
	// - hoursRequested > 0 jest JEDYNYM dyskryminatorem wniosku godzinowego w runtime.
	//   Nie wolno polegac na wartosci domyslnej settlementUnit: wnioski sa czytane przez .lean(),
	//   ktore omija defaulty Mongoose, wiec stare rekordy wracaja calkiem bez tych pol.
	// - settlementUnit i hoursPerDaySnapshot to zapis stanu z chwili zlozenia, dzieki czemu
	//   pozniejsza zmiana jednostki typu przez admina nigdy nie zmienia znaczenia starych rekordow.
	daysRequested: { type: Number, required: true },
	hoursRequested: { type: Number, default: null },
	settlementUnit: { type: String, enum: ['days', 'hours'], default: 'days' },
	hoursPerDaySnapshot: { type: Number, default: null },
	replacement: { type: String },
	additionalInfo: { type: String },
	// status: {
	// 	type: String,
	// 	enum: ['Oczekuje na akceptacje', 'Zaakceptowano', 'Odrzucono'],
	// 	default: 'Oczekuje na akceptacje',
	// },
	status: {
		type: String,
		enum: ['status.pending', 'status.accepted', 'status.rejected', 'status.sent'],
		default: 'status.pending'
	  },	  
	createdAt: { type: Date, default: Date.now },
	submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	isProcessed: { type: Boolean, default: false },
})

module.exports = conn => (conn.models.LeaveRequest || conn.model('LeaveRequest', leaveRequestSchema));

