import BlogHeader from '@/components/BlogHeader'
import CommercialSoftwareLanding from '@/components/CommercialSoftwareLanding'

export default function ProgramDoUrlopowPage() {
	return (
		<>
			<BlogHeader lang="pl" enUrl="/en/leave-management-software" plUrl="/program-do-urlopow" />
			<CommercialSoftwareLanding variant="leave" locale="pl" />
		</>
	)
}
