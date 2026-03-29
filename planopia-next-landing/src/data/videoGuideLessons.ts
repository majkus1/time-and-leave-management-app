/**
 * Materiały wideo — kolejność = numer na stronie.
 * `videoSrc` — wersja na desktop (≥ md). `videoSrcMobile` — tylko na wąskim ekranie; wtedy `videoSrc` jest ukryty na mobile.
 * Pliki w /public/img/ (np. 2.mp4, 2-mobile.mp4).
 */
export type VideoGuideLesson = {
	id: string
	titlePl: string
	titleEn: string
	descriptionPl: string
	descriptionEn: string
	/** Wersja na desktop i tablety (Tailwind md+) */
	videoSrc: string
	/** Opcjonalnie: wersja na mobile; jeśli brak — na wszystkich szerokościach używane jest `videoSrc` */
	videoSrcMobile?: string
}

export const videoGuideLessons: VideoGuideLesson[] = [
	{
		id: '1',
		titlePl: 'Jak ręcznie dodać godziny czasu pracy w ewidencji?',
		titleEn: 'How to manually add work hours in the time log?',
		descriptionPl:
			'Krótki film pokazuje ręczne uzupełnianie godzin pracy w miesięcznym kalendarzu ewidencji czasu w Planopii.',
		descriptionEn:
			'A short walkthrough of manually entering work hours in Planopia’s monthly time tracking calendar.',
		videoSrc: '/img/1.mp4',
		videoSrcMobile: '/img/1-mobile.mp4',
	},
]
