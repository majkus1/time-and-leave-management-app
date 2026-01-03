import Link from 'next/link'

export default function ENBlogSevenContent() {
	const blogPostingSchema = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		"headline": "Comprehensive Company Management App – Everything in One Place",
		"description": "Planopia is a comprehensive company management app. Time tracking, leave management, work schedules, team chats, task boards, and flexible role configuration. Everything in one tool for your team.",
		"image": ["https://planopia.pl/img/worktimeblog.webp"],
		"author": {
			"@type": "Person",
			"name": "Michał Lipka"
		},
		"publisher": {
			"@type": "Organization",
			"name": "Planopia",
			"logo": {
				"@type": "ImageObject",
				"url": "https://planopia.pl/img/planopiaheader.webp"
			}
		},
		"url": "https://planopia.pl/en/blog/comprehensive-company-management-app",
		"datePublished": "2026-01-03",
		"dateModified": "2026-01-03",
		"inLanguage": "en-US",
		"wordCount": 1700,
		"keywords": "comprehensive company management app, time tracking, leave management, work schedules, team chats, task boards, role configuration, Planopia",
		"mainEntityOfPage": {
			"@type": "WebPage",
			"@id": "https://planopia.pl/en/blog/comprehensive-company-management-app"
		}
	}

	const faqSchema = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"mainEntity": [
			{
				"@type": "Question",
				"name": "Is Planopia free?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Yes, Planopia offers a free version for teams up to 4 users. All features are available at no cost. For larger companies, paid plans are available with unlimited users."
				}
			},
			{
				"@type": "Question",
				"name": "Does the app enable time tracking?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Yes, Planopia enables time tracking according to typical requirements. The app supports the process of work hours registration, overtime tracking, report generation, and data export to PDF and Excel needed for documentation."
				}
			},
			{
				"@type": "Question",
				"name": "Can I export data to Excel?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Yes, Planopia allows data export to PDF and Excel formats. You can export work calendars, leave reports, and other data in formats suitable for further analysis."
				}
			},
			{
				"@type": "Question",
				"name": "Does the app work on mobile phones?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Yes, Planopia works as a Progressive Web App (PWA), which means you can add it to your phone or tablet home screen and use it like a native mobile app. All features are available on mobile devices."
				}
			},
			{
				"@type": "Question",
				"name": "What features does the comprehensive Planopia app offer?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Planopia combines time tracking, leave management, work schedules, team chats, task boards (Kanban), and flexible role configuration. Everything in one app, without the need for multiple separate tools."
				}
			}
		]
	}

	return (
		<>
			{/* Schema.org JSON-LD - BlogPosting */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(blogPostingSchema)
				}}
			/>
			{/* Schema.org JSON-LD - FAQPage */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(faqSchema)
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="blog-hero" style={{ marginTop: '70px' }}>
				<div className="max-w-7xl mx-auto text-left content-blog">
					<div className="grid xl:grid-cols-2 gap-10 items-center">
						<div>
							<h1 className="text-4xl font-bold mb-6">
								Comprehensive Company Management App – Everything in One Place
							</h1>
							<p className="text-gray-700 text-lg">
								<strong>Planopia</strong> is not just a time tracking and leave management app. 
								It's a comprehensive company management tool that combines <strong>time tracking</strong>, 
								<strong> leave management</strong>, <strong>work schedules</strong>, <strong>team chats</strong>, 
								<strong> task boards</strong>, and flexible <strong>role configuration</strong>. Everything in one place, 
								for your entire team.
							</p>

							{/* CTA boxy */}
							<div className="mt-6 grid sm:grid-cols-2 gap-4 cta-blog">
								<div className="bg-white border border-gray-200 rounded-xl py-5 px-4 shadow-sm text-center">
									<p className="text-gray-800 mb-3">
										👉 <strong>Free app</strong>  
										<br />for teams up to 4 users
									</p>
									<Link
										href="https://app.planopia.pl/team-registration"
										className="inline-block first-cta bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition"
									>
										Create a free team
									</Link>
								</div>
								<div className="bg-white border border-gray-200 rounded-xl py-5 px-4 shadow-sm text-center">
									<p className="text-gray-800 mb-3">
									👉 <strong>For larger companies: </strong>  
									unlimited users, flexible features and integrations
									</p>
									<Link
										href="/en#prices"
										className="inline-block sec-cta bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
									>
										See pricing
									</Link>
								</div>
							</div>
						</div>

						<figure>
							<img
								src="/img/desktop-ennew.webp"
								alt="Comprehensive Company Management App – Planopia"
								className="rounded-xl w-full h-auto aspect-[4/2] shadow-lg mockup-blog-desktop"
							/>
							<figcaption className="text-sm text-gray-600 mt-2 text-center figcaption-desktop">Comprehensive Company Management App – Planopia</figcaption>
						</figure>
						<figure>
							<img
								src="/img/mobile-ennew.webp"
								alt="Comprehensive Company Management App – Planopia"
								className="rounded-xl shadow-xl ring-1 ring-black/5 mx-auto mockup-blog-mobile"
							/>
							<figcaption className="text-sm text-gray-600 mt-2 text-center figcaption-mobile">Planopia – mobile view</figcaption>
						</figure>
					</div>
				</div>
			</section>

			<main>
				<article className="max-w-6xl mx-auto px-6 py-12">
					<h2 className="text-2xl font-semibold mb-3">Why Choose a Comprehensive Company Management App?</h2>
					<p className="mb-4 text-gray-700">
						Modern companies need tools that combine different aspects of team management in one place. 
						Instead of using many separate apps – for time tracking, leave management, communication, and project management – 
						you can have <strong>everything in one app</strong>. This saves time, reduces costs, and increases work efficiency.
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Time Tracking and Leave Management</h2>
					<p className="mb-4 text-gray-700">
						<strong>Planopia</strong> offers complete <Link href="/en/blog/time-tracking-online" className="text-blue-600 hover:underline font-semibold">time tracking</Link> with calendars, overtime, and summaries. 
						Employees can easily record work hours, and managers have access to detailed reports. 
						<Link href="/en/blog/leave-planning" className="text-blue-600 hover:underline"> Leave requests</Link> are submitted online, approved with one click, and automatically added to the team calendar. 
						All data can be exported to <strong>PDF and Excel</strong>.
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Work Schedules</h2>
					<p className="mb-4 text-gray-700">
						The <strong>work schedules</strong> module allows you to plan and manage schedules for the entire team. 
						You can create schedules months in advance, assign employees to specific shifts, 
						monitor hour coverage, and avoid conflicts. Schedules are visible to the entire team, 
						which increases transparency and facilitates planning.
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Chats and Internal Communication</h2>
					<p className="mb-4 text-gray-700">
						<strong>Team chats</strong> and department channels enable quick internal communication without the need for external tools. 
						You can create channels for specific departments, projects, or topics. 
						All conversations are in one place, making it easier to track important information and decisions.
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Task Boards and Project Management</h2>
					<p className="mb-4 text-gray-700">
						<strong>Task boards</strong> in Kanban style allow you to manage projects and tasks in a clear way. 
						You can create boards for different projects, assign tasks to team members, 
						track progress, and manage priorities. Everything in one place, without the need for separate tools.
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Flexible Role Configuration and Permissions</h2>
					<p className="mb-4 text-gray-700">
						One of the most important advantages of <strong>Planopia</strong> is its well-thought-out <strong>role logic</strong> and the ability to 
						<strong> configure permissions</strong>. You can create your own roles, assign them specific permissions for individual 
						modules and features. This ensures that each user has access only to what they need, 
						and data security is maintained. The role system is flexible and can be adapted to the specifics of each company.
					</p>
					<ul className="list-disc pl-6 mb-4 text-gray-700">
						<li>Creating custom roles with specific permissions</li>
						<li>Assigning roles to users and departments</li>
						<li>Controlling access to individual modules (time tracking, leaves, schedules, chats, boards)</li>
						<li>Ability to grant permissions for request approval and data management</li>
						<li>Flexible configuration adapted to company processes</li>
					</ul>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Everything in One Place</h2>
					<p className="mb-4 text-gray-700">
						<strong>Planopia</strong> combines all these features in one app, which means:
					</p>
					<ul className="list-disc pl-6 mb-4 text-gray-700">
						<li>One login and password for the entire team</li>
						<li>Shared database – all information is synchronized</li>
						<li>Lower costs – you don't have to pay for many separate tools</li>
						<li>Easier implementation – one system instead of several</li>
						<li>Better integration – all modules work together</li>
						<li>More convenient operation – one interface to learn</li>
					</ul>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Who is Planopia For?</h2>
					<p className="mb-4 text-gray-700">
						<strong>Planopia</strong> works well for both small teams and larger companies:
					</p>
					<ul className="list-disc pl-6 mb-4 text-gray-700">
						<li><strong>Small teams</strong> – free version for up to 4 users, all features available</li>
						<li><strong>Medium companies</strong> – unlimited number of users, flexible configuration</li>
						<li><strong>Large organizations</strong> – possibility of personalization, integrations, and dedicated environment</li>
						<li><strong>HR and managers</strong> – comprehensive tool for team management</li>
					</ul>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Security and Privacy</h2>
					<p className="mb-4 text-gray-700">
						All data in <strong>Planopia</strong> is securely stored and encrypted. 
						Secure login, encrypted connections, and access control through the role system 
						ensure that only authorized persons have access to your company's data.
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">PWA and Mobile Accessibility</h2>
					<p className="mb-4 text-gray-700">
						<strong>Planopia</strong> works as a <strong>Progressive Web App (PWA)</strong>, which means 
						you can add it to your phone or tablet home screen and use it like a native mobile app. 
						All features are available on mobile devices, allowing you to work from anywhere.
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Summary</h2>
					<p className="mb-4 text-gray-700">
						<strong>Planopia</strong> is a comprehensive company management app that combines 
						<strong> time tracking</strong>, <strong>leave management</strong>, <strong>work schedules</strong>, 
						<strong> team chats</strong>, <strong> task boards</strong>, and flexible <strong>role configuration</strong>. 
						Thanks to well-thought-out role logic and configuration options, you can adapt the app to the specifics 
						of your company. Everything in one place, for your entire team.
					</p>
					<p className="mb-4 text-gray-700">
						Try <strong>Planopia</strong> for free for teams up to 4 users and see 
						how a comprehensive tool can streamline your company management.
					</p>

					<p className="mt-8 font-medium text-blue-600">
						Try Planopia – <Link href="https://app.planopia.pl/team-registration" className="underline">create a free team and start managing your company in one place</Link>.
					</p>

					{/* FAQ Section */}
					<section className="mt-12 pt-8 border-t border-gray-200">
						<h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
						<div className="space-y-6">
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Is Planopia free?</h3>
								<p className="text-gray-700">
									Yes, Planopia offers a free version for teams up to 4 users. All features are available at no cost. 
									For larger companies, paid plans are available with unlimited users, flexible features, and integrations.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Does the app enable time tracking?</h3>
								<p className="text-gray-700">
									Yes, Planopia enables time tracking according to typical requirements. The app supports the process of work hours registration, 
									overtime tracking, report generation, and data export to PDF and Excel needed for documentation. 
									<Link href="/en/blog/electronic-time-tracking" className="text-blue-600 hover:underline ml-1">Learn more about electronic time tracking</Link>.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Can I export data to Excel?</h3>
								<p className="text-gray-700">
									Yes, Planopia allows data export to PDF and Excel formats. You can export work calendars, 
									leave reports, and other data in formats suitable for further analysis or archiving.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Does the app work on mobile phones?</h3>
								<p className="text-gray-700">
									Yes, Planopia works as a Progressive Web App (PWA), which means you can add it to your phone or tablet 
									home screen and use it like a native mobile app. All features are available on mobile devices, 
									allowing you to work from anywhere.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">What features does the comprehensive Planopia app offer?</h3>
								<p className="text-gray-700">
									Planopia combines <Link href="/en#aboutapp" className="text-blue-600 hover:underline">time tracking</Link>, 
									<Link href="/en/blog/leave-planning" className="text-blue-600 hover:underline"> leave management</Link>, 
									work schedules, team chats, task boards (Kanban), and flexible role configuration. 
									Everything in one app, without the need for multiple separate tools.
								</p>
							</div>
						</div>
					</section>
				</article>
			</main>

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

