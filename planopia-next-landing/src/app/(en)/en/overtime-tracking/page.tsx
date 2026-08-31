import BlogHeader from '@/components/BlogHeader'
import CommercialSoftwareLanding from '@/components/CommercialSoftwareLanding'

export default function OvertimeTrackingPage() {
	return (
		<>
			<BlogHeader lang="en" enUrl="/en/overtime-tracking" plUrl="/ewidencja-nadgodzin" />
			<CommercialSoftwareLanding variant="overtime" locale="en" />
		</>
	)
}
