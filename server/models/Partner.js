const mongoose = require('mongoose')

/**
 * Partner programu partnerskiego (np. biuro rachunkowe) — poleca Planopię i dostaje prowizję od płatności
 * poleconych firm. partnerTeamId: zespół partnera w Planopii (panel partnera), opcjonalny.
 */
const partnerSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 200 },
		nip: { type: String, default: '', trim: true, maxlength: 32 },
		email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
		/** Kod w linku planopia.pl/?ref=KOD — małe litery, cyfry, myślnik (utils/referralCode) */
		code: { type: String, required: true, trim: true, lowercase: true, maxlength: 32 },
		/** Ułamek kwoty netto płatności, np. 0.2 = 20% */
		commissionRate: { type: Number, default: 0.2, min: 0, max: 1 },
		/** Ile miesięcy od polecenia naliczamy prowizję; null = bezterminowo */
		commissionMonths: { type: Number, default: null, min: 1 },
		status: { type: String, enum: ['active', 'paused'], default: 'active' },
		partnerTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
		notes: { type: String, default: '', maxlength: 2000 },
	},
	{ collection: 'partners', timestamps: true }
)

partnerSchema.index({ code: 1 }, { unique: true })
partnerSchema.index({ partnerTeamId: 1 }, { unique: true, partialFilterExpression: { partnerTeamId: { $type: 'objectId' } } })

module.exports = conn => conn.models.Partner || conn.model('Partner', partnerSchema)
