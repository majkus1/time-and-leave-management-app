import BlogHeader from '@/components/BlogHeader'
import BlogComparisonArticle from '@/components/comparisons/BlogComparisonArticle'
import { timeTrackingComparison } from '@/components/comparisons/timeTrackingComparison'

export default function TimeTrackingComparisonPage() {
	return (
		<>
			<BlogHeader lang="pl" plUrl="/blog/programy-do-ewidencji-czasu-pracy-porownanie" enUrl="/en/blog" />
			<BlogComparisonArticle config={timeTrackingComparison} />
		</>
	)
}
