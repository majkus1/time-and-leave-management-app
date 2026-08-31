import BlogHeader from '@/components/BlogHeader'
import CommercialSoftwareLanding from '@/components/CommercialSoftwareLanding'

export default function QrTimeClockingPage() {
	return (
		<>
			<BlogHeader lang="en" enUrl="/en/qr-time-clocking" plUrl="/rejestracja-czasu-pracy-qr" />
			<CommercialSoftwareLanding variant="attendance" locale="en" />
		</>
	)
}
