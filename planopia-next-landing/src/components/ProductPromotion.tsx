'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { landingHomeFaqs } from '@/data/landingHomeFaqs'
import { planOfferingCopy } from '@/data/planOfferingCopy'
import LandingFeatureTiles from './LandingFeatureTiles'
import LandingTestimonials from './LandingTestimonials'
import ValueComparison from './landingHome/ValueComparison'
import LandingPartnerBand from './landingHome/LandingPartnerBand'

const LandingVideoGuideTeaser = dynamic(() => import('./LandingVideoGuideTeaser'), {
	loading: () => <div className="min-h-[120px] w-full" aria-hidden />,
})

const LandingChatSection = dynamic(() => import('./LandingChatSection'), {
	loading: () => <div className="min-h-[520px] w-full" aria-hidden />,
})

const LandingAIHighlight = dynamic(() => import('./LandingAIHighlight'), {
	loading: () => <div className="min-h-[200px] w-full" aria-hidden />,
})

const AboutAppShowcaseVideos = dynamic(() => import('./AboutAppShowcaseVideos'), {
	loading: () => (
		// Placeholder trzyma DOKLADNIE te sama wysokosc co gotowy komponent,
		// zeby hydracja nie przesunela sekcji pod spodem.
		<div className="about-app-mockup-wrap w-full" aria-hidden>
			<div className="w-full max-w-[1000px]">
				<div className="hidden flex-col gap-5 lg:flex">
					<div className="w-full rounded-xl bg-gray-100" style={{ aspectRatio: '1902 / 912' }} />
					<div className="w-full rounded-xl bg-gray-100" style={{ aspectRatio: '1902 / 912' }} />
				</div>
				<div className="lg:hidden">
					<div
						className="mx-auto rounded-xl bg-gray-100"
						style={{ aspectRatio: '358 / 780', height: 'min(600px, 70vh)' }}
					/>
					{/* Odpowiednik rzedu kropek w gotowym komponencie (mt-3 + h-1.5) */}
					<div className="mt-3 h-1.5" />
				</div>
			</div>
		</div>
	),
})

const LandingPricing = dynamic(() => import('./LandingPricing'))

const LandingContactSection = dynamic(() => import('./LandingContactSection'))

const faqs = landingHomeFaqs.pl

