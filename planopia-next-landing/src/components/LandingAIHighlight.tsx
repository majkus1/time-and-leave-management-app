'use client'

type Locale = 'pl' | 'en'

const PL_LEAD =
	'Zadaj pytanie i dostań odpowiedź z kontekstu Twojej firmy: ewidencja, urlopy, zadania i grafik w jednym czacie. Asystent pomaga szybciej tworzyć raporty, podsumowania, wnioski i wpisy czasu pracy — bez przekopywania tabel.'

const EN_LEAD =
	'Ask once and get answers grounded in your company context: time, leave, tasks, and schedules in one chat. The assistant helps create reports, summaries, leave drafts, and time entries faster — without digging through spreadsheets.'

const strings = {
	pl: {
		eyebrow: 'Asystent AI Planopii',
		title: 'Asystent AI — mniej ręcznej pracy, więcej gotowych wniosków',
		leadParagraphs: [PL_LEAD],
		featuresHeading: 'Co potrafi Asystent AI?',
		bullets: [
			'Raporty i statystyki — szybkie wnioski dla HR, managera i właściciela',
			'Grafik zespołu — propozycje zmian według zasad, ról i wykluczeń',
			'Urlopy i ewidencja — pomoc przy wnioskach oraz wpisach czasu pracy',
			'Decyzje biznesowe — mniej zgadywania, więcej danych w jednym miejscu',
		],
		cta: 'Pakiety i limity Asystenta AI',
		ctaHref: '#cennik-pakiety-platne',
	},
	en: {
		eyebrow: 'Planopia AI Assistant',
		title: 'AI Assistant — less manual work, more ready-made insights',
		leadParagraphs: [EN_LEAD],
		featuresHeading: 'What can the AI Assistant do?',
		bullets: [
			'Reports and statistics — fast insights for HR, managers, and owners',
			'Team schedules — shift suggestions based on rules, roles, and exclusions',
			'Leave and timesheets — support for requests and time-log entries',
			'Business decisions — less guessing, more data in one place',
		],
		cta: 'Plans and AI Assistant limits',
		ctaHref: '#prices-paid-plans',
	},
} as const

export default function LandingAIHighlight({ locale }: { locale: Locale }) {
	const t = strings[locale]
	return (
		<section
			id={locale === 'pl' ? 'asystent-ai' : 'ai-assistant'}
			className="landing-ai-highlight py-12 px-4 relative overflow-hidden"
			aria-labelledby="ai-heading"
		>
			{/* Ambient glow */}
			<div
				className="pointer-events-none absolute inset-0 opacity-90"
				style={{
					background:
						'radial-gradient(ellipse 90% 70% at 15% 0%, rgba(0,166,62,0.14), transparent 55%), radial-gradient(ellipse 80% 60% at 85% 100%, rgba(16,47,94,0.08), transparent 50%)',
				}}
			/>
			<div className="max-w-7xl mx-auto relative z-[1]">
				<div className="landing-ai-shell rounded-3xl p-[1.5px]">
					<div className="landing-ai-panel rounded-3xl bg-white px-6 py-10 md:px-12 md:py-12 relative overflow-hidden">
						<div className="relative">
							<span
								className="pointer-events-none absolute right-0 top-0 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-cyan-100 bg-white shadow-md ring-2 ring-cyan-200/70 md:h-20 md:w-20"
								aria-hidden
							>
								<img src="/img/planio-ai.png" alt="" className="h-full w-full object-cover" />
							</span>
							<p className="ai-highlight-eyebrow mb-3 pr-20 md:pr-24">{t.eyebrow}</p>
							<h2 id="ai-heading" className="pr-20 md:pr-28">
								{t.title}
							</h2>
							<div className="ai-highlight-lead mt-4 space-y-4">
								{t.leadParagraphs.map((p, i) => (
									<p key={i} className="m-0">
										{p}
									</p>
								))}
							</div>
							<h3 id="ai-features-heading" className="ai-highlight-features mb-5">
								{t.featuresHeading}
							</h3>
							<ul
								className="mt-2 grid gap-4 sm:grid-cols-2"
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
								className="landing-ai-cta mt-9 inline-flex items-center gap-2 font-bold text-white px-7 py-3.5 rounded-xl transition"
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
