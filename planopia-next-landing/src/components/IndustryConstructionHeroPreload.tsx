import { INDUSTRY_CONSTRUCTION_HERO } from '@/data/industryConstructionHeroAssets'

export default function IndustryConstructionHeroPreload() {
	return (
		<link
			rel="preload"
			as="image"
			href={INDUSTRY_CONSTRUCTION_HERO.src}
			type="image/webp"
			fetchPriority="high"
			imageSrcSet={`${INDUSTRY_CONSTRUCTION_HERO.src} ${INDUSTRY_CONSTRUCTION_HERO.width}w`}
			imageSizes={INDUSTRY_CONSTRUCTION_HERO.sizes}
		/>
	)
}
