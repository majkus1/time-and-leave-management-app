/** Teams with 11 seats (register + startup sync). Halo Rental System: 15 miejsc (Core S), rozliczenia ręczne — poza tą listą. */
const SPECIAL_ELEVATED_SEAT_TEAM_NAMES = [
	'OficjalnyAdminowy',
	/** Testowy zespół — 11 miejsc, Starter, rozliczenia ręczne. */
	'testokresprobny',
	'vxvxvxv',
	'qwd',
]

/** Unmetered AI — tylko wskazane zespoły wewnętrzne. */
const SPECIAL_UNLIMITED_AI_TEAM_NAMES = ['OficjalnyAdminowy']

/**
 * Starter w aplikacji (limity jak Starter), rozliczenie ręcznymi przelewami —
 * w UI nie pokazujemy daty końca opłaconego okresu.
 */
const SPECIAL_MANUAL_BILLING_TEAM_NAMES = ['Halo Rental System', 'testokresprobny', 'vxvxvxv', 'qwd']

/**
 * Zespoły wymuszające tryb „structural legacy” (jak konta sprzed billing w Mongo),
 * mimo że mają zapisane trial/billing — do czasu aktywnej płatnej subskrypcji.
 */
const FORCE_LEGACY_PRE_BILLING_TEAM_NAMES = ['testnewversion', 'legacy', 'lip420']

/**
 * Testowe wymuszenie freemium (freemiumApiGuard + entitlementy) dopóki **brak aktywnej płatnej subskrypcji**
 * (isPaidSubscriptionActive). Po wykupieniu planu zespół zachowuje się jak zwykły płatny.
 * Tej samej nazwy nie dodawaj do FORCE_LEGACY — wtedy `ent.legacy` i kopia w Pakietach sugerują grandfathering mimo freemium.
 */
const FORCE_FREEMIUM_TEST_TEAM_NAMES = ['testleeegacy', 'qwww', 'eeee', 'czxczczc']

/**
 * Koniec okresu grandfathered legacy dla wybranej nazwy zespołu (pierwsza chwila PO ostatnim dniu grace).
 * Domyślnie (brak wpisu) używany jest LEGACY_PRE_BILLING_GRACE_UNTIL z planCatalog.
 */
const LEGACY_GRACE_UNTIL_ISO_BY_TEAM_NAME = Object.freeze({})

/**
 * Nadpisanie puli AI jednorazowej na okres legacy (domyślnie LEGACY_PRE_BILLING_GRACE_ONE_OFF_AI_TOTAL z planCatalog).
 */
const LEGACY_GRACE_ONE_OFF_AI_TOTAL_BY_TEAM_NAME = Object.freeze({})

/** @deprecated alias — użyj SPECIAL_ELEVATED_SEAT_TEAM_NAMES; zachowane dla istniejących importów */
const SPECIAL_TEAM_NAMES = SPECIAL_ELEVATED_SEAT_TEAM_NAMES

const { LEGACY_PRE_BILLING_GRACE_ONE_OFF_AI_TOTAL } = require('./planCatalog')

function legacyGraceUntilForTeam(team, defaultGraceUntil) {
	if (!team?.name || !defaultGraceUntil) return defaultGraceUntil
	const iso = LEGACY_GRACE_UNTIL_ISO_BY_TEAM_NAME[team.name]
	return iso ? new Date(iso) : defaultGraceUntil
}

function legacyGraceOneOffAiTotalForTeam(team) {
	if (!team) return null
	const override = team.name && LEGACY_GRACE_ONE_OFF_AI_TOTAL_BY_TEAM_NAME[team.name]
	if (Number.isFinite(override)) return override
	return LEGACY_PRE_BILLING_GRACE_ONE_OFF_AI_TOTAL
}

module.exports = {
	SPECIAL_TEAM_NAMES,
	SPECIAL_ELEVATED_SEAT_TEAM_NAMES,
	SPECIAL_UNLIMITED_AI_TEAM_NAMES,
	SPECIAL_MANUAL_BILLING_TEAM_NAMES,
	FORCE_LEGACY_PRE_BILLING_TEAM_NAMES,
	FORCE_FREEMIUM_TEST_TEAM_NAMES,
	LEGACY_GRACE_UNTIL_ISO_BY_TEAM_NAME,
	LEGACY_GRACE_ONE_OFF_AI_TOTAL_BY_TEAM_NAME,
	legacyGraceUntilForTeam,
	legacyGraceOneOffAiTotalForTeam,
}
