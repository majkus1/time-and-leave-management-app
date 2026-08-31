import Link from 'next/link'

const DOWNLOAD_HREF = '/downloads/roczny-plan-urlopow-2027-planopia.xlsx'
const PDF_HREF = '/downloads/roczny-plan-urlopow-2027-planopia.pdf'
// Prowadzi do wpisu o wzorze 2027, a nie do porownania formatow: baner podaje sam plik,
// a tamten wpis dokłada kalendarz świąt, mosty i instrukcję wypełniania.
const PILLAR_HREF = '/blog/plan-urlopow-2027-excel-pdf'

type Props = {
	/** Domyślnie odstęp my-10; ustaw np. "mt-10" gdy baner kończy artykuł. */
	className?: string
}

/**
 * Baner-magnes: darmowy szablon Excel rocznego planu urlopów.
 * Bezpośrednie pobranie (bez bramki) + cross-link do pillara „Excel, PDF czy aplikacja".
 */
export default function LeaveTemplateBanner({ className = 'my-10' }: Props) {
	return (
		<aside
			className={`overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-sky-50/40 p-6 shadow-sm ring-1 ring-emerald-100/60 md:p-8 ${className}`}
			aria-labelledby="leave-template-banner-heading"
		>
			<div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-7">
				<div
					className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-600 shadow-md md:h-16 md:w-16"
					aria-hidden
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#ffffff"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="h-7 w-7 md:h-8 md:w-8"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<path d="M14 2v6h6" />
						<path d="m9 13 6 6" />
						<path d="m15 13-6 6" />
					</svg>
				</div>

				<div className="min-w-0 flex-1">
					<p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800/90">
						Darmowy szablon
					</p>
					<h2
						id="leave-template-banner-heading"
						className="mt-1 text-xl font-bold leading-snug text-gray-900 md:text-2xl"
					>
						Pobierz roczny plan urlopów 2027 w Excelu
					</h2>
					<p className="mt-2 text-sm leading-relaxed text-gray-700 md:text-base">
						Gotowy plik XLSX: lista pracowników, wnioski, automatyczne liczenie dni roboczych, roczny widok i
						podsumowanie obłożenia. Uwzględnia wszystkie 14 dni wolnych w 2027 roku, razem z Wigilią. Edytuj w Excelu lub
						Arkuszach Google — jest też wersja PDF do druku.
					</p>

					<div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
						<a
							href={DOWNLOAD_HREF}
							download
							className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold shadow-md transition hover:bg-emerald-700 white-text-btn"
						>
							Pobierz szablon Excel
						</a>
						<a
							href={PDF_HREF}
							download
							className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-emerald-600 px-6 py-3 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50"
						>
							Wersja PDF do druku
						</a>
						<Link
							href={PILLAR_HREF}
							className="inline-flex items-center text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline"
						>
							Kalendarz 2027, mosty i instrukcja →
						</Link>
					</div>
				</div>
			</div>
		</aside>
	)
}
