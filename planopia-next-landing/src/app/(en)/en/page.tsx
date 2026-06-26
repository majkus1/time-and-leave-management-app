import LandingHeader from '@/components/LandingHeader'
import LandingHero from '@/components/LandingHero'
import LandingHeroPreload from '@/components/LandingHeroPreload'
import LandingHomeJsonLd from '@/components/LandingHomeJsonLd'
import ENProductPromotion from '@/components/ENProductPromotion'

export default function EnglishHome() {
	return (
		<>
			<LandingHeroPreload />
			<LandingHomeJsonLd locale="en" />
			<LandingHeader locale="en" />
			<main>
				<LandingHero locale="en" />
				<ENProductPromotion />
			</main>
		</>
	)
}