function ProductPromotion() {
	return (
		<>
			<ValueComparison locale="pl" />

<LandingTestimonials locale="pl" />

<section id="oaplikacji" className="py-12 bg-white px-4">
  <div className="max-w-7xl mx-auto">
    <div className="landing-about-heading-block mb-8">
        <p className="landing-about-heading-eyebrow landing-section-eyebrow">
          {planOfferingCopy.pl.aboutEyebrow}
        </p>
        <h2 className="landing-about-heading-title text-3xl md:text-4xl font-extrabold text-gray-900">
          {planOfferingCopy.pl.aboutTitle}
        </h2>
        <p className="landing-about-intro mt-4 text-lg text-gray-600">
          {planOfferingCopy.pl.aboutLead}
        </p>
    </div>
    <div
      className="
        grid gap-10
        [grid-template-areas:'features'_'callout'_'video']
        lg:grid-cols-2 lg:gap-x-10 lg:gap-y-10
        lg:[grid-template-areas:'features_video'_'callout_callout']
        lg:items-start
      "
    >
      {/* Tekst + kafelki */}
      <div className="[grid-area:features] min-w-0">
        <LandingFeatureTiles locale="pl" />
      </div>

      <aside
        className="landing-enterprise-callout [grid-area:callout] w-full rounded-xl p-5 md:p-6"
        aria-labelledby="planopia-enterprise-offer-heading-pl"
      >
        <h3
          id="planopia-enterprise-offer-heading-pl"
          className="landing-enterprise-callout__eyebrow text-xs font-semibold uppercase tracking-[0.12em] mb-2"
        >
          Rozwój Planopii pod Twoją organizację
        </h3>
        <p className="landing-enterprise-callout__lead text-base md:text-lg leading-relaxed font-semibold">
          Potrzebujesz więcej niż standardowa oferta?{' '}
          <span>
            Rozwijamy aplikację także pod konkretne potrzeby firm: dodatkowe funkcje, integracje dopasowane do procesów, osobne środowisko lub obsługa dużej liczby pracowników.
          </span>
        </p>
        <p className="landing-enterprise-callout__text mt-3 text-sm md:text-base leading-relaxed">
          Zestawienie pakietów i limitów znajdziesz w sekcji{' '}
          <Link
            href="#cennik-pakiety-platne"
            className="landing-enterprise-callout__link font-semibold underline underline-offset-[3px] transition-colors"
          >
            Cennik
          </Link>{' '}
          niżej na stronie.
        </p>
      </aside>

      {/* Wideo / screen produktu */}
      <div className="[grid-area:video] relative flex min-h-[320px] w-full flex-col justify-center mockup-rotator lg:min-h-0 lg:self-center">
        <AboutAppShowcaseVideos locale="pl" />
      </div>
    </div>
  </div>
</section>

<LandingAIHighlight locale="pl" />

<LandingChatSection locale="pl" />


<section id="dlakogo" className="py-12 bg-gray-50 px-4 for">
  <div className="max-w-7xl mx-auto">
    <div className="landing-audience-heading mb-10">
      <p className="landing-about-heading-eyebrow landing-section-eyebrow">Jedna aplikacja, wiele możliwości</p>
      <h2 className="landing-about-heading-title text-3xl md:text-4xl font-extrabold text-gray-900">Dla kogo jest Planopia?</h2>
      <p className="landing-about-intro mt-4 text-lg text-gray-600">
        Od kilku do kilkuset pracowników — Planopia skaluje się razem z Twoją organizacją. Jedna aplikacja na ewidencję czasu pracy, urlopy, grafiki i raporty, z Asystentem AI bez limitu wiadomości w każdym planie płatnym.
      </p>
    </div>

    <div className="landing-audience-cards grid md:grid-cols-3 gap-6">
      {/* 1: Małe zespoły */}
      <div className="landing-audience-card bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/img/groupses.png" alt="Małe zespoły 1-15 osób" className="w-10 h-10 rounded-lg object-contain" width={40} height={40} loading="lazy" decoding="async" />
          <p className="font-semibold text-gray-900">Małe zespoły (1-15 osób)</p>
        </div>
        <p className="mt-3 text-gray-600 text-sm">
          Zastąp Excela jedną prostą aplikacją do czasu pracy, urlopów i grafików.
        </p>
      </div>

      {/* 2: Rozwijające się firmy */}
      <div className="landing-audience-card bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/img/enterprise.png" alt="Rozwijające się firmy 15-100+ osób" className="w-10 h-10 rounded-lg object-contain" width={40} height={40} loading="lazy" decoding="async" />
          <p className="font-semibold text-gray-900">Rozwijające się firmy (15-100+ osób)</p>
        </div>
        <p className="mt-3 text-gray-600 text-sm">
          Uporządkuj procesy HR, raportowanie i zarządzanie zespołem w jednym systemie.
        </p>
      </div>

      {/* 3: HR i kierownicy */}
      <div className="landing-audience-card bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/img/hr-manager.png" alt="HR i kierownicy" className="w-10 h-10 rounded-lg object-contain" width={40} height={40} loading="lazy" decoding="async" />
          <p className="font-semibold text-gray-900">HR i kierownicy</p>
        </div>
        <p className="mt-3 text-gray-600 text-sm">
          Mniej ręcznej pracy, więcej automatyzacji, raportów i kontroli nad zespołem.
        </p>
      </div>
    </div>
  </div>
</section>


<LandingPricing locale="pl" />

{/* Pod instrukcją — pasek programu partnerskiego dla biur (tylko PL) */}
<LandingVideoGuideTeaser locale="pl">
	<LandingPartnerBand />
</LandingVideoGuideTeaser>

<LandingContactSection locale="pl" />

<section id="faq" className="landing-faq-section py-12 px-4 bg-gray-50" aria-labelledby="landing-faq-heading">
  <div className="max-w-7xl mx-auto">
    <div className="landing-contact-heading mb-8">
      <p className="landing-contact-eyebrow landing-section-eyebrow">Masz pytania?</p>
      <h2 id="landing-faq-heading" className="landing-contact-title text-3xl md:text-4xl font-bold">Najczęściej zadawane pytania</h2>
    </div>
    <div className="space-y-4 md:space-y-5">
      {faqs.map((f, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm ring-1 ring-gray-100/80">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.q}</h3>
          <p className="text-gray-700 m-0 leading-relaxed">{f.a}</p>
        </div>
      ))}
    </div>
	</div>
</section>

		</>
	)
}

export default ProductPromotion



