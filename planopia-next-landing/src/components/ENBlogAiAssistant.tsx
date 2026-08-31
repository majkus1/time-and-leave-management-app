'use client'

import { useState } from 'react'
import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import LandingSolutionsDropdown from './LandingSolutionsDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsEn,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'

const PAGE_URL =
	'https://planopia.pl/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules'
const ARTICLE_IMAGE = 'https://planopia.pl/img/aiass-en.webp'

const faqItems = [
	{
		q: 'Does the Planopia AI Assistant replace HR or accounting?',
		a: 'No. It supports everyday work on data already in the app — summaries, team context, faster answers to typical questions. Formal decisions, legal interpretation, and company policy remain with people.',
	},
	{
		q: 'Why does AI only really make sense when modules are connected?',
		a: 'When time tracking, leave, tasks, and schedules live in one system, the model can rely on consistent information instead of scattered spreadsheets and email threads. That reduces low-quality answers and improves usefulness.',
	},
	{
		q: 'Are there usage limits for the AI Assistant?',
		a: 'Yes — limits depend on your plan and stage (for example trial vs. active paid plan). See the pricing section on the homepage for current rules.',
	},
	{
		q: 'Does Planopia automate the entire leave request workflow?',
		a: 'You can run requests, approvals, and a leave calendar in an orderly way in the app — that is real process automation in an operational sense. The AI Assistant adds orientation and summaries; exact features depend on your plan.',
	},
	{
		q: 'How do I get started with Planopia and the AI Assistant?',
		a: 'Create a team in the app, invite users, and configure roles. After sign-in, explore time tracking, leave, tasks, and schedules — the AI Assistant uses your organization’s context within permissions.',
	},
	{
		q: 'Where can I watch the product step by step?',
		a: 'The blog includes video tutorials with short screen recordings — follow the link in this article or open the Blog section.',
	},
]

