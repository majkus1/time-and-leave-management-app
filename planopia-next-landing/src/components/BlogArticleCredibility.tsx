import Link from 'next/link'

/**
 * Blok wiarygodności pod artykułem: źródła, zastrzeżenie prawne i autor.
 *
 * Powstał z kodu skopiowanego w pięciu artykułach prawnych — kopie zdążyły się
 * rozjechać (raz `<section>`, raz `<footer>`, dwie różne palety, dwa różne
 * podpisy autora). Jedno miejsce oznacza też, że rozłożenie standardu na
 * pozostałe wpisy to dopisanie trzech propsów, a nie przeklejenie 20 linii.
 */

export type ArticleSource = {
	label: string
	/** Bez adresu, gdy źródła nie da się rzetelnie zlinkować — sama nazwa aktu też jest informacją. */
	href?: string
}

const UI = {
	pl: {
		sourcesHeading: 'Źródła urzędowe',
		disclaimer: 'Materiał ma charakter informacyjny i nie zastępuje indywidualnej porady prawnej. Stan prawny zweryfikowano:',
		authorLabel: 'Autor:',
		updatedLabel: 'Zaktualizowano:',
	},
	en: {
		sourcesHeading: 'Official sources',
		disclaimer: 'This material is informational and does not replace individual legal advice. Legal state verified on:',
		authorLabel: 'Author:',
		updatedLabel: 'Updated:',
	},
} as const

type Props = {
	/**
	 * Bez źródeł blok pokazuje samą datę i autora. Teksty produktowe nie stawiają tez
	 * prawnych, więc doklejanie im zastrzeżenia o poradzie prawnej byłoby myleniem
	 * czytelnika co do charakteru artykułu.
	 */
	sources?: ArticleSource[]
	/** Data słownie, np. „26 sierpnia 2026 r." — ta sama, którą widzi czytelnik w nagłówku. */
	verifiedOn?: string
	/** Data ostatniej aktualizacji dla wariantu bez źródeł. Format ISO do atrybutu `dateTime`. */
	updatedOn?: { iso: string; label: string }
	author: string
	/** Link do strony autora — bez niego byline jest samym tekstem. */
	authorHref?: string
	locale?: 'pl' | 'en'
	headingId?: string
}

export default function BlogArticleCredibility({
	sources,
	verifiedOn,
	updatedOn,
	author,
	authorHref,
	locale = 'pl',
	headingId = 'sources-heading',
}: Props) {
	const t = UI[locale]
	const hasSources = Array.isArray(sources) && sources.length > 0

	const byline = (
		<p className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">
			{t.authorLabel}{' '}
			{authorHref ? (
				<Link href={authorHref} className="font-semibold text-slate-800 hover:underline">
					{author}
				</Link>
			) : (
				<strong className="font-semibold text-slate-800">{author}</strong>
			)}
			{updatedOn ? (
				<>
					{' · '}
					<time dateTime={updatedOn.iso}>
						{t.updatedLabel} {updatedOn.label}
					</time>
				</>
			) : null}
		</p>
	)

	if (!hasSources) {
		return <footer className="mt-12">{byline}</footer>
	}

	return (
		<footer className="mt-12" aria-labelledby={headingId}>
			<h2 id={headingId} className="text-2xl font-semibold text-slate-900">
				{t.sourcesHeading}
			</h2>
			<ul className="mt-4 space-y-3 pl-5 leading-relaxed text-slate-700">
				{sources.map(source => (
					<li key={source.label}>
						{source.href ? (
							<a
								className="text-emerald-700 hover:underline"
								href={source.href}
								rel="noopener noreferrer"
								target="_blank"
							>
								{source.label}
							</a>
						) : (
							source.label
						)}
					</li>
				))}
			</ul>
			{verifiedOn ? (
				<p className="mt-5 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
					{t.disclaimer} {verifiedOn}
				</p>
			) : null}
			{byline}
		</footer>
	)
}
