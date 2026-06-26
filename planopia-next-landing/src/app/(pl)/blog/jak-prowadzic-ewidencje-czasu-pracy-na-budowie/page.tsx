import BlogHeader from '@/components/BlogHeader'
import BlogConstructionTimeTrackingArticle from '@/components/BlogConstructionTimeTrackingArticle'

export default function BlogConstructionTimePlPage() {
	return (
		<>
			<BlogHeader
				lang="pl"
				enUrl="/en/blog/time-tracking-on-construction-sites"
				plUrl="/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie"
			/>
			<BlogConstructionTimeTrackingArticle locale="pl" />
		</>
	)
}
