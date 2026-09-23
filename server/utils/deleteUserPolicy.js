/**
 * Kto może usunąć (dezaktywować) użytkownika — czysta funkcja, bez bazy.
 * Wszystkie odmowy MUSZĄ zapaść przed jakimkolwiek zapisem (np. przekazaniem administracji zespołu):
 * wcześniej transfer isTeamAdmin wykonywał się przed tymi sprawdzeniami, więc obcy użytkownik
 * dostawał 403, ale zmiana w cudzym zespole już była w bazie.
 */
function resolveDeleteUserDecision({ requesterId, requesterTeamId, requesterRoles, targetId, targetTeamId }) {
	if (String(requesterId) === String(targetId)) {
		return { allowed: false, status: 403, message: 'Nie można usunąć własnego konta. Skontaktuj się z administratorem zespołu.' }
	}
	if (!targetTeamId || String(targetTeamId) !== String(requesterTeamId)) {
		return { allowed: false, status: 403, message: 'Nie można usunąć użytkownika z innego zespołu' }
	}
	if (!Array.isArray(requesterRoles) || !requesterRoles.includes('Admin')) {
		return { allowed: false, status: 403, message: 'Brak uprawnień - tylko administrator może usuwać innych użytkowników' }
	}
	return { allowed: true }
}

module.exports = { resolveDeleteUserDecision }
