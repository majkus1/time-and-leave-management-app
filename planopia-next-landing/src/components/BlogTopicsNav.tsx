import Link from 'next/link'
import { BLOG_TOPICS_PL } from '@/data/blogInternalLinks'

export default function BlogTopicsNav() {
	return (
		<section
			className="blog-topics-nav border-t border-slate-200 pt-10 md:pt-12"
			aria-labelledby="blog-topics-heading"
		>
			<h2 id="blog-topics-heading" className="m-0 w-full text-left text-2xl font-bold !text-[#102f5e] md:text-3xl">
				Według tematu
			</h2>
			<p className="mt-2 max-w-2xl text-left text-sm text-slate-600 md:text-base">
				Przewodniki o ewidencji czasu pracy, urlopach i Planopii — od darmowej aplikacji po branże i instrukcje.
			</p>
			<div className="mt-7 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
				{BLOG_TOPICS_PL.map((topic) => (
					<div
						key={topic.id}
						className="blog-topics-card border-l-2 border-slate-200 pl-4"
					>
						<h3 className="m-0 text-lg font-semibold !text-[#102f5e]">{topic.title}</h3>
						<p className="mt-1 text-sm leading-relaxed text-slate-600">{topic.description}</p>
						<ul className="mt-4 space-y-2.5">
							{topic.links.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="blog-topics-link text-sm font-medium !text-[#102f5e] visited:!text-[#102f5e] hover:!text-[#008f45] focus-visible:!text-[#008f45] no-underline hover:underline focus-visible:underline underline-offset-[5px]"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</section>
	)
}
