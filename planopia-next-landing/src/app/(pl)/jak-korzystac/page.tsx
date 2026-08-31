import BlogHeader from '@/components/BlogHeader'
import HowToUseGuide from '@/components/HowToUseGuide'

export default function JakKorzystacPage() {
	return (
		<>
			<BlogHeader lang="pl" plUrl="/jak-korzystac" enUrl="/en/how-to-use" />
			<HowToUseGuide locale="pl" />
		</>
	)
}
