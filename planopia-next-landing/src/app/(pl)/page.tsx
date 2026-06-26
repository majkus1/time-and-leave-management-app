import LandingHeader from '@/components/LandingHeader'
import LandingHero from '@/components/LandingHero'
import LandingHeroPreload from '@/components/LandingHeroPreload'
import LandingHomeJsonLd from '@/components/LandingHomeJsonLd'
import ProductPromotion from '@/components/ProductPromotion'

export default function Home() {
	return (
		<>
			<LandingHeroPreload />
			<LandingHomeJsonLd locale="pl" />
			<LandingHeader locale="pl" />
			<main>
				<LandingHero locale="pl" />
				<ProductPromotion />
			</main>
		</>
	)
}
