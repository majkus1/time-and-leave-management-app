'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { API_URL } from '../config'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import { pl } from 'date-fns/locale/pl'

function ProductPromotion() {
	const [menuOpen, setMenuOpen] = useState(false)
	const toggleMenu = () => setMenuOpen(prev => !prev)
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const [userMessage, setUserMessage] = useState('')
	const [email2, setEmail2] = useState('')
	const [datetime, setDatetime] = useState<Date | null>(null)
	const [msg2, setMsg2] = useState('')
	registerLocale('pl', pl)

	const minTime = new Date()
	minTime.setHours(7, 0, 0)

	const maxTime = new Date()
	maxTime.setHours(23, 0, 0)

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
						"description": "Darmowa aplikacja online do ewidencji czasu pracy i urlopów dla zespołów do 8 użytkowników. Plany płatne oferują nielimitowaną liczbę użytkowników, elastyczne funkcje i integracje.",
						"offers": {
							"@type": "Offer",
							"price": "0",
							"priceCurrency": "PLN",
							"category": "Free",
							"description": "Darmowy plan dla zespołów do 8 użytkowników"
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
						<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }} />
					</Link>
					<nav className="hidden flex space-x-8 navdesktop">
						<a
							href="#oaplikacji"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							O Aplikacji
						</a>
						<a
							href="#cennik"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Cennik
						</a>
						<a
							href="#kontakt"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Kontakt
						</a>
						<Link
							href="/blog"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition"
							onClick={toggleMenu}>
							Blog
						</Link>
						<Link
  href="https://app.planopia.pl/"
  onClick={toggleMenu}
  className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition"
>
  Logowanie
</Link>

<Link
  href="https://app.planopia.pl/team-registration" // <- tutaj raczej kierujesz na rejestrację zespołu
  onClick={toggleMenu}
  className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu"
>
  Załóż darmowy zespół
