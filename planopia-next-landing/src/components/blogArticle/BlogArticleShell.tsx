import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import '../productLanding/productLanding.css'
import './blogArticle.css'
import { Arrow, Check } from '../productLanding/parts'

/**
 * Oprawa wpisów blogowych w języku stron produktowych (.pdl): hero z obrazem, spis treści, czytelna typografia
 * treści i końcowe CTA. Treść artykułu (nagłówki, akapity, linki) przychodzi jako children bez zmian — oprawa
 * nie dokłada ani nie zmienia tekstów SEO, tylko je układa. JSON-LD i metadane zostają w komponentach wpisów.
 */

export type ArticleLink = { href: string; label: string; download?: boolean; external?: boolean }
export type ArticleImage = { src: string; alt: string; width: number; height: number }

type Props = {
	locale?: 'pl' | 'en'
	crumb: { label: string; href?: string }
	pill: string
	h1: string
	lead: ReactNode
	primary: ArticleLink
	secondary?: ArticleLink
	/** Krótka informacja pod przyciskami (np. warunki próby) */
	note?: ReactNode
	/** Data aktualizacji i autor — ta sama data co dateModified w JSON-LD */
	meta?: { iso: string; label: string }
	image: ArticleImage
	toc?: { id: string; label: string }[]
	children: ReactNode
	cta: { title: string; note: string; primary: ArticleLink }
}

function CtaLink({ link, className, children }: { link: ArticleLink; className: string; children: ReactNode }) {
	// Pobieranie plików i adresy aplikacji to zwykłe <a>, przejścia w obrębie landingu — Link
	if (link.download || link.external || /^https?:\/\//.test(link.href)) {
		return (
			<a href={link.href} className={className} {...(link.download ? { download: true } : {})}>
				{children}
			</a>
		)
	}
	return (
		<Link href={link.href} className={className}>
			{children}
		</Link>
	)
}

export default function BlogArticleShell({ locale = 'pl', crumb, pill, h1, lead, primary, secondary, note, meta, image, toc, children, cta }: Props) {
	const isPl = locale === 'pl'
	return (
		<main className="pdl bart">
			<article>
				<section className="pdl-hero bart-hero" aria-labelledby="bart-h1">
					<div className="pdl-wrap pdl-hero__grid">
						<header className="pdl-hero__copy">
							<nav className="bart-crumbs" aria-label={isPl ? 'Ścieżka nawigacji' : 'Breadcrumb'}>
								<Link href={isPl ? '/blog' : '/en/blog'}>Blog</Link>
								<span aria-hidden="true">/</span>
								{crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
							</nav>
							<p className="pdl-pill">
								<span className="pdl-dot" />
								{pill}
							</p>
							<h1 id="bart-h1" className="pdl-hero__title bart-hero__title">
								{h1}
							</h1>
							<div className="pdl-hero__lead bart-hero__lead">{lead}</div>
							<div className="pdl-hero__ctas">
								<CtaLink link={primary} className="pdl-btn pdl-btn--primary">
									{primary.label}
									<Arrow />
								</CtaLink>
								{secondary ? (
									<CtaLink link={secondary} className="pdl-btn pdl-btn--ghost">
										{secondary.label}
									</CtaLink>
								) : null}
							</div>
							{note ? (
								<p className="bart-hero__note">
									<Check size={16} />
									<span>{note}</span>
								</p>
							) : null}
							{meta ? (
								<p className="bart-hero__meta">
									<time dateTime={meta.iso}>{meta.label}</time>
								</p>
							) : null}
						</header>
						<div className="pdl-hero__visual">
							<div className="bart-hero__frame">
								<Image src={image.src} alt={image.alt} width={image.width} height={image.height} className="bart-hero__img" priority unoptimized />
							</div>
						</div>
					</div>
				</section>

				<div className={`bart-body${toc?.length ? ' bart-body--toc' : ''}`}>
					<div className="pdl-wrap bart-grid">
						{toc?.length ? (
							<nav className="bart-toc" aria-label={isPl ? 'Spis treści' : 'Table of contents'}>
								<p className="bart-toc__title">{isPl ? 'W tym artykule' : 'In this article'}</p>
								<ol>
									{toc.map(item => (
										<li key={item.id}>
											<a href={`#${item.id}`}>{item.label}</a>
										</li>
									))}
								</ol>
							</nav>
						) : null}
						<div className="bart-prose">{children}</div>
					</div>
				</div>

				<section className="pdl-cta" aria-labelledby="bart-cta-heading">
					<div className="pdl-wrap pdl-cta__inner">
						<div>
							<h2 id="bart-cta-heading" className="pdl-cta__title">
								{cta.title}
							</h2>
							<p className="pdl-cta__note">{cta.note}</p>
						</div>
						<CtaLink link={cta.primary} className="pdl-btn pdl-btn--primary pdl-cta__btn">
							{cta.primary.label}
							<Arrow />
						</CtaLink>
					</div>
				</section>
			</article>
		</main>
	)
}

/** Wstawka w środku treści: krótka zachęta z przyciskiem — nie zastępuje tekstu artykułu, tylko go przerywa */
export function ArticleCta({ title, text, link }: { title: string; text: string; link: ArticleLink }) {
	return (
		<aside className="bart-inline-cta">
			<div>
				<p className="bart-inline-cta__title">{title}</p>
				<p className="bart-inline-cta__text">{text}</p>
			</div>
			<CtaLink link={link} className="pdl-btn pdl-btn--primary bart-inline-cta__btn">
				{link.label}
				<Arrow />
			</CtaLink>
		</aside>
	)
}

/** Wyróżniona ramka w treści (wskazówka, podsumowanie) — sam wygląd, treść bez zmian */
export function ArticleNote({ children, tone = 'mint' }: { children: ReactNode; tone?: 'mint' | 'paper' }) {
	return <div className={`bart-note bart-note--${tone}`}>{children}</div>
}
