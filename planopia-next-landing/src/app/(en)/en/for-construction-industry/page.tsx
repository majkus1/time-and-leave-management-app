import BlogHeader from '@/components/BlogHeader'
import IndustryConstructionHeroPreload from '@/components/IndustryConstructionHeroPreload'
import IndustryConstructionLandingContent from '@/components/IndustryConstructionLandingContent'

export default function ConstructionIndustryEnPage() {
	return (
		<>
			<IndustryConstructionHeroPreload />
			<BlogHeader lang="en" enUrl="/en/for-construction-industry" plUrl="/dla-branzy-budowlanej" />
			<IndustryConstructionLandingContent locale="en" />
		</>
	)
}
