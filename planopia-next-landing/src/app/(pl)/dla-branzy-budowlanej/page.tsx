import BlogHeader from '@/components/BlogHeader'
import IndustryConstructionHeroPreload from '@/components/IndustryConstructionHeroPreload'
import IndustryConstructionLandingContent from '@/components/IndustryConstructionLandingContent'

export default function ConstructionIndustryPlPage() {
	return (
		<>
			<IndustryConstructionHeroPreload />
			<BlogHeader lang="pl" enUrl="/en/for-construction-industry" plUrl="/dla-branzy-budowlanej" />
			<IndustryConstructionLandingContent locale="pl" />
		</>
	)
}
