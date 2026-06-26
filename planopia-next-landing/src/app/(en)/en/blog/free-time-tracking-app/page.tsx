import BlogHeader from '@/components/BlogHeader'
import BlogFreeAppJsonLd from '@/components/BlogFreeAppJsonLd'
import BlogFreeAppHeroSection from '@/components/BlogFreeAppHeroSection'
import BlogFreeAppArticle from '@/components/BlogFreeAppArticle'

export default function BlogFreeAppEnPage() {
	return (
		<>
			<BlogFreeAppJsonLd locale="en" />
			<BlogHeader
				lang="en"
				enUrl="/en/blog/free-time-tracking-app"
				plUrl="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy"
			/>
			<BlogFreeAppHeroSection locale="en" />
			<BlogFreeAppArticle locale="en" />
		</>
	)
}
