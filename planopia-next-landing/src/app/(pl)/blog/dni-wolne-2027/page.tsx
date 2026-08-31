import BlogHeader from '@/components/BlogHeader'
import BlogHolidays2027Article from '@/components/BlogHolidays2027Article'

export default function Holidays2027Page() {
	return (
		<>
			<BlogHeader lang="pl" plUrl="/blog/dni-wolne-2027" enUrl="/en/blog" />
			<BlogHolidays2027Article />
		</>
	)
}
