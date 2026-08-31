import BlogHeader from '@/components/BlogHeader'
import CommercialSoftwareLanding from '@/components/CommercialSoftwareLanding'

export default function EwidencjaNadgodzinPage() {
	return (
		<>
			<BlogHeader lang="pl" enUrl="/en/overtime-tracking" plUrl="/ewidencja-nadgodzin" />
			<CommercialSoftwareLanding variant="overtime" locale="pl" />
		</>
	)
}
