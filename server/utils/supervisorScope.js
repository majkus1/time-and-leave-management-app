/**
 * Zakres przełożonego — czysta logika (bez bazy), jedno źródło dla roleService.
 *
 * Model: przełożony jest przełożonym SWOJEGO DZIAŁU (działów), a dodatkowo może mieć WYBRANYCH pracowników
 * (także spoza działu). Lista wybranych, gdy niepusta i włączona, działa też jako lista odznaczeń w dziale.
 * Każde z trzech uprawnień (urlopy, ewidencja, grafik) ma własny przełącznik główny i zakres.
 *
 * Brak dokumentu SupervisorConfig = konfiguracja DOMYŚLNA (wszystkie uprawnienia, zakres „mój dział”,
 * brak wybranych) — dokładnie to, co tworzy ekran uprawnień. Wcześniej brak konfiguracji dawał dostęp
 * do całego zespołu, a lista w aplikacji pokazywała tylko dział.
 */
const SUPERVISOR_ROLE = 'Przełożony (Supervisor)'

const DEFAULT_SUPERVISOR_PERMISSIONS = Object.freeze({
	canApproveLeaves: true,
	canApproveLeavesDepartment: true,
	canApproveLeavesSelectedEmployees: true,
	canViewTimesheets: true,
	canViewTimesheetsDepartment: true,
	canViewTimesheetsSelectedEmployees: true,
	canManageSchedule: true,
	canManageScheduleDepartment: true,
	canManageScheduleCustom: true,
})

const toDepts = value => (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean)

function rolesOf(user) {
	return Array.isArray(user?.roles) ? user.roles : user?.roles ? [user.roles] : []
}

/** Konfiguracja w postaci do oceny; brak dokumentu → domyślna. */
function effectiveSupervisorConfig(config) {
	const permissions = { ...DEFAULT_SUPERVISOR_PERMISSIONS, ...(config?.permissions?.toObject ? config.permissions.toObject() : config?.permissions || {}) }
	const selectedEmployees = Array.isArray(config?.selectedEmployees) ? config.selectedEmployees.map(id => String(id?._id || id)) : []
	return { permissions, selectedEmployees }
}

/** Wynik dla Admin/HR (zawsze tak), braku roli przełożonego (nie) albo null = oceniaj konfigurację. */
function roleShortcut(user) {
	const roles = rolesOf(user)
	if (roles.includes('Admin') || roles.includes('HR')) return true
	if (!roles.includes(SUPERVISOR_ROLE)) return false
	return null
}

/**
 * Wspólna reguła dla urlopów i ewidencji: wybrany pracownik → tak; pracownik z działu → tak, chyba że
 * lista wybranych jest włączona i niepusta, a on na niej nie jest (odznaczony).
 */
function employeeInScope({ enabled, departmentOn, selectedOn }, config, supervisor, employee) {
	if (!enabled) return false
	const empId = String(employee?._id || '')
	const isSelected = config.selectedEmployees.includes(empId)
	if (selectedOn && isSelected) return true
	if (departmentOn) {
		const supDepts = toDepts(supervisor?.department)
		const inDept = toDepts(employee?.department).some(d => supDepts.includes(d))
		if (!inDept) return false
		if (selectedOn && config.selectedEmployees.length > 0) return isSelected
		return true
	}
	return false
}

function evaluateLeaveApproval(configDoc, supervisor, employee) {
	const shortcut = roleShortcut(supervisor)
	if (shortcut !== null) return shortcut
	const config = effectiveSupervisorConfig(configDoc)
	const p = config.permissions
	return employeeInScope(
		{ enabled: p.canApproveLeaves, departmentOn: p.canApproveLeavesDepartment, selectedOn: p.canApproveLeavesSelectedEmployees },
		config,
		supervisor,
		employee
	)
}

function evaluateTimesheetView(configDoc, supervisor, employee) {
	const shortcut = roleShortcut(supervisor)
	if (shortcut !== null) return shortcut
	const config = effectiveSupervisorConfig(configDoc)
	const p = config.permissions
	return employeeInScope(
		{ enabled: p.canViewTimesheets, departmentOn: p.canViewTimesheetsDepartment, selectedOn: p.canViewTimesheetsSelectedEmployees },
		config,
		supervisor,
		employee
	)
}

/**
 * Grafik: działowy — gdy to dział przełożonego; niestandardowy — gdy jest jego członkiem; zespołowy — nigdy
 * (Admin/HR). Bez konkretnego grafiku: czy ma jakiekolwiek uprawnienie do grafików.
 */
function evaluateScheduleManage(configDoc, supervisor, schedule = null) {
	const shortcut = roleShortcut(supervisor)
	if (shortcut !== null) return shortcut
	const { permissions: p } = effectiveSupervisorConfig(configDoc)
	if (!p.canManageSchedule) return false
	if (!schedule) return Boolean(p.canManageScheduleDepartment || p.canManageScheduleCustom)
	if (schedule.type === 'department' && p.canManageScheduleDepartment) {
		if (toDepts(supervisor?.department).includes(schedule.departmentName)) return true
	}
	if (schedule.type === 'custom' && p.canManageScheduleCustom) {
		const sid = String(supervisor?._id || '')
		if (Array.isArray(schedule.members) && schedule.members.some(m => String(m?._id || m) === sid)) return true
	}
	return false
}

/** Przełożony bez działu i bez wybranych pracowników nie ma nikogo pod sobą — do ostrzeżenia w UI. */
function supervisorHasNoScope(configDoc, supervisor) {
	const config = effectiveSupervisorConfig(configDoc)
	return toDepts(supervisor?.department).length === 0 && config.selectedEmployees.length === 0
}

/** Dokument nowej konfiguracji (domyślnej) — do zapisu przy nadaniu roli. */
function buildDefaultSupervisorConfig(supervisor, selectedEmployees = []) {
	return {
		supervisorId: supervisor._id,
		teamId: supervisor.teamId,
		permissions: { ...DEFAULT_SUPERVISOR_PERMISSIONS },
		selectedEmployees,
	}
}

module.exports = {
	SUPERVISOR_ROLE,
	DEFAULT_SUPERVISOR_PERMISSIONS,
	effectiveSupervisorConfig,
	evaluateLeaveApproval,
	evaluateTimesheetView,
	evaluateScheduleManage,
	supervisorHasNoScope,
	buildDefaultSupervisorConfig,
}