</Link>

						<Link href="/en" className="flex items-center languagechoose">
							<img src="/img/united-kingdom.webp" alt="English version" className="w-6 h-6" />
						</Link>
					</nav>

					<button
						className="lg:hidden text-gray-700 text-3xl focus:outline-none"
						onClick={toggleMenu}
						style={{ fontSize: '36px' }}>
						{menuOpen ? '✕' : '☰'}
					</button>
				</div>
				{menuOpen && (
					<div
						className="navmobile lg:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 flex flex-col items-start
">
						<a
							href="#oaplikacji"
							onClick={toggleMenu}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							O Aplikacji
						</a>
						<a
							href="#cennik"
							onClick={toggleMenu}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							Cennik
						</a>
						<a
							href="#kontakt"
							onClick={toggleMenu}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							Kontakt
						</a>
						<Link
							href="/blog"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4"
							onClick={toggleMenu}>
							Blog
						</Link>
						<Link
  href="https://app.planopia.pl/"
  onClick={toggleMenu}
  className="w-full text-center bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded mb-4 hover:bg-blue-50 hover:text-blue-700 transition"
>
  Logowanie
</Link>

<Link
  href="https://app.planopia.pl/team-registration" // <- tu najlepiej daj ścieżkę do rejestracji zespołu
  onClick={toggleMenu}
  className="ctamenu w-full text-center bg-green-600 text-white font-semibold py-2 px-4 rounded mb-4 shadow hover:bg-green-700 transition"
>
  Załóż darmowy zespół
</Link>

						<Link href="/en" className="flex items-center languagechoose" style={{ marginTop: '15px' }}>
							<img src="/img/united-kingdom.webp" alt="English version" className="w-6 h-6" />
						</Link>
					</div>
				)}
			</header>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid md:grid-cols-2 gap-10 items-center">
						<div className="ordering">
							<h1 className="text-2xl sm:text-3xl font-bold text-blue-700">
							Ewidencja czasu pracy i urlopów – darmowa aplikacja do 8 użytkowników
							</h1>{' '}
							<h2 className="font-semibold text-gray-800" id="underheader">
							Planopia pomaga zespołom i firmom uporządkować czas pracy i urlopy.
							</h2>
							<Link
								href="https://app.planopia.pl/team-registration"
								className="bg-green-600 text-white font-semibold py-3 px-4 rounded shadow hover:bg-green-700 transition mt-2">
								Załóż darmowy zespół
							</Link>
						</div>
						<img
							src="/img/headerimage.png"
							alt="biznesmen zaznaczający aplikację"
							className="rounded-xl w-full h-auto aspect-[3/2]"
						/>
					</div>
				</div>
			</section>

			<section id="oaplikacji" className="py-16 bg-white px-4">
  <div className="max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-10 items-center">
      {/* Tekst */}
      <div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          Proste zarządzanie czasem pracy i urlopami
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Zapomnij o Excelach i mailach. Planopia automatyzuje ewidencję, zgłaszanie nieobecności i akceptacje — szybciej, czytelniej, bez błędów.
        </p>

        {/* Feature grid */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {/* 1 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
            <img src="img/schedule time works.png" className='icon-landing-about'/>
            <div>
              <p className="font-semibold text-gray-900">Ewidencja czasu pracy</p>
              <p className="text-sm text-gray-600">Kalendarz, nadgodziny i podsumowania pracy.</p>
            </div>
          </div>
          {/* 2 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="img/sunbed.png" className='icon-landing-about'/>
            <div>
              <p className="font-semibold text-gray-900">Urlopy i nieobecności</p>
              <p className="text-sm text-gray-600">Wnioski, akceptacje, powiadomienia.</p>
            </div>
          </div>
          {/* 3 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="img/pdf.png" className='icon-landing-about'/>
            <div>
			<p className="font-semibold text-gray-900">Dokumenty</p>
<p className="text-sm text-gray-600">Generowanie PDF: kalendarze pracy i wnioski urlopowe zawsze pod ręką.</p>
            </div>

          </div>
          {/* 4 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="img/verified.png" className='icon-landing-about'/>
            <div>
              <p className="font-semibold text-gray-900">Bezpieczeństwo</p>
              <p className="text-sm text-gray-600">Bezpieczne logowanie i szyfrowane połączenia chronią Twoją firmę.</p>
            </div>

          </div>
          {/* 5 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="img/booking.png" className='icon-landing-about'/>
            <div>
              <p className="font-semibold text-gray-900">PWA i mobile</p>
              <p className="text-sm text-gray-600">Dodaj do ekranu i używaj jak appki.</p>
            </div>

          </div>
          {/* 6 */}
          <div className="flex gap-3 p-4 rounded-xl border border-gray-200">
		  <img src="img/technical-support.png" className='icon-landing-about'/>
            <div>
			<p className="font-semibold text-gray-900">Indywidualne wsparcie</p>
<p className="text-sm text-gray-600">Czat i pomoc dla Twojego zespołu — w razie pytań lub problemów.</p>

            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
  <p className="text-gray-600">
    Potrzebujesz więcej funkcji, własnych integracji lub osobnego środowiska dla firmy? 
  </p>
  <a
							href="#cennik"
							className="text-blue-600 font-medium hover:underline">
    Zobacz cennik →
  </a>
</div>

      </div>
{/* Obraz / screen produktu */}
<div className="relative flex justify-center items-center mockup-rotator">
  <img
    src="img/desktop.png"
    alt="Planopia – widok desktop"
    className="rounded-xl shadow-xl ring-1 ring-black/5 desktop-mockup"
  />
  <img
    src="img/mobile.png"
    alt="Planopia – widok mobile"
    className="rounded-xl shadow-xl ring-1 ring-black/5 mobile-mockup"
  />
</div>

    </div>
  </div>
</section>


<section id="dlakogo" className="py-16 bg-gray-50 px-4 for">
  <div className="max-w-7xl mx-auto">
    <div className="max-w-3xl mb-10">
      <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">Dla kogo jest Planopia?</h3>
      <p className="mt-3 text-lg text-gray-600">
        Od kilku do kilkuset pracowników — Planopia skaluje się razem z Twoją organizacją. Wybierz sposób pracy, a my uprościmy resztę.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-6 mb-4">
      {/* 1: Małe zespoły */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-700 font-semibold">👥</span>
          <p className="font-semibold text-gray-900">Małe zespoły</p>
        </div>
        <p className="mt-3 text-gray-600 text-sm">
          Szybka ewidencja, proste wnioski, przejrzysty kalendarz. <span className="font-semibold text-green-700">Do 8 użytkowników za darmo.</span>
        </p>
      </div>

      {/* 2: Firmy i organizacje */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-semibold">🏢</span>
          <p className="font-semibold text-gray-900">Firmy i organizacje</p>
        </div>
        <p className="mt-3 text-gray-600 text-sm">
          Centralna kontrola nad czasem pracy, akceptacjami i raportami. Integracje oraz uprawnienia dla ról.
        </p>
      </div>

      {/* 3: HR i menedżerowie */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-700 font-semibold">👩‍💼</span>
          <p className="font-semibold text-gray-900">HR i menedżerowie</p>
        </div>
        <p className="mt-3 text-gray-600 text-sm">
          Sprawna obsługa wniosków, powiadomienia e-mail i komplet dokumentów do kontroli i rozliczeń.
        </p>
      </div>
    </div>
	
	<Link
								href="https://app.planopia.pl/team-registration"
								className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition mt-4 for">
								Załóż darmowy zespół
							</Link>
  </div>
</section>


{/* CENNIK */}
<section id="cennik" className="py-16 px-4">
  <div className="max-w-7xl mx-auto text-center">
    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Cennik</h2>

	<p className="mt-3 text-gray-600 max-w-3xl">Darmowy plan obejmuje maksymalnie 8 aktywnych użytkowników.<br></br>
  Po przekroczeniu tego limitu cała organizacja przechodzi na plan płatny 
  i opłata naliczana jest za wszystkich aktywnych użytkowników.</p>

  <p className="mt-3 text-gray-600">
      Ta sama funkcjonalność, różne formy rozliczenia.</p>

    {/* Karty planów */}
    <div className="grid gap-6 md:grid-cols-2 mt-10">
      {/* Pakiet miesięczny */}
      <div className="bg-white shadow p-8 rounded-2xl border border-gray-200">
        <h3 className="text-2xl font-semibold mb-4">Pakiet miesięczny</h3>
        <p className="text-4xl font-bold text-green-600 mb-2">
          11,10&nbsp;zł <span className="text-lg font-normal text-gray-700">/os./mies. (9,00&nbsp;zł netto)</span>
        </p>
        <p className="text-gray-600 mb-8">Płatność co miesiąc, możesz zrezygnować w każdej chwili.</p>
        <button
          onClick={() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-medium shadow hover:bg-green-700 transition"
        >
          Wybieram pakiet miesięczny
        </button>
      </div>

      {/* Pakiet roczny */}
      <div className="bg-white shadow p-8 rounded-2xl border border-gray-200">
        <h3 className="text-2xl font-semibold mb-4">Pakiet roczny</h3>
        <p className="text-4xl font-bold text-blue-600 mb-2">
          111,00&nbsp;zł <span className="text-lg font-normal text-gray-700">/os./rok (90,24&nbsp;zł netto)</span>
        </p>
        <p className="text-gray-600 mb-8">2 miesiące gratis przy płatności z góry za cały rok.</p>
        <button
          onClick={() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium shadow hover:bg-blue-700 transition"
        >
          Wybieram pakiet roczny
        </button>
      </div>
    </div>

    {/* Co zyskujesz ponad wersję FREE */}
    <div className="mt-14">
      <h4 className="text-2xl font-bold text-gray-900">Co zyskujesz w planach płatnych?</h4>
      <p className="mt-2 text-gray-600">
        Wszystko z wersji darmowej + elastyczność i wsparcie dopasowane do firmy.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 text-left">
        {/* Więcej użytkowników */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
		<img src="img/add-user.png" className='icon-landing-about'/>
          <div>
            <p className="font-semibold text-gray-900">Nielimitowana liczba użytkowników</p>
            <p className="text-sm text-gray-600">Rośniesz bez ograniczeń — dodawaj kolejne osoby.</p>
          </div>
        </div>

        {/* Personalizacja wyglądu */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
		<img src="img/creativity.png" className='icon-landing-about'/>
          <div>
            <p className="font-semibold text-gray-900">Wygląd dopasowany do firmy</p>
            <p className="text-sm text-gray-600">Twoje logo, kolory i branding w całej aplikacji.</p>
          </div>
        </div>

        {/* Funkcje na życzenie */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
		<img src="img/settings.png" className='icon-landing-about'/>
          <div>
            <p className="font-semibold text-gray-900">Funkcje na życzenie</p>
            <p className="text-sm text-gray-600">Dodatki i modyfikacje pod procesy w Twojej firmie.</p>
          </div>
        </div>

        {/* Integracje */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
          <img src="img/add.png" className='icon-landing-about'/>
          <div>
            <p className="font-semibold text-gray-900">Integracje na zamówienie</p>
            <p className="text-sm text-gray-600">RCP, importy, automaty — łączymy Planopię z Twoimi systemami.</p>
          </div>
        </div>

        {/* Wsparcie 24/7 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
		<img src="img/technical-support.png" className='icon-landing-about'/>
          <div>
            <p className="font-semibold text-gray-900">Indywidualne wsparcie 24/7</p>
            <p className="text-sm text-gray-600">Czat i szybka pomoc, gdy czegoś potrzebujesz.</p>
          </div>
        </div>

        {/* Dedykowane środowisko */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
		<img src="img/database.png" className='icon-landing-about'/>
          <div>
            <p className="font-semibold text-gray-900">Osobne środowisko</p>
            <p className="text-sm text-gray-600">Dedykowana subdomena i odizolowana baza danych.</p>
          </div>
        </div>

        {/* Mobile / PWA */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-3">
		<img src="img/booking.png" className='icon-landing-about'/>
          <div>
            <p className="font-semibold text-gray-900">PWA i mobile</p>
            <p className="text-sm text-gray-600">Dodaj do ekranu i używaj jak aplikacji mobilnej.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

</section>



<section id="kontakt" className="py-16 px-4 bg-gray-50">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900">Kontakt</h2>
    <p className="mt-3 text-left text-gray-600">
      Masz pytania, chcesz wdrożenie lub prezentację? Napisz, zadzwoń albo umów rozmowę online.
    </p>

    <div className="mt-10 grid gap-8 md:grid-cols-2 max-w-7xl mx-auto">
      {/* Lewa kolumna – dane kontaktowe */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center">
          <img
            src="/img/1709827103942.webp"
            alt="Zdjęcie profilowe Michał Lipka"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="ml-4">
            <p className="text-lg font-semibold text-gray-900 mb-0">Michał Lipka</p>
            <p className="text-sm text-gray-600">Twórca Planopii • Wdrożenia i wsparcie</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 mb-4">
          <a
            href="mailto:michalipka1@gmail.com"
            className="flex items-center gap-3 text-gray-800 hover:underline"
          >
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            michalipka1@gmail.com
          </a>

          <a href="tel:+48516598792" className="flex items-center gap-3 text-gray-800 hover:underline">
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 12 19.8 19.8 0 0 1 .08 3.69 2 2 0 0 1 2.06 1.5h2A2 2 0 0 1 6 3.09c.12.9.35 1.77.68 2.6.2.5.06 1.07-.32 1.44l-1 1a16 16 0 0 0 6.4 6.4l1-1c.37-.38.94-.52 1.44-.32.83.33 1.7.56 2.6.68A2 2 0 0 1 20 16.92z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            +48 516 598 792
          </a>

          <a
            href="https://www.linkedin.com/in/michal-lipka-wd/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-blue-600 hover:underline"
          >
            <img src="/img/linkedin.webp" alt="Logo LinkedIn" className="w-5 h-5" />
            LinkedIn
          </a>
        </div>

        <p className="mt-6 text-gray-600 text-sm">
          Wdrożę Planopię w Twojej firmie i pomogę dopasować funkcje do procesów. Odezwij się — odpowiem szybko.
        </p>
      </div>

      {/* Prawa kolumna – formularz */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <p className="text-2xl font-bold mb-2 text-gray-900">Formularz kontaktowy</p>
        <p className="mb-6 text-gray-600">
          Umów rozmowę online lub zostaw wiadomość — wrócę z odpowiedzią.
        </p>

        <form onSubmit={handleSubmitMeeting} className="space-y-3">
          {/* Email */}
          <div>
            <label htmlFor="contact-email" className="sr-only">E-mail</label>
            <input
              id="contact-email"
              type="email"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Twój adres e-mail"
              value={email2}
              onChange={e => setEmail2(e.target.value)}
              required
            />
          </div>

          {/* Datepicker */}
          <div>
            <label htmlFor="contact-date" className="sr-only">Data i godzina</label>
            <DatePicker
              id="contact-date"
              selected={datetime}
              onChange={setDatetime}
              showTimeSelect
              timeIntervals={30}
              minTime={minTime}
              maxTime={maxTime}
              dateFormat="Pp"
              timeCaption="Godzina"
              locale="pl"
              placeholderText="Wybierz datę i godzinę (opcjonalnie)"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Wiadomość */}
          <div>
            <label htmlFor="contact-message" className="sr-only">Wiadomość</label>
            <textarea
              id="contact-message"
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Twoja wiadomość"
              value={userMessage}
              onChange={e => setUserMessage(e.target.value)}
            />
          </div>

          {/* Przycisk */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white rounded-md hover:bg-green-700 px-6 py-3 font-medium transition"
          >
            Wyślij
          </button>

          {msg2 && <p className="mt-2 text-sm text-center text-gray-700">{msg2}</p>}

        </form>
      </div>
    </div>
  </div>
</section>


			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }} />
				{/* <a href="/blog/jak-usprawnic-firme" className="text-sm text-gray-600 hover:underline mt-2 block">
					Aplikacja do ewidencji czasu pracy może usprawnić Twoją firmę
				</a> */}
			</footer>
		</>
	)
}

export default ProductPromotion



