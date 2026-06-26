/** Assety wpisu o darmowej ewidencji — bez brakującego /img/ewidencja.webp. */
export const BLOG_FREE_APP_VIDEO_DESKTOP = '/img/ewi.mp4'
export const BLOG_FREE_APP_VIDEO_MOBILE = '/img/ewi-mob.mp4'

export const BLOG_FREE_APP_POSTER = {
	pl: { mobile: '/img/mobilenews.webp', desktop: '/img/desktopnews.webp' },
	en: { mobile: '/img/mobile-ennews.webp', desktop: '/img/desktopnews.webp' },
} as const

export const BLOG_FREE_APP_OG = {
	url: 'https://planopia.pl/img/desktopnews.webp',
	width: 1200,
	height: 630,
	alt: {
		pl: 'Darmowa aplikacja do ewidencji czasu pracy — Planopia',
		en: 'Free time tracking app — Planopia',
	},
} as const

/** Proporcje miniatury pod hero (aspect-video). */
export const BLOG_FREE_APP_MEDIA_SIZE = { width: 1200, height: 675 } as const
