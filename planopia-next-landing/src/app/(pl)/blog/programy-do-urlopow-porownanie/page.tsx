import BlogHeader from '@/components/BlogHeader'
import BlogComparisonArticle from '@/components/comparisons/BlogComparisonArticle'
import { leaveComparison } from '@/components/comparisons/leaveComparison'

export default function LeaveComparisonPage() {
	return (
		<>
			<BlogHeader lang="pl" plUrl="/blog/programy-do-urlopow-porownanie" enUrl="/en/blog" />
			<BlogComparisonArticle config={leaveComparison} />
		</>
	)
}
