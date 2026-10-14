const mongoose = require('mongoose')

/** Co biuro oglądało i eksportowało w danych firmy — widoczne dla firmy i właściciela platformy; wpisy wygasają po ~2 latach */
const officeAuditLogSchema = new mongoose.Schema(
	{
		officeTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
		clientTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		action: { type: String, enum: ['view_month', 'export_pdf', 'export_xlsx'], required: true },
		params: { type: mongoose.Schema.Types.Mixed, default: {} },
		ip: { type: String, default: '', maxlength: 100 },
		at: { type: Date, default: Date.now },
	},
	{ collection: 'officeauditlogs' }
)

officeAuditLogSchema.index({ clientTeamId: 1, at: -1 })
officeAuditLogSchema.index({ officeTeamId: 1, at: -1 })
officeAuditLogSchema.index({ at: 1 }, { expireAfterSeconds: 2 * 366 * 24 * 3600 })

module.exports = conn => conn.models.OfficeAuditLog || conn.model('OfficeAuditLog', officeAuditLogSchema)
