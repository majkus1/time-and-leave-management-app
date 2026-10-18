import BlogHeader from '@/components/BlogHeader'
import BlogFive from '@/components/BlogFive'

export default function BlogFivePage() {
	return (
		<>
			<BlogHeader lang="pl" plUrl="/blog/elektroniczna-ewidencja-czasu-pracy" enUrl="/en/blog/electronic-time-tracking" />
			<BlogFive />
		</>
	)
}
