/**
 * Następny dzień kalendarzowy dla dat zapisanych jako północ UTC (tak trzymamy daty wniosków urlopowych).
 * Krok w czasie lokalnym (setDate) przesuwał się przy zmianie czasu: jesienią kalendarze gubiły ostatni dzień
 * zakresu (urlop 19–30.10 kończył się 29.10), wiosną przesuwały dni o jeden wstecz.
 */
export function stepToNextUtcDay(date) {
	date.setUTCDate(date.getUTCDate() + 1)
	return date
}
