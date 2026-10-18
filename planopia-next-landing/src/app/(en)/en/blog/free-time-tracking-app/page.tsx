import BlogHeader from '@/components/BlogHeader'
import BlogFreeAppJsonLd from '@/components/BlogFreeAppJsonLd'
import BlogFreeAppLanding from '@/components/blogFreeApp/BlogFreeAppLanding'

export default function BlogFreeAppEnPage() {
	return (
		<>
			<BlogFreeAppJsonLd locale="en" />
			<BlogHeader
				lang="en"
				enUrl="/en/blog/free-time-tracking-app"
				plUrl="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy"
			/>
			<BlogFreeAppLanding locale="en" />
		</>
	)
}
