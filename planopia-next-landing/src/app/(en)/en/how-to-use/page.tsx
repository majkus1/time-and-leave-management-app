import BlogHeader from '@/components/BlogHeader'
import HowToUseGuide from '@/components/HowToUseGuide'

export default function HowToUsePage() {
	return (
		<>
			<BlogHeader lang="en" plUrl="/jak-korzystac" enUrl="/en/how-to-use" />
			<HowToUseGuide locale="en" />
		</>
	)
}
