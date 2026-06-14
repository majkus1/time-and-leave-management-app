import Link from 'next/link'
import { BLOG_TOPICS_PL } from '@/data/blogInternalLinks'

export default function BlogTopicsNav() {
	return (
		<section
			className="blog-topics-nav mb-10 md:mb-14 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 md:p-8"
			aria-labelledby="blog-topics-heading"
		>
			<h2 id="blog-topics-heading" className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
				Według tematu
			</h2>
			<p className="text-left text-gray-600 text-sm md:text-base mb-8 max-w-2xl">
				Przewodniki o ewidencji czasu pracy, urlopach i Planopii — od darmowej aplikacji po branże i instrukcje.
			</p>
			<div className="grid gap-6 md:grid-cols-2">
				{BLOG_TOPICS_PL.map((topic) => (
					<div
						key={topic.id}
						className="blog-topics-card rounded-xl bg-white border border-slate-100 p-5 shadow-sm"
					>
						<h3 className="text-lg font-semibold text-gray-900 mb-1">{topic.title}</h3>
						<p className="text-sm text-gray-600 mb-4">{topic.description}</p>
						<ul className="space-y-2">
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
