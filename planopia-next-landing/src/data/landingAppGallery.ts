/** Miniaturki z `/public/img` — osobne pliki PL / EN tam, gdzie istnieją warianty `-en` w nazwie */
export type LandingGalleryImage = {
	srcPl: string
	srcEn: string
	altPl: string
	altEn: string
}

export const LANDING_APP_GALLERY_IMAGES: LandingGalleryImage[] = [
	{
		srcPl: '/img/desktop.png',
		srcEn: '/img/desktop-en.png',
		altPl: 'Planopia na komputerze — widok aplikacji i kalendarz',
		altEn: 'Planopia on desktop — app view and calendar',
	},
	{
		srcPl: '/img/zadania-mobile.webp',
		srcEn: '/img/zadania-mobile-en.webp',
		altPl: 'Tablice zadań — widok na telefonie',
		altEn: 'Task boards — mobile view',
	},
	{
		srcPl: '/img/plans-urlopnew.webp',
		srcEn: '/img/plans-urlopnewen.webp',
		altPl: 'Plan urlopów i nieobecności w zespole',
		altEn: 'Team leave and absence plan',
	},
	{
		srcPl: '/img/wniosek-urlop.webp',
		srcEn: '/img/planopia-leaveen.webp',
		altPl: 'Wniosek urlopowy w systemie',
		altEn: 'Leave management view (English UI)',
	},
	{
		srcPl: '/img/aigrafik.webp',
		srcEn: '/img/aigrafik-en.webp',
		altPl: 'Widok Asystenta AI — grafik i harmonogram',
		altEn: 'AI Assistant view — schedule and shifts',
	},
	{
		srcPl: '/img/mobilenews.webp',
		srcEn: '/img/mobile-ennews.webp',
		altPl: 'Mobilny widok Planopii',
		altEn: 'Planopia mobile interface',
	},
]
