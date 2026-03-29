import BlogHeader from '../../../../components/BlogHeader'
import BlogConstructionTimeTrackingArticle from '../../../../components/BlogConstructionTimeTrackingArticle'

export default function BlogConstructionTimeEnPage() {
	return (
		<>
			<BlogHeader
				lang="en"
				enUrl="/en/blog/time-tracking-on-construction-sites"
				plUrl="/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie"
			/>
			<BlogConstructionTimeTrackingArticle locale="en" />
		</>
	)
}
