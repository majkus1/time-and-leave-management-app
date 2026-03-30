'use client'

import { useId, useState } from 'react'

type Locale = 'pl' | 'en'

/** Ten sam początek co zwinięty widok na mobile — pełny tekst to teaser + dalszy akapit (bez „skoku” po rozwinięciu). */
const PL_LEAD_TEASER =
	'Asystent AI w Planopii korzysta z danych zespołu (zgodnie z uprawnieniami), by przygotować podsumowania i rekomendacje dla HR oraz ułatwić pracownikom dostęp do urlopów, czasu pracy i zadań.'
const PL_LEAD_AFTER_TEASER =
	' Planujesz zespół, pilnujesz terminów i raportów? Na poziomie całej organizacji — wciąż w ramach uprawnień — asystent buduje szersze podsumowania, rekomendacje i konkretne działania. Wspiera codzienną pracę HR i managerów: od planowania urlopów po analizę czasu pracy i przygotowanie raportów.'

const EN_LEAD_TEASER =
	'The AI Assistant uses your team’s data (within permissions) to deliver summaries and recommendations for HR and quick access to leave, hours, and tasks for employees.'
const EN_LEAD_AFTER_TEASER =
	' Planning the team, deadlines, and reports? At company level — still within permissions — it turns that into concrete summaries, recommendations, and actions. It supports HR and managers every day — from leave planning to attendance analysis and reporting.'

const strings = {
	pl: {
		eyebrow: 'Nowość w Planopii',
		title: 'Asystent AI — mniej ręcznej pracy, więcej gotowych wniosków',
		leadTeaserMobile: PL_LEAD_TEASER,
		readMore: 'Czytaj więcej',
		showLess: 'Zwiń',
		leadParagraphs: [
			PL_LEAD_TEASER + PL_LEAD_AFTER_TEASER,
			'Dla pracowników to szybki dostęp do własnych danych — czas pracy, urlopy i zadania bez zbędnego klikania. AI może także automatycznie przygotować wniosek urlopowy lub uzupełnić ewidencję czasu pracy na podstawie przekazanych informacji.',
		],
		featuresHeading: '🔥 Co potrafi Asystent AI',
		bullets: [
			'Gotowe podsumowania i statystyki — szybkie wnioski zamiast analiz w tabelach',
			'Planowanie urlopów i nieobecności — dopasowane do zespołu i ról',
			'Grafik zespołu — osobny asystent AI do auto-uzupełnienia miesiąca (zmiany, wykluczenia) w formie rozmowy; ustawienia zespołu i potwierdzenie przed generowaniem',
			'Generowanie raportów i eksport — Excel, PDF, bez ręcznej pracy',
			'Wsparcie decyzji HR i managera — mniej zgadywania, więcej konkretów',
			'Automatyczne wnioski urlopowe i uzupełnianie ewidencji czasu pracy',
			'Szybki wgląd dla pracowników — wszystko w jednym miejscu',
		],
		cta: 'Pakiety i limity Asystenta AI',
		ctaHref: '#cennik',
	},
	en: {
		eyebrow: 'New in Planopia',
		title: 'AI Assistant — less manual work, more ready-made insights',
		leadTeaserMobile: EN_LEAD_TEASER,
		readMore: 'Read more',
		showLess: 'Show less',
		leadParagraphs: [
			EN_LEAD_TEASER + EN_LEAD_AFTER_TEASER,
			'For employees, it’s fast access to your own data — hours, leave, and tasks without extra clicking. AI can also draft a leave request or fill in your time log from the information you provide.',
		],
		featuresHeading: '🔥 What the AI Assistant can do',
		bullets: [
			'Ready-made summaries and stats — insights instead of spreadsheet crunching',
			'Leave and absence planning — tailored to your team and roles',
			'Team schedule — dedicated AI for monthly auto-fill (shifts, exclusions) via chat; team presets and confirmation before generation',
			'Reports and export — Excel, PDF, less manual work',
			'Support for HR and manager decisions — less guesswork, more clarity',
			'Automatic leave drafts and time-log entries',
			'Quick employee view — everything in one place',
		],
		cta: 'Plans and AI Assistant limits',
		ctaHref: '#prices',
	},
} as const

export default function LandingAIHighlight({ locale }: { locale: Locale }) {
	const t = strings[locale]
	const [leadExpanded, setLeadExpanded] = useState(false)
	const leadRegionId = useId()
	return (
		<section
			id={locale === 'pl' ? 'asystent-ai' : 'ai-assistant'}
			className="landing-ai-highlight py-12 px-4 relative overflow-hidden"
			aria-labelledby="ai-heading"
		>
			{/* Ambient glow — wyższa widoczność niż same przezroczyste gradienty */}
			<div
				className="pointer-events-none absolute inset-0 opacity-90"
				style={{
					background:
						'radial-gradient(ellipse 90% 70% at 15% 0%, rgba(56,189,248,0.22), transparent 55%), radial-gradient(ellipse 80% 60% at 85% 100%, rgba(167,139,250,0.2), transparent 50%), radial-gradient(ellipse 50% 40% at 50% 40%, rgba(244,114,182,0.08), transparent 65%)',
				}}
			/>
			<div className="max-w-7xl mx-auto relative z-[1]">
				<div className="rounded-3xl p-[1.5px] bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-indigo-500 shadow-[0_0_60px_-12px_rgba(34,211,238,0.45),0_25px_50px_-12px_rgba(0,0,0,0.5)]">
					<div className="rounded-3xl bg-white px-6 py-10 md:px-12 md:py-12 relative overflow-hidden shadow-inner shadow-slate-200/60">
						<div className="relative">
							<p className="ai-highlight-eyebrow mb-3">{t.eyebrow}</p>
							<h2 id="ai-heading">{t.title}</h2>
							<div className="ai-highlight-lead mt-5 max-w-3xl">
								<div className="hidden md:block space-y-4">
									{t.leadParagraphs.map((p, i) => (
										<p key={i} className="m-0">
											{p}
										</p>
									))}
								</div>
								<div className="md:hidden space-y-3">
									<div id={leadRegionId}>
										{leadExpanded ? (
											<div className="space-y-4">
												{t.leadParagraphs.map((p, i) => (
													<p key={i} className="m-0">
														{p}
													</p>
												))}
											</div>
										) : (
											<p className="m-0">{t.leadTeaserMobile}</p>
										)}
									</div>
									<button
										type="button"
										className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-sm"
										onClick={() => setLeadExpanded(v => !v)}
										aria-expanded={leadExpanded}
										aria-controls={leadRegionId}
									>
										{leadExpanded ? t.showLess : t.readMore}
									</button>
								</div>
							</div>
							<h3 id="ai-features-heading" className="ai-highlight-features mb-5">
								{t.featuresHeading}
							</h3>
							<ul
								className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
								aria-labelledby="ai-features-heading"
							>
								{t.bullets.map(b => (
									<li
										key={b}
										className="ai-highlight-card rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-4 shadow-sm"
									>
										<span className="ai-bullet-icon inline-block mr-2 leading-none align-middle" aria-hidden>
											✦
										</span>
										{b}
									</li>
								))}
							</ul>
							<a
								href={t.ctaHref}
								className="landing-ai-cta mt-9 inline-flex items-center gap-2 font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:via-violet-500 hover:to-indigo-600 px-7 py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/35 ring-2 ring-indigo-950/10 hover:shadow-xl hover:shadow-indigo-500/40"
							>
								{t.cta}
								<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
								</svg>
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
