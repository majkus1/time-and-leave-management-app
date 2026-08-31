import BlogHeader from '@/components/BlogHeader'
import BlogEmployeeLeaveTypesArticle from '@/components/BlogEmployeeLeaveTypesArticle'

export default function EmployeeLeaveTypesPage() {
	return (
		<>
			<BlogHeader lang="pl" plUrl="/blog/urlopy-i-dni-wolne-dla-pracownikow" enUrl="/en/blog" />
			<BlogEmployeeLeaveTypesArticle />
		</>
	)
}
