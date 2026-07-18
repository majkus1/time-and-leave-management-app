import BlogHeader from '@/components/BlogHeader'
import BlogRestaurantScheduleArticle from '@/components/BlogRestaurantScheduleArticle'

export default function RestaurantScheduleArticlePage() {
	return (
		<>
			<BlogHeader lang="pl" enUrl="/en/blog" plUrl="/blog/jak-ulozyc-grafik-pracy-w-restauracji" />
			<BlogRestaurantScheduleArticle />
		</>
	)
}
