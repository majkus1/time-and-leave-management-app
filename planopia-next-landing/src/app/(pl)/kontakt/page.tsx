import BlogHeader from '@/components/BlogHeader'
import LandingContactSection from '@/components/LandingContactSection'
import { organizationSchema } from '@/data/organizationSchema'

// Dane firmy dla wyszukiwarek i AI — te same co w regulaminie i na stronie głównej
const contactJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'ContactPage',
	'@id': 'https://planopia.pl/kontakt#webpage',
	url: 'https://planopia.pl/kontakt',
	name: 'Kontakt — Planopia',
	inLanguage: 'pl-PL',
	isPartOf: { '@type': 'WebSite', '@id': 'https://planopia.pl/#website', name: 'Planopia', url: 'https://planopia.pl' },
	mainEntity: organizationSchema('pl'),
}

/**
 * Osobna strona kontaktu. Do tej pory kontakt istniał wyłącznie jako kotwica #kontakt
 * na stronie głównej, więc nie dało się do niego linkować z reklam ani z podstron
 * bez przerzucania użytkownika na home.
 */
export default function KontaktPage() {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
			<BlogHeader lang="pl" enUrl="/en" plUrl="/kontakt" />
			<main>
				<LandingContactSection locale="pl" headingLevel="h1" />
			</main>
		</>
	)
}
