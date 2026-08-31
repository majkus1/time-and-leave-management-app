import BlogHeader from '@/components/BlogHeader'
import BlogTimesheetExcelArticle from '@/components/BlogTimesheetExcelArticle'

export default function TimesheetExcelPage() {
	return (
		<>
			<BlogHeader lang="pl" plUrl="/blog/ewidencja-czasu-pracy-excel-wzor" enUrl="/en/blog" />
			<BlogTimesheetExcelArticle />
		</>
	)
}
