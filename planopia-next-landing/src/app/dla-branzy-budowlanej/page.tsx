import BlogHeader from '../../components/BlogHeader'
import IndustryConstructionLandingContent from '../../components/IndustryConstructionLandingContent'

export default function ConstructionIndustryPlPage() {
	return (
		<>
			<BlogHeader lang="pl" enUrl="/en/for-construction-industry" plUrl="/dla-branzy-budowlanej" />
			<IndustryConstructionLandingContent locale="pl" />
		</>
	)
}
