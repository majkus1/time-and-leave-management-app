import BlogHeader from '@/components/BlogHeader'
import CommercialSoftwareLanding from '@/components/CommercialSoftwareLanding'

export default function RejestracjaCzasuQrPage() {
	return (
		<>
			<BlogHeader lang="pl" enUrl="/en/qr-time-clocking" plUrl="/rejestracja-czasu-pracy-qr" />
			<CommercialSoftwareLanding variant="attendance" locale="pl" />
		</>
	)
}
