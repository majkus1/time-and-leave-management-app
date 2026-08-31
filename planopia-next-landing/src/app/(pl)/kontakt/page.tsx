import BlogHeader from '@/components/BlogHeader'
import LandingContactSection from '@/components/LandingContactSection'

/**
 * Osobna strona kontaktu. Do tej pory kontakt istniał wyłącznie jako kotwica #kontakt
 * na stronie głównej, więc nie dało się do niego linkować z reklam ani z podstron
 * bez przerzucania użytkownika na home.
 */
export default function KontaktPage() {
	return (
		<>
			<BlogHeader lang="pl" enUrl="/en" plUrl="/kontakt" />
			<main>
				<LandingContactSection locale="pl" headingLevel="h1" />
			</main>
		</>
	)
}
