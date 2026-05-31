import BlogHeader from '../../../components/BlogHeader'
import CommercialSoftwareLanding from '../../../components/CommercialSoftwareLanding'

export default function LeaveManagementSoftwarePage() {
	return (
		<>
			<BlogHeader lang="en" enUrl="/en/leave-management-software" plUrl="/program-do-urlopow" />
			<CommercialSoftwareLanding variant="leave" locale="en" />
		</>
	)
}
