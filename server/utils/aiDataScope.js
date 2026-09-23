/**
 * Zakresy danych asystenta AI dla przełożonego — czysta logika (bez bazy).
 *
 * Reguła 3 z CLAUDE.md: zakres EWIDENCJI (canSupervisorViewTimesheets) i zakres URLOPÓW
 * (canSupervisorApproveLeaves) to różne zbiory. Wcześniej asystent brał ich sumę, więc przełożony
 * z samym uprawnieniem do urlopów dostawał przez czat/eksport godziny pracy tych osób.
 *
 * @param {Array<{ id: any, timesheet: boolean, leave: boolean }>} entries — ocena per pracownik zespołu
 * @param {any} selfId — własne konto zawsze w obu zbiorach („ja + podlegli”)
 * @returns {{ timesheetUserIds: any[], leaveUserIds: any[] }}
 */
function splitSupervisorAiScopes(entries, selfId) {
	const selfStr = String(selfId)
	const timesheetUserIds = []
	const leaveUserIds = []
	let selfEntry = null
	for (const e of entries || []) {
		if (String(e.id) === selfStr) {
			selfEntry = e.id
			continue
		}
		if (e.timesheet) timesheetUserIds.push(e.id)
		if (e.leave) leaveUserIds.push(e.id)
	}
	const self = selfEntry ?? selfId
	timesheetUserIds.push(self)
	leaveUserIds.push(self)
	return { timesheetUserIds, leaveUserIds }
}

module.exports = { splitSupervisorAiScopes }
