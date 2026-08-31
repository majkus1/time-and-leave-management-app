import BlogHeader from '@/components/BlogHeader'
import CommercialSoftwareLanding from '@/components/CommercialSoftwareLanding'

export default function WorkScheduleSoftwarePage() {
	return (
		<>
			<BlogHeader lang="en" enUrl="/en/work-schedule-software" plUrl="/program-do-grafikow-pracy" />
			<CommercialSoftwareLanding variant="schedule" locale="en" />
		</>
	)
}
