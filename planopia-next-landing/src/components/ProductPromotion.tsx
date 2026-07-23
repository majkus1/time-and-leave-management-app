'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { landingHomeFaqs } from '@/data/landingHomeFaqs'
import { planOfferingCopy } from '@/data/planOfferingCopy'

const LandingVideoGuideTeaser = dynamic(() => import('./LandingVideoGuideTeaser'), {
	loading: () => <div className="min-h-[120px] w-full" aria-hidden />,
})

const LandingAIHighlight = dynamic(() => import('./LandingAIHighlight'), {
	loading: () => <div className="min-h-[200px] w-full" aria-hidden />,
})

const AboutAppShowcaseVideos = dynamic(() => import('./AboutAppShowcaseVideos'), {
	loading: () => <div className="about-app-mockup-wrap min-h-[280px] w-full" aria-hidden />,
})

const LandingPricing = dynamic(() => import('./LandingPricing'))

const LandingContactSection = dynamic(() => import('./LandingContactSection'))

const faqs = landingHomeFaqs.pl

function ProductPromotion() {
	return (
		<>
			<section className="landing-value-proof-section px-4" aria-labelledby="planopia-value-proof-heading">
				<div className="landing-value-proof max-w-7xl mx-auto">
					<div className="landing-value-proof__header">
						<p className="landing-value-proof__eyebrow landing-section-eyebrow">{planOfferingCopy.pl.valueEyebrow}</p>
						<h2 id="planopia-value-proof-heading" className="landing-value-proof__title">
							{planOfferingCopy.pl.valueTitle}
						</h2>
						<p className="landing-value-proof__lead">{planOfferingCopy.pl.valueLead}</p>
					</div>
					<div className="landing-value-proof__grid">
						{planOfferingCopy.pl.valueCards.map(card => (
							<article className="landing-value-proof__card" key={card.title}>
								<h3>{card.title}</h3>
								<p>{card.text}</p>
							</article>
						))}
					</div>
				</div>
			</section>

<section id="oaplikacji" className="py-12 bg-white px-4">
  <div className="max-w-7xl mx-auto">
    <div className="landing-about-heading-block mb-8">
        <p className="landing-about-heading-eyebrow landing-section-eyebrow">
          Wszystko, czego potrzebujesz w jednym systemie
        </p>
        <h2 className="landing-about-heading-title text-3xl md:text-4xl font-extrabold text-gray-900">
          Kompleksowa aplikacja do zarządzania firmą
        </h2>
        <p className="landing-about-intro mt-4 text-lg text-gray-600">
          Planopia porządkuje codzienną administrację: ewidencję czasu pracy, urlopy, grafik pracy, czaty, tablice zadań oraz Asystenta AI. Zamiast śledzić arkusze, maile i papierowe wnioski, zbierasz dane w jednym miejscu i szybciej generujesz raporty dla zespołu, księgowości i właściciela.
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
        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* 1 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
            <img src="/img/schedule time works.png" className='icon-landing-about' alt='Ikona ewidencji czasu pracy' width={35} height={35} loading="lazy" decoding="async" />
            <div>
              <p className="font-semibold text-gray-900">Ewidencja czasu pracy</p>
              <p className="text-sm text-gray-600">Kalendarz, nadgodziny i podsumowania bez ręcznego składania arkuszy.</p>
            </div>
          </div>
          {/* Timer */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
            <img src="/img/timer.png" className='icon-landing-about' alt='Ikona automatycznej rejestracji czasu (timer i QR)' width={35} height={35} loading="lazy" decoding="async" />
            <div>
              <p className="font-semibold text-gray-900">Automatyczna rejestracja czasu</p>
              <p className="text-sm text-gray-600">Timer pracy, QR wejścia/wyjścia, zadania i miesięczne statystyki czasu.</p>
            </div>
          </div>
          {/* 2 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/sunbed.png" className='icon-landing-about' alt='Ikona urlopów i nieobecności' width={35} height={35} loading="lazy" decoding="async" />
            <div>
              <p className="font-semibold text-gray-900">Urlopy i nieobecności</p>
              <p className="text-sm text-gray-600">Wnioski, akceptacje i powiadomienia bez papierowego obiegu.</p>
            </div>
          </div>
          {/* 3 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/pdf.png" className='icon-landing-about' alt='Ikona raportów PDF i Excel' width={35} height={35} loading="lazy" decoding="async" />
            <div>
			<p className="font-semibold text-gray-900">Raporty</p>
<p className="text-sm text-gray-600">Raporty PDF i Excel z danymi, statystykami i podsumowaniami dla zespołu, księgowości i właściciela.</p>
            </div>

          </div>
          {/* 4 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/project.png" className='icon-landing-about' alt='Ikona grafiku pracy' width={35} height={35} loading="lazy" decoding="async" />
            <div>
			<p className="font-semibold text-gray-900">Grafik pracy</p>
<p className="text-sm text-gray-600">Planowanie i zarządzanie grafikami pracy dla całego zespołu, z szybkim automatycznym wypełnianiem grafiku.</p>
            </div>
          </div>
          {/* 5 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/chat.png" className='icon-landing-about' alt='Ikona czatów zespołowych' width={35} height={35} loading="lazy" decoding="async" />
            <div>
			<p className="font-semibold text-gray-900">Czaty</p>
<p className="text-sm text-gray-600">Komunikacja wewnętrzna — czaty zespołowe i kanały działów.</p>
            </div>
          </div>
          {/* 6 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/task-list.png" className='icon-landing-about' alt='Ikona tablic zadań Kanban' width={35} height={35} loading="lazy" decoding="async" />
            <div>
			<p className="font-semibold text-gray-900">Zadania i Projekty</p>
<p className="text-sm text-gray-600">Zarządzanie zadaniami i projektami w przejrzystych tablicach Kanban.</p>
            </div>
          </div>
          {/* 7 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/verified.png" className='icon-landing-about' alt='Ikona bezpieczeństwa i szyfrowania' width={35} height={35} loading="lazy" decoding="async" />
            <div>
              <p className="font-semibold text-gray-900">Bezpieczeństwo</p>
              <p className="text-sm text-gray-600">Bezpieczne logowanie i szyfrowane połączenia chronią Twoją firmę.</p>
            </div>

          </div>
          {/* 8 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/booking.png" className='icon-landing-about' alt='Ikona aplikacji PWA i wersji mobilnej' width={35} height={35} loading="lazy" decoding="async" />
            <div>
              <p className="font-semibold text-gray-900">PWA i mobile</p>
              <p className="text-sm text-gray-600">Dodaj do ekranu i używaj jak appki — z powiadomieniami push o ważnych zdarzeniach.</p>
            </div>

          </div>
          {/* 9 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/technical-support.png" className='icon-landing-about' alt='Ikona indywidualnego wsparcia' width={35} height={35} loading="lazy" decoding="async" />
            <div>
			<p className="font-semibold text-gray-900">Indywidualne wsparcie</p>
<p className="text-sm text-gray-600">Czat i pomoc dla Twojego zespołu — w razie pytań lub problemów.</p>
            </div>
          </div>
        </div>

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


<section id="dlakogo" className="py-12 bg-gray-50 px-4 for">
  <div className="max-w-7xl mx-auto">
    <div className="landing-audience-heading mb-10">
      <p className="landing-about-heading-eyebrow landing-section-eyebrow">Jedna aplikacja, wiele możliwości</p>
      <h2 className="landing-about-heading-title text-3xl md:text-4xl font-extrabold text-gray-900">Dla kogo jest Planopia?</h2>
      <p className="landing-about-intro mt-4 text-lg text-gray-600">
        Od kilku do kilkuset pracowników — Planopia skaluje się razem z Twoją organizacją. Jedna aplikacja na ewidencję czasu pracy, urlopy, grafiki i raporty, z Asystentem AI w ramach limitów wybranego pakietu.
      </p>
    </div>

    <div className="landing-audience-cards grid md:grid-cols-3 gap-6 mb-4">
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

<LandingVideoGuideTeaser locale="pl" />

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



