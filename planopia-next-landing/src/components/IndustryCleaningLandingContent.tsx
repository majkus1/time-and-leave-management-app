import IndustryLanding from './productLanding/IndustryLanding'
import ConstructionAiAssistantScreenshot from './ConstructionAiAssistantScreenshot'
import { industryCleaningCopy as copy } from '@/data/industryCleaningCopy'
import { shot } from '@/data/productShots'

const canonical = 'https://planopia.pl/dla-firm-sprzatajacych'

export default function IndustryCleaningLandingContent() {
	const webPageSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': `${canonical}#webpage`,
		name: copy.heroH1,
		description: copy.heroSub,
		url: canonical,
		inLanguage: 'pl-PL',
		isPartOf: {
			'@type': 'WebSite',
			'@id': 'https://planopia.pl/#website',
			name: 'Planopia',
			url: 'https://planopia.pl',
		},
		about: {
			'@type': 'SoftwareApplication',
			name: 'Planopia',
			applicationCategory: 'BusinessApplication',
			operatingSystem: 'Web',
			url: 'https://planopia.pl',
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'PLN',
				description: '30 dni pełnej aplikacji; potem darmowa ewidencja do 5 aktywnych kont lub pakiety płatne',
			},
		},
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Planopia', item: 'https://planopia.pl' },
			{ '@type': 'ListItem', position: 2, name: 'Firmy sprzątające', item: canonical },
		],
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: copy.faqs.map(faq => ({
			'@type': 'Question',
			name: faq.q,
			acceptedAnswer: { '@type': 'Answer', text: faq.a },
		})),
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

			<IndustryLanding
				locale="pl"
				eyebrow="Branża: firmy sprzątające"
				heroH1={copy.heroH1}
				heroSub={copy.heroSub}
				ctaButton={copy.ctaButton}
				secondary={{ label: 'Zobacz aplikację', href: '#industry-gallery' }}
				heroImage={{ src: '/img/sprzatajaca.webp', alt: 'Grafik ekip i ewidencja czasu pracy firmy sprzątającej w Planopii', width: 1536, height: 1024 }}
				problemsTitle={copy.problemsTitle}
				problems={[...copy.problems]}
				spotlights={[
					{ id: 'team', eyebrow: 'Ekipy na wielu obiektach', title: copy.teamTitle, lead: copy.teamLead, bullets: [...copy.teamBullets], shot: shot('pl', 'schedule') },
					{
					id: 'absence',
					eyebrow: 'Nagła nieobecność',
					title: 'Nieobecność na obiekcie? Zastępstwo planujesz, zanim zrobi się problem',
					lead: 'Gdy wniosek urlopowy nachodzi na opublikowany grafik, koordynator od razu widzi, którą zmianę na którym obiekcie trzeba obsadzić — i może wcześniej znaleźć zastępstwo.',
					bullets: [
						'Kolizja z grafikiem widoczna przy wniosku urlopowym.',
						'Na dzień zatwierdzonego urlopu nie wpiszesz zmiany.',
						'Automatyczne układanie pomija osoby na urlopie i dni świąteczne.',
						'Po publikacji grafiku pracownicy dostają powiadomienie.',
					],
					shot: shot('pl', 'leave-conflict'),
				},
				]}
				solutionTitle={copy.solutionTitle}
				solutionIntro={copy.solutionIntro}
				features={[...copy.features]}
				galleryTitle={copy.galleryTitle}
				gallery={[shot('pl', 'dashboard'), shot('pl', 'schedule-auto'), shot('pl', 'dashboard-stats')]}
				ai={{ title: copy.aiTitle, bullets: [...copy.aiBullets], visual: <ConstructionAiAssistantScreenshot locale="pl" /> }}
				stepsTitle={copy.stepsTitle}
				steps={[...copy.steps]}
				faqTitle={copy.faqTitle}
				faqs={[...copy.faqs]}
				cta={{ title: copy.ctaTitle, note: copy.ctaNote, button: copy.ctaButton }}
				guide={{ eyebrow: 'Praktyczny poradnik', title: 'Jak zarządzać firmą sprzątającą?', body: 'Proces krok po kroku: standard pracy, harmonogram ekip, obiekty, zastępstwa, kontrola wykonania i rozliczenie godzin.', href: '/blog/jak-zarzadzac-firma-sprzatajaca', cta: 'Czytaj poradnik' }}
			/>
		</>
	)
}
