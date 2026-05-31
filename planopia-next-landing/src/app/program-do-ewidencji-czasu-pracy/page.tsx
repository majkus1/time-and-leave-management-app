import BlogHeader from '../../components/BlogHeader'
import CommercialSoftwareLanding from '../../components/CommercialSoftwareLanding'

export default function ProgramDoEwidencjiPage() {
	return (
		<>
			<BlogHeader lang="pl" enUrl="/en/time-tracking-software" plUrl="/program-do-ewidencji-czasu-pracy" />
			<CommercialSoftwareLanding variant="time" locale="pl" />
		</>
	)
}
