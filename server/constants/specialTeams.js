/** Teams with 11 seats (register + startup sync). */
const SPECIAL_ELEVATED_SEAT_TEAM_NAMES = [
	'OficjalnyAdminowy',
	'Halo Rental System',
	/** Testowy zespół — ta sama logika co Halo (11 miejsc, Starter, rozliczenia ręczne). */
	'testokresprobny',
]

/** Unmetered AI — tylko wskazane zespoły wewnętrzne. */
const SPECIAL_UNLIMITED_AI_TEAM_NAMES = ['OficjalnyAdminowy']

/**
 * Starter w aplikacji (limity jak Starter), rozliczenie ręcznymi przelewami —
 * w UI nie pokazujemy daty końca opłaconego okresu.
 */
const SPECIAL_MANUAL_BILLING_TEAM_NAMES = ['Halo Rental System', 'testokresprobny']

/**
 * Zespoły wymuszające tryb „structural legacy” (jak konta sprzed billing w Mongo),
 * mimo że mają zapisane trial/billing — do czasu aktywnej płatnej subskrypcji.
 */
const FORCE_LEGACY_PRE_BILLING_TEAM_NAMES = ['testnewversion', 'legacy', 'testleeegacy']

/**
 * Testowe wymuszenie freemium (freemiumApiGuard + entitlementy) dopóki **brak aktywnej płatnej subskrypcji**
 * (isPaidSubscriptionActive). Po wykupieniu planu zespół zachowuje się jak zwykły płatny.
 */
const FORCE_FREEMIUM_TEST_TEAM_NAMES = ['testleeegacy']

/** @deprecated alias — użyj SPECIAL_ELEVATED_SEAT_TEAM_NAMES; zachowane dla istniejących importów */
const SPECIAL_TEAM_NAMES = SPECIAL_ELEVATED_SEAT_TEAM_NAMES

module.exports = {
	SPECIAL_TEAM_NAMES,
	SPECIAL_ELEVATED_SEAT_TEAM_NAMES,
	SPECIAL_UNLIMITED_AI_TEAM_NAMES,
	SPECIAL_MANUAL_BILLING_TEAM_NAMES,
	FORCE_LEGACY_PRE_BILLING_TEAM_NAMES,
	FORCE_FREEMIUM_TEST_TEAM_NAMES,
}
