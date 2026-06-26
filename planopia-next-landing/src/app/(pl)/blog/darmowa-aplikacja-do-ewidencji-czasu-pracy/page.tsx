import BlogHeader from '@/components/BlogHeader'
import BlogFreeAppJsonLd from '@/components/BlogFreeAppJsonLd'
import BlogFreeAppHeroSection from '@/components/BlogFreeAppHeroSection'
import BlogFreeAppArticle from '@/components/BlogFreeAppArticle'

export default function BlogFreeAppPlPage() {
	return (
		<>
			<BlogFreeAppJsonLd locale="pl" />
			<BlogHeader
				lang="pl"
				enUrl="/en/blog/free-time-tracking-app"
				plUrl="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy"
			/>
			<BlogFreeAppHeroSection locale="pl" />
			<BlogFreeAppArticle locale="pl" />
		</>
	)
}
