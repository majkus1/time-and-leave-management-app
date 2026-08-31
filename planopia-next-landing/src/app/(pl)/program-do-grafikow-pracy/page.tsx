import BlogHeader from '@/components/BlogHeader'
import CommercialSoftwareLanding from '@/components/CommercialSoftwareLanding'

export default function ProgramDoGrafikowPage() {
	return (
		<>
			<BlogHeader lang="pl" enUrl="/en/work-schedule-software" plUrl="/program-do-grafikow-pracy" />
			<CommercialSoftwareLanding variant="schedule" locale="pl" />
		</>
	)
}
