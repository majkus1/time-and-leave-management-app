import BlogHeader from '@/components/BlogHeader'
import BlogProgramUrlopowJsonLd from '@/components/BlogProgramUrlopowJsonLd'
import BlogProgramUrlopowHero from '@/components/BlogProgramUrlopowHero'
import BlogProgramUrlopowArticle from '@/components/BlogProgramUrlopowArticle'

export default function BlogProgramUrlopowMalaFirmaPage() {
	return (
		<>
			<BlogProgramUrlopowJsonLd />
			<BlogHeader lang="pl" hideLanguageSwitcher />
			<BlogProgramUrlopowHero />
			<BlogProgramUrlopowArticle />
		</>
	)
}
