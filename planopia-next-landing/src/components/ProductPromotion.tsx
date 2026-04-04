'use client'

import React, { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { API_URL } from '../config'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import { pl } from 'date-fns/locale/pl'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsPl,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'
import LandingPricing from './LandingPricing'
import LandingVideoGuideTeaser from './LandingVideoGuideTeaser'
import LandingAIHighlight from './LandingAIHighlight'
import AboutAppShowcaseVideos from './AboutAppShowcaseVideos'
import { planOfferingCopy } from '@/data/planOfferingCopy'

function ProductPromotion() {
	const [menuOpen, setMenuOpen] = useState(false)
	const [buttonState, setButtonState] = useState(false) // Separate state for button (changes immediately)

	const menuCloseHandlerRef = useRef<(() => void) | null>(null)
	
	const toggleMenu = () => {
		setMenuOpen(prev => !prev)
		setButtonState(prev => !prev) // Keep button in sync
	}
	
	// Close menu and sync button state
	const closeMenu = () => {
		setMenuOpen(false)
		setButtonState(false) // Always sync button state when closing menu
	}
	
	const handleMenuClick = () => {
		if (menuOpen && menuCloseHandlerRef.current) {
			// Immediately change button state (X -> hamburger) before animation
			setButtonState(false)
			// Use animated close handler for menu animation
			menuCloseHandlerRef.current()
		} else {
			// Open menu normally
			setMenuOpen(true)
			setButtonState(true) // Keep button in sync
		}
	}
	
	// Stable callback that doesn't change on every render
	const handleCloseRequest = useCallback((closeHandler: () => void) => {
		menuCloseHandlerRef.current = closeHandler
	}, [])
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const [userMessage, setUserMessage] = useState('')
	const [email2, setEmail2] = useState('')
	const [datetime, setDatetime] = useState<Date | null>(null)
	const [msg2, setMsg2] = useState('')
	registerLocale('pl', pl)

	const minTime = new Date()
	minTime.setHours(8, 0, 0)

	const maxTime = new Date()
	maxTime.setHours(17, 0, 0)

	const minDate = new Date()
	minDate.setHours(0, 0, 0, 0) // Today at midnight

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			await axios.post(`${API_URL}/api/public/request-demo`, { email }) // ✅ poprawna ścieżka
			setMessage('Dziękujemy! Wkrótce otrzymasz konto testowe.')
			setEmail('')
		} catch {
			setMessage('Błąd podczas wysyłania. Spróbuj ponownie później.')
		}
	}

	const handleSubmitMeeting = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!datetime && (!userMessage || userMessage.trim() === '')) {
			alert('Please select a date or enter a message.')
			return
		}

		try {
			await axios.post(`${API_URL}/api/public/schedule-call`, {
				email: email2,
				datetime: datetime?.toISOString(),
				message: userMessage,
			})
			setMsg2('Dziękujemy! Wysłano wiadomość.')
			setEmail2('')
			setDatetime(null)
		} catch {
			setMsg2('Wystąpił błąd. Spróbuj ponownie później.')
		}
		console.log({ datetime, email: email2, message })
	}

	return (
		<>
			{/* Schema.org JSON-LD */}
			<script 
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "SoftwareApplication",
						"name": "Planopia",
						"url": "https://planopia.pl",
						"applicationCategory": "BusinessApplication",
						"operatingSystem": "Web",
						"author": {
							"@type": "Person",
							"name": "Michał Lipka"
						},
						"description": planOfferingCopy.pl.metaLong,
						"offers": {
							"@type": "AggregateOffer",
							"offerCount": "5",
							"lowPrice": "99",
							"highPrice": "799",
							"priceCurrency": "PLN",
							"description": planOfferingCopy.pl.jsonLdOfferDescription
						}
					})
				}}
			/>


			{/* HEADER + MENU */}
			<header className="bg-white top-0 z-50 w-full flex justify-between headerpromotionmenu" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link
						href="/"
						className="logoinmenu text-2xl font-bold text-blue-700 companyname"
						style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }} />
					</Link>
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<a
							href="#oaplikacji"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							O Aplikacji
						</a>
						<a
							href="#asystent-ai"
							className="cursor-pointer text-blue-600 font-medium hover:text-indigo-600 transition">
							Asystent AI
						</a>
						<a
							href="#cennik"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Cennik
						</a>
						<LandingIndustriesDropdown locale="pl" />
						<Link
							href="/blog"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Blog
						</Link>
						<a
							href="#kontakt"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Kontakt
						</a>
						<Link
							href="https://app.planopia.pl/"
							onClick={toggleMenu}
							className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition"
						>
							Logowanie
						</Link>

						<Link
							href="https://app.planopia.pl/team-registration"
							onClick={toggleMenu}
							className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu"
						>
							Załóż darmowy zespół
						</Link>

						<Link href="/en" className="flex items-center languagechoose">
							<img src="/img/united-kingdom.webp" alt="English version" className="w-6 h-6" />
						</Link>
					</nav>

					<HamburgerButton isOpen={buttonState} onClick={handleMenuClick} />
				</div>
			</header>

			{/* Professional Mobile Menu */}
			<MobileMenu
				isOpen={menuOpen}
				onClose={closeMenu}
				onCloseRequest={handleCloseRequest}
				lang="pl"
				menuItems={landingMobileNavItemsPl()}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig('pl')}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{
					href: '/en',
					flagSrc: '/img/united-kingdom.webp',
					alt: 'English version'
				}}
			/>

			<main>
			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white landing-hero-below-fixed-header" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid md:grid-cols-2 gap-10 items-center">
						<div className="ordering">
							<h1 className="text-2xl sm:text-3xl font-bold text-blue-700">
								{planOfferingCopy.pl.heroH1}
							</h1>
							<h2 className="font-semibold text-gray-800 mt-2 max-w-xl" id="underheader">
								{planOfferingCopy.pl.heroSub}
							</h2>
							<Link
								href="https://app.planopia.pl/team-registration"
								className="inline-block rounded-xl bg-green-600 text-white font-semibold py-3 px-4 shadow hover:bg-green-700 transition mt-4">
								Załóż darmowy zespół
							</Link>
						</div>
						<img
							src="/img/headerimage.webp"
							alt="biznesmen zaznaczający aplikację"
							className="rounded-xl w-full h-auto aspect-[3/2]"
							loading="eager"
							fetchPriority="high"
							width={800}
							height={533}
						/>
					</div>
				</div>
			</section>

			<section id="oaplikacji" className="py-12 bg-white px-4">
  <div className="max-w-7xl mx-auto">
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
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          Kompleksowa aplikacja do zarządzania firmą
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Planopia to kompletne narzędzie do zarządzania firmą. Ewidencja czasu pracy, urlopy, grafik pracy, czaty, tablice zadań oraz Asystent AI — wszystko w jednym miejscu. Zapomnij o Excelach i mailach. Planopia automatyzuje procesy — szybciej, czytelniej, bez błędów.
        </p>

        {/* Feature grid */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {/* 1 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
            <img src="/img/schedule time works.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
              <p className="font-semibold text-gray-900">Ewidencja czasu pracy</p>
              <p className="text-sm text-gray-600">Kalendarz, nadgodziny i podsumowania pracy.</p>
            </div>
          </div>
          {/* Timer */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
            <img src="/img/timer.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
              <p className="font-semibold text-gray-900">Automatyczna rejestracja czasu</p>
              <p className="text-sm text-gray-600">QR kod wejścia/wyjścia, zaznaczanie zadań i miesięczne statystyki czasu pracy.</p>
            </div>
          </div>
          {/* 2 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/sunbed.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
              <p className="font-semibold text-gray-900">Urlopy i nieobecności</p>
              <p className="text-sm text-gray-600">Wnioski, akceptacje, powiadomienia.</p>
            </div>
          </div>
          {/* 3 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/pdf.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
			<p className="font-semibold text-gray-900">Dokumenty</p>
<p className="text-sm text-gray-600">Generowanie PDF i Excel: kalendarze pracy i wnioski urlopowe zawsze pod ręką.</p>
            </div>

          </div>
          {/* 4 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/project.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
			<p className="font-semibold text-gray-900">Grafik pracy</p>
<p className="text-sm text-gray-600">Planowanie i zarządzanie grafikami pracy dla całego zespołu, z szybkim automatycznym wypełnianiem grafiku.</p>
            </div>
          </div>
          {/* 5 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/chat.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
			<p className="font-semibold text-gray-900">Czaty</p>
<p className="text-sm text-gray-600">Komunikacja wewnętrzna — czaty zespołowe i kanały działów.</p>
            </div>
          </div>
          {/* 6 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/task-list.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
			<p className="font-semibold text-gray-900">Tablice zadań</p>
<p className="text-sm text-gray-600">Zarządzanie projektami i zadaniami w przejrzystych tablicach Kanban.</p>
            </div>
          </div>
          {/* 7 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/verified.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
              <p className="font-semibold text-gray-900">Bezpieczeństwo</p>
              <p className="text-sm text-gray-600">Bezpieczne logowanie i szyfrowane połączenia chronią Twoją firmę.</p>
            </div>

          </div>
          {/* 8 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/booking.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
              <p className="font-semibold text-gray-900">PWA i mobile</p>
              <p className="text-sm text-gray-600">Dodaj do ekranu i używaj jak appki — z powiadomieniami push o ważnych zdarzeniach.</p>
            </div>

          </div>
          {/* 9 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="/img/technical-support.png" className='icon-landing-about' alt='ikonki w sekcji o nas' loading="eager" />
            <div>
			<p className="font-semibold text-gray-900">Indywidualne wsparcie</p>
<p className="text-sm text-gray-600">Czat i pomoc dla Twojego zespołu — w razie pytań lub problemów.</p>
            </div>
          </div>
        </div>

      </div>

      <aside
        className="[grid-area:callout] w-full rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/95 via-white to-slate-50 p-5 md:p-6 shadow-sm ring-1 ring-indigo-100/70"
        aria-labelledby="planopia-enterprise-offer-heading-pl"
      >
        <h3
          id="planopia-enterprise-offer-heading-pl"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700 mb-2"
        >
          Rozwój Planopii pod Twoją organizację
        </h3>
        <p className="text-gray-900 text-base md:text-lg leading-relaxed font-semibold">
          Potrzebujesz więcej niż standardowa oferta?{' '}
          <span className="text-gray-800">
            Rozwijamy aplikację także pod konkretne potrzeby firm: dodatkowe funkcje, integracje dopasowane do procesów, osobne środowisko lub obsługa dużej liczby pracowników.
          </span>
        </p>
        <p className="mt-3 text-gray-700 text-sm md:text-base leading-relaxed">
          Zestawienie pakietów i limitów znajdziesz w sekcji{' '}
          <Link
            href="#cennik-pakiety-platne"
            className="font-semibold text-indigo-700 hover:text-indigo-900 underline decoration-indigo-300 underline-offset-[3px] hover:decoration-indigo-500 transition-colors"
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
    <div className="mb-10">
      <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">Dla kogo jest Planopia?</h3>
      <p className="mt-3 text-lg text-gray-600">
        Od kilku do kilkuset pracowników — Planopia skaluje się razem z Twoją organizacją. Jedna aplikacja na ewidencję, urlopy, grafiki i raporty, z Asystentem AI w ramach limitów wybranego pakietu.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-6 mb-4">
      {/* 1: Małe zespoły */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/img/groupses.png" alt="Małe zespoły" className="w-10 h-10 rounded-lg object-contain" />
          <p className="font-semibold text-gray-900">Małe zespoły</p>
        </div>
        <p className="mt-3 text-gray-600 text-sm">
          Szybka ewidencja, proste wnioski, przejrzysty kalendarz. Jasne role i uprawnienia — bez zbędnej złożoności.
        </p>
      </div>

      {/* 2: Firmy i organizacje */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/img/enterprise.png" alt="Firmy i organizacje" className="w-10 h-10 rounded-lg object-contain" />
          <p className="font-semibold text-gray-900">Firmy i organizacje</p>
        </div>
        <p className="mt-3 text-gray-600 text-sm">
          Centralna kontrola nad czasem pracy, akceptacjami i raportami. Integracje oraz uprawnienia dla ról.
        </p>
      </div>

      {/* 3: HR i menedżerowie */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/img/hr-manager.png" alt="HR i menedżerowie" className="w-10 h-10 rounded-lg object-contain" />
          <p className="font-semibold text-gray-900">HR i menedżerowie</p>
        </div>
        <p className="mt-3 text-gray-600 text-sm">
          Sprawna obsługa wniosków, powiadomienia e-mail i push oraz komplet dokumentów do kontroli i rozliczeń.
        </p>
      </div>
    </div>
  </div>
</section>


<LandingPricing locale="pl" />

<LandingVideoGuideTeaser locale="pl" />

<section id="kontakt" className="py-12 px-4 bg-gray-50">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900">Kontakt i dane firmy</h2>
    <p className="mt-3 text-left text-gray-600">
      Masz pytania lub chcesz prezentację? Napisz, zadzwoń albo umów rozmowę online.
    </p>

    <div className="mt-10 grid gap-8 md:grid-cols-2 max-w-7xl mx-auto">
      {/* Lewa kolumna – dane kontaktowe */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-200/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center mb-8">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-green-400 rounded-full blur-sm opacity-30"></div>
              <img
                src="/img/1709827103942.webp"
                alt="Zdjęcie profilowe Michał Lipka"
                className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-3 border-white shadow-md flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-2xl font-bold text-gray-900 mb-2">Michał Lipka</p>
              <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                
                Twórca Planopii • Wdrożenia i wsparcie
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 mb-6">
            <a
              href="mailto:office@ml-devworks.com"
              className="flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all group border border-gray-100"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors">office@ml-devworks.com</span>
            </a>

            <a 
              href="tel:+48516598792" 
              className="flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all group border border-gray-100"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium group-hover:text-green-600 transition-colors">+48 516 598 792</span>
            </a>

            <a
              href="https://www.linkedin.com/in/michal-lipka-wd/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all group border border-gray-100"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <img src="/img/linkedin.webp" alt="Logo LinkedIn" className="w-5 h-5" />
              </div>
              <span className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors">LinkedIn</span>
            </a>
          </div>
        </div>
      </div>

      {/* Prawa kolumna – formularz */}
      <div className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-green-100">
        <div className="absolute top-0 left-0 w-32 h-32 bg-green-200/20 rounded-full -ml-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full -mr-12 -mb-12 blur-2xl"></div>
        <div className="relative">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              
              <p className="text-2xl font-bold text-gray-900">Formularz kontaktowy</p>
            </div>
            <p className="text-gray-600">
              Umów rozmowę online lub zostaw wiadomość — wrócę z odpowiedzią.
            </p>
          </div>

          <form onSubmit={handleSubmitMeeting} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
              <input
                id="contact-email"
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/80 hover:bg-white"
                placeholder="Twój adres e-mail"
                value={email2}
                onChange={e => setEmail2(e.target.value)}
                required
              />
            </div>

            {/* Datepicker */}
            <div>
              <label htmlFor="contact-date" className="block text-sm font-semibold text-gray-700 mb-2">Data i godzina (opcjonalnie)</label>
              <DatePicker
                id="contact-date"
                selected={datetime}
                onChange={setDatetime}
                showTimeSelect
                timeIntervals={30}
                minDate={minDate}
                minTime={minTime}
                maxTime={maxTime}
                dateFormat="Pp"
                timeCaption="Godzina"
                locale="pl"
                placeholderText="Wybierz datę i godzinę"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/80 hover:bg-white"
              />
            </div>

            {/* Wiadomość */}
            <div>
              <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-700 mb-2">Wiadomość</label>
              <textarea
                id="contact-message"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none bg-white/80 hover:bg-white"
                placeholder="Twoja wiadomość"
                value={userMessage}
                onChange={e => setUserMessage(e.target.value)}
              />
            </div>

            {/* Przycisk */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              Wyślij
            </button>

            {msg2 && (
              <div className={`p-3 rounded-lg text-sm text-center ${
                msg2.includes('Dziękujemy') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {msg2}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  </div>
</section>

			</main>

		</>
	)
}

export default ProductPromotion








