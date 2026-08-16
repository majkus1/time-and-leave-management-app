// utils/leaveRecipientsDisplay.js
//
// Przycinanie listy odbiorców wniosku do postaci bezpiecznej do pokazania
// pracownikowi w formularzu. Czyste funkcje, bez bazy — stąd osobny plik.

// Kolejność ma znaczenie: tak role są prezentowane, gdy ktoś pełni kilka naraz.
const ROLE_LABELS = [
	{ dbRole: 'Admin', key: 'admin' },
	{ dbRole: 'HR', key: 'hr' },
	{ dbRole: 'Przełożony (Supervisor)', key: 'supervisor' },
]

/**
 * @param {Array<Object>} users - dokumenty użytkowników (lub obiekty z tymi polami)
 * @param {Object} [options]
 * @param {String|ObjectId} [options.requesterId] - pracownik, którego dotyczy wniosek; nigdy nie trafia na listę
 * @returns {Array<{ id: String, firstName: String, lastName: String, roles: Array<String> }>}
 */
function formatLeaveRecipientsForDisplay(users, { requesterId } = {}) {
	const requesterKey = requesterId ? String(requesterId) : null

	return (Array.isArray(users) ? users : [])
		.filter(user => user && user._id && user.isActive !== false)
		.filter(user => !requesterKey || String(user._id) !== requesterKey)
		.map(user => ({
			id: String(user._id),
			firstName: user.firstName || '',
			lastName: user.lastName || '',
			roles: ROLE_LABELS.filter(({ dbRole }) => Array.isArray(user.roles) && user.roles.includes(dbRole)).map(
				({ key }) => key
			),
		}))
}

module.exports = {
	ROLE_LABELS,
	formatLeaveRecipientsForDisplay,
}
