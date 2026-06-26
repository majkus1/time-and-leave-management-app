import BlogHeader from '@/components/BlogHeader'
import BlogLeavePlanExcelContent from '@/components/BlogLeavePlanExcelContent'

export default function ENBlogLeavePlanExcelPage() {
	return (
		<>
			<BlogHeader
				lang="en"
				plUrl="/blog/roczny-plan-urlopow-excel-pdf-aplikacja"
				enUrl="/en/blog/annual-leave-plan-excel-pdf-app"
			/>
			<BlogLeavePlanExcelContent locale="en" />
		</>
	)
}
