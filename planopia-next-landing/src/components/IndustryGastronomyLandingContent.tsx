import IndustryLanding from './productLanding/IndustryLanding'
import ConstructionAiAssistantScreenshot from './ConstructionAiAssistantScreenshot'
import { industryGastronomyCopy as copy } from '@/data/industryGastronomyCopy'
import { shot } from '@/data/productShots'

const canonical = 'https://planopia.pl/dla-gastronomii'

export default function IndustryGastronomyLandingContent() {
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
			{ '@type': 'ListItem', position: 2, name: 'Gastronomia', item: canonical },
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
				eyebrow="Branża: gastronomia"
				heroH1={copy.heroH1}
				heroSub={copy.heroSub}
				ctaButton={copy.ctaButton}
				secondary={{ label: 'Zobacz aplikację', href: '#industry-gallery' }}
				heroImage={{ src: '/img/gastronomia.webp', alt: 'Planowanie grafiku i ewidencja czasu pracy zespołu restauracji w Planopii', width: 1536, height: 1024 }}
				problemsTitle={copy.problemsTitle}
				problems={[...copy.problems]}
				spotlights={[
					{ id: 'team', eyebrow: 'Grafik zmian', title: copy.teamTitle, lead: copy.teamLead, bullets: [...copy.teamBullets], shot: shot('pl', 'schedule') },
					{
					id: 'absence',
					eyebrow: 'Nagła nieobecność',
					title: 'Wolne na weekend z rezerwacjami? Kolizję widać przy wniosku',
					lead: 'Kelner prosi o wolne, a ma już zmianę w grafiku? Wniosek od razu pokazuje kolizję z konkretną zmianą — kierownik wie, kogo trzeba znaleźć na salę albo kuchnię, zanim zaakceptuje urlop.',
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
				gallery={[shot('pl', 'schedule-auto'), shot('pl', 'leave-plans'), shot('pl', 'dashboard')]}
				ai={{ title: copy.aiTitle, bullets: [...copy.aiBullets], visual: <ConstructionAiAssistantScreenshot locale="pl" /> }}
				stepsTitle={copy.stepsTitle}
				steps={[...copy.steps]}
				faqTitle={copy.faqTitle}
				faqs={[...copy.faqs]}
				cta={{ title: copy.ctaTitle, note: copy.ctaNote, button: copy.ctaButton }}
				guide={{ eyebrow: 'Praktyczny poradnik', title: 'Jak ułożyć grafik pracy w restauracji?', body: 'Proces krok po kroku: dostępność zespołu, obsada sali i kuchni, publikacja zmian, zastępstwa oraz zamknięcie miesiąca.', href: '/blog/jak-ulozyc-grafik-pracy-w-restauracji', cta: 'Czytaj poradnik' }}
			/>
		</>
	)
}