function ENBlogAiAssistant() {
	const [menuOpen, setMenuOpen] = useState(false)
	const toggleMenu = () => setMenuOpen(prev => !prev)

	const articleLd = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline:
			'Planopia AI Assistant: from time tracking and leave to tasks and schedules — one system instead of five tools',
		url: PAGE_URL,
		datePublished: '2026-03-27',
		dateModified: '2026-03-27',
		author: { '@type': 'Person', name: 'Michał Lipka' },
		publisher: {
			'@type': 'Organization',
			name: 'Planopia',
			logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.webp' },
		},
		description:
			'The Planopia AI Assistant connects time tracking, leave, tasks, and schedules in one place. Team and HR workflow automation without scattering data across Excel and email.',
		image: ARTICLE_IMAGE,
	}

	const faqLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqItems.map((item) => ({
			'@type': 'Question',
			name: item.q,
			acceptedAnswer: { '@type': 'Answer', text: item.a },
		})),
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

			<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link href="/en" className="logoinmenu text-2xl font-bold text-blue-700 companyname" style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="official logo planopia" style={{ maxWidth: '180px' }} />
					</Link>
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<Link href="/en#aboutapp" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							About App
						</Link>
						<Link href="/en#ai-assistant" className="cursor-pointer text-blue-600 font-medium hover:text-indigo-600 transition">
							AI Assistant
						</Link>
						<Link href="/en#prices" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Pricing
						</Link>
						<LandingSolutionsDropdown locale="en" />
						<LandingIndustriesDropdown locale="en" />
						<Link href="/en/blog" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition" onClick={toggleMenu}>
							Blog
						</Link>
						<Link href="/en#contact" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Contact
						</Link>
						<Link
							href="https://app.planopia.pl/"
							onClick={toggleMenu}
							className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition"
						>
							Login
						</Link>
						<Link
							href="https://app.planopia.pl/team-registration"
							onClick={toggleMenu}
							className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu"
						>
							Create your free team
						</Link>
						<Link href="/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik" className="flex items-center languagechoose">
							<img src="/img/poland.webp" alt="Polish version" className="w-6 h-6" />
						</Link>
					</nav>
					<HamburgerButton isOpen={menuOpen} onClick={toggleMenu} />
				</div>
			</header>

			<MobileMenu
				isOpen={menuOpen}
				onClose={toggleMenu}
				lang="en"
				menuItems={landingMobileNavItemsEn()}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig('en')}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{
					href: '/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik',
					flagSrc: '/img/poland.webp',
					alt: 'Polish version',
				}}
			/>

			<section
				className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-emerald-50/30 landing-hero-below-fixed-header"
				id="blog-ai-assistant-welcome"
			>
				<div className="max-w-4xl md:max-w-5xl xl:max-w-6xl mx-auto w-full">
					<div className="rounded-2xl md:rounded-3xl border border-indigo-100/90 bg-white shadow-md md:shadow-lg px-6 py-9 sm:px-10 sm:py-10 md:px-12 md:py-12 lg:px-16 lg:py-14 text-left md:text-center ring-1 ring-slate-200/60">
						<h1 className="font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 blogh1 leading-[1.2] tracking-tight max-w-5xl md:mx-auto">
							Planopia AI Assistant: from time tracking and leave to tasks and schedules — one system instead of five tools
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl md:max-w-4xl mx-0 md:mx-auto mb-6 sm:mb-8 md:mb-10 leading-snug sm:leading-relaxed">
							Planopia is not just time tracking — it is one ecosystem: working time, leave requests and calendar, task boards, schedules, and team communication.
							<strong className="font-semibold text-gray-800"> The AI Assistant</strong> works where the data already lives: it summarizes, explains, and speeds up orientation — within plan limits. Trial and plans:{' '}
							<Link href="/en#prices" className="text-blue-600 font-medium hover:underline whitespace-nowrap">
								pricing
							</Link>
							.
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-xl shadow-lg hover:bg-green-700 transition text-base sm:text-lg white-text-btn"
						>
							Create your free team
						</Link>
					</div>
				</div>
			</section>

			<article className="px-4 py-16 bg-white">
				<div className="max-w-4xl mx-auto">
					<p className="text-lg text-gray-700 mb-10 leading-relaxed">
						Teams looking for <strong>workflow automation</strong> and simpler <strong>HR operations</strong> often end up with several tools at once: a spreadsheet for hours, another for leave, a sticky board for tasks, and email for approvals. This article shows how an{' '}
						<strong>AI-powered time tracking app</strong> — integrated with leave, tasks, and schedules — reduces daily friction without promising magic or replacing human judgment.
					</p>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Why does AI only really make sense when modules are connected?
						</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Language models are most helpful when they can rely on consistent context. When <strong>time tracking and leave</strong> sit in one system together with <strong>team tasks</strong> and <strong>schedules</strong> or shift plans, users do not have to paste five different exports into chat — the app already knows who is on shift, who has a leave request, and what is on the board.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							That is the core idea of <strong>HR and operations automation</strong>: one source of truth instead of &quot;final_FINAL_v2.xlsx&quot;. Less manual retyping, fewer &quot;who is on first shift today?&quot; threads.
						</p>
						<div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg">
							<p className="text-indigo-900 font-semibold mb-2">In short: one system instead of five tools</p>
							<p className="text-indigo-950/90">
								Planopia brings these areas into one interface — so questions to the Assistant stay grounded in your organization, not generic web advice.
							</p>
						</div>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">What does the AI Assistant do in Planopia?</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							It is not there to settle legal disputes or replace your handbook. It helps — based on data and permissions in the app — with <strong>summaries</strong>, quick orientation, and typical questions: what needs attention today, how workload looks, and simple relationships between entries.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							In practice that means less time hunting through menus and more time for real management work. The <strong>Planopia AI Assistant</strong> is closer to operational support than a generic internet chat — because it is anchored in your team.
						</p>
						<ul className="list-disc pl-6 text-lg text-gray-700 space-y-2 mb-4">
							<li>orientation in team status: calendar, absences, active tasks;</li>
							<li>short summaries and explanations in plain language — within product limits and policy;</li>
							<li>alignment with modules: time tracking, leave, tasks, schedules — depending on your plan.</li>
						</ul>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Leave and time tracking — fewer mistakes, faster clarity</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							An <strong>online leave calendar</strong> in the same system as time tracking means you see not only &quot;who wrote an email&quot; but who actually has a request and a status in the app. That is the foundation for <strong>automating leave requests and time records</strong> in an operational sense: the flow stays inside the product instead of being scattered everywhere.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							For employees it is transparency: where is my request, what is still pending approval. For the team — fewer date clashes and faster answers to &quot;when can we ship this?&quot; when leave sits next to the schedule.
						</p>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Tasks and schedules — priorities and team capacity</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							<strong>Team task management</strong> on a board (for example Kanban-style) plus <strong>work schedules</strong> or shift plans show who can actually pick up work and when the team is thin because of leave or peak load.{' '}
							<strong>Can AI help with scheduling?</strong> It can support orientation and synthesis from data you already entered; staffing and policy decisions stay with people.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Together with the Assistant it is easier to see &quot;what is urgent&quot; next to &quot;who is available&quot; — without replacing managers, but with less manual table juggling.
						</p>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Automation without scattering data</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							<strong>Team workflow automation</strong> often starts with order: one place for time, absences, and tasks. Only then do integrations and smart hints pay off. Planopia also works as an <strong>HR tool for small businesses</strong>: quick start, roles, and room to grow when headcount and modules increase.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Instead of asking how to connect time tracking with leave and tasks via blind CSV imports — you get one flow in one app. That lowers maintenance and training cost compared to a patchwork of disconnected tools.
						</p>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Security, roles, and limits</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Access is split by roles and permissions — the AI Assistant does not bypass visibility rules you set in the app. <strong>AI Assistant limits</strong> depend on your plan and subscription stage; see{' '}
							<Link href="/en#prices" className="text-blue-600 font-medium hover:underline">
								pricing
							</Link>{' '}
							for details.
						</p>
						<p className="text-lg text-gray-700 leading-relaxed">
							Treat the Assistant as a help layer on data you deliberately enter — in line with GDPR, good practice, and your internal policies.
						</p>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">How to start and where to watch the product</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Register your team (trial and plans are described on the product pages), invite users, and configure modules as needed. If you prefer video, open{' '}
							<Link href="/en/how-to-use" className="text-blue-600 font-medium hover:underline">
								Planopia video tutorials
							</Link>{' '}
							— short screen recordings help you get started without reading a long manual.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							For the trial → free time tracking → paid plans model, see also{' '}
							<Link href="/en/blog/free-time-tracking-app" className="text-blue-600 font-medium hover:underline">
								the article about the free time tracking app
							</Link>
							.
						</p>
						<div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-6 text-center">
							<p className="text-lg text-emerald-900 font-semibold mb-3">Ready to try Planopia?</p>
							<Link
								href="https://app.planopia.pl/team-registration"
								className="inline-block bg-green-600 text-white font-semibold py-3 px-8 rounded-xl shadow hover:bg-green-700 transition white-text-btn"
							>
								Create your free team
							</Link>
						</div>
					</section>

					<section className="mb-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
						<div className="space-y-6">
							{faqItems.map((item) => (
								<div key={item.q} className="bg-gray-50 p-6 rounded-lg border border-gray-100">
									<h3 className="text-xl font-semibold text-gray-900 mb-2">{item.q}</h3>
									<p className="text-gray-700 leading-relaxed">{item.a}</p>
								</div>
							))}
						</div>
					</section>

					<BlogRelatedLinks slug="planopia-ai-assistant-time-tracking-leave-tasks-schedules" locale="en" className="mt-10" />
				</div>
			</article>

		</>
	)
}

export default ENBlogAiAssistant
