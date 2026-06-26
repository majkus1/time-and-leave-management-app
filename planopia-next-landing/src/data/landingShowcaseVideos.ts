/**
 * Wideo używane wyłącznie w AboutAppShowcaseVideos (sekcja „O aplikacji” na homepage).
 * Nie linkować z homepage: 1.mp4 (~91 MB), ewi.mp4, aias.mp4 — są na blogach / video guide.
 */
export const LANDING_SHOWCASE_DESKTOP_VIDEOS = [
	'/img/timer-desktop.mp4',
	'/img/podsumowanie-ai-desktop.mp4',
] as const

export const LANDING_SHOWCASE_MOBILE_VIDEOS = [
	'/img/timer-mobile.mp4',
	'/img/ewidencja-mobile.mp4',
	'/img/urlop-zgloszenie-ai-mobile.mp4',
] as const

export const LANDING_SHOWCASE_MOBILE_FALLBACK: Record<'pl' | 'en', string> = {
	pl: '/img/mobilenews.webp',
	en: '/img/mobile-ennews.webp',
}
