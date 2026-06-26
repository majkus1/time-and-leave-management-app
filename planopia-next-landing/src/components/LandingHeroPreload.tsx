import { LANDING_HERO_LCP } from '@/data/landingHeroAssets'

/** Hoisted to <head> by Next.js — wcześniejsze pobranie obrazu LCP (hero). */
export default function LandingHeroPreload() {
	return (
		<link
			rel="preload"
			as="image"
			href={LANDING_HERO_LCP.src}
			type="image/webp"
			fetchPriority="high"
			imageSrcSet={`${LANDING_HERO_LCP.src} ${LANDING_HERO_LCP.width}w`}
			imageSizes={LANDING_HERO_LCP.sizes}
		/>
	)
}
