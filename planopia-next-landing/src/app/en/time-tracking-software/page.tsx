import BlogHeader from '../../../components/BlogHeader'
import CommercialSoftwareLanding from '../../../components/CommercialSoftwareLanding'

export default function TimeTrackingSoftwarePage() {
	return (
		<>
			<BlogHeader lang="en" enUrl="/en/time-tracking-software" plUrl="/program-do-ewidencji-czasu-pracy" />
			<CommercialSoftwareLanding variant="time" locale="en" />
		</>
	)
}
