import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import { blogFreeAppCopy } from '@/data/blogFreeAppCopy'

function renderFaqAnswer(locale: 'pl' | 'en', index: number, answer: string) {
	if (locale === 'pl' && index === 0) {
		return (
			<>
				{answer} — zobacz{' '}
				<Link href="/#cennik" className="text-blue-600 hover:underline">
					cennik
				</Link>
				.
			</>
		)
	}
	if (locale === 'pl' && index === 1) {
		return (
			<>
				{answer} — szczegóły w{' '}
				<Link href="/#cennik" className="text-blue-600 hover:underline">
					cenniku
				</Link>
				.
			</>
		)
	}
	return answer
}

export default function BlogFreeAppArticle({ locale }: { locale: 'pl' | 'en' }) {
	const copy = blogFreeAppCopy[locale]

	return (
		<article className="px-4 py-16 bg-white">
			<div className="max-w-4xl mx-auto">
				{locale === 'pl' ? (
					<>
						{/* Introduction */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">
								Dlaczego warto wybrać aplikację do ewidencji czasu pracy z okresem próbnym?
							</h2>
							<p className="text-lg text-gray-700 mb-4">
								Ewidencja czasu pracy to obowiązek każdej firmy, ale tradycyjne metody często są nieefektywne i
								czasochłonne. Excel, papierowe listy obecności czy podstawowe systemy HR generują błędy i pochłaniają
								cenne godziny pracy.
							</p>
							<p className="text-lg text-gray-700 mb-6">
								<strong>Planopia</strong> rozwiązuje te problemy w modelu jasnym:{' '}
								<strong>30 dni za darmo</strong> dla do 5 użytkowników, pełne funkcje, bez karty płatniczej w okresie
								próbnym.
							</p>
						</div>

						{/* What is Planopia */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">
								Czym jest Planopia — aplikacja do ewidencji czasu pracy i urlopów?
							</h2>
							<p className="text-lg text-gray-700 mb-4">
								Planopia to nowoczesna <strong>aplikacja do ewidencji czasu pracy i urlopów</strong>, zaprojektowana z
								myślą o małych i średnich firmach. Aplikacja działa w przeglądarce internetowej, więc nie wymaga
								instalacji oprogramowania na komputerach pracowników.
							</p>
							<p className="text-lg text-gray-700 mb-4">
								Chcesz zobaczyć gotowe rozwiązanie? Sprawdź dedykowany{' '}
								<Link
									href="/program-do-ewidencji-czasu-pracy"
									className="text-blue-700 underline-offset-2 hover:underline font-medium">
									program do ewidencji czasu pracy
								</Link>{' '}
								albo pogłębione przewodniki:{' '}
								<Link
									href="/blog/ewidencja-czasu-pracy-online"
									className="text-blue-700 underline-offset-2 hover:underline font-medium">
									ewidencja czasu pracy online
								</Link>{' '}
								oraz{' '}
								<Link
									href="/blog/elektroniczna-ewidencja-czasu-pracy"
									className="text-blue-700 underline-offset-2 hover:underline font-medium">
									elektroniczna ewidencja — Excel czy program
								</Link>
								.
							</p>
							<div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
								<p className="text-lg text-blue-800 font-semibold">
									✅ Pierwszy miesiąc za darmo — do 5 użytkowników, pełna funkcjonalność
								</p>
								<p className="text-blue-700 mt-2">
									30 dni pełnego dostępu bez karty — potem darmowa ewidencja lub plan w{' '}
									<Link href="/#cennik" className="underline font-medium">
										cenniku
									</Link>
									.
								</p>
							</div>
						</div>

						{/* Features */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">
								Funkcje darmowej aplikacji do ewidencji czasu pracy
							</h2>
							<div className="grid md:grid-cols-2 gap-6">
								<div className="bg-gray-50 p-6 rounded-lg">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Ewidencja czasu pracy</h3>
									<ul className="text-gray-700 space-y-2">
										<li>• Rejestracja godzin pracy w czasie rzeczywistym</li>
										<li>• Automatyczne obliczanie nadgodzin</li>
										<li>• Kalendarz pracy z wizualizacją</li>
										<li>• Eksport danych do PDF i Excel</li>
									</ul>
								</div>
								<div className="bg-gray-50 p-6 rounded-lg">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">🏖️ Zarządzanie urlopami</h3>
									<ul className="text-gray-700 space-y-2">
										<li>• Wnioski urlopowe online</li>
										<li>• System akceptacji przez przełożonych</li>
										<li>• Kalendarz urlopów zespołu</li>
										<li>• Powiadomienia email</li>
									</ul>
								</div>
								<div className="bg-gray-50 p-6 rounded-lg">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">📱 Dostępność</h3>
									<ul className="text-gray-700 space-y-2">
										<li>• Aplikacja PWA (Progressive Web App)</li>
										<li>• Działanie na wszystkich urządzeniach</li>
										<li>• Synchronizacja w czasie rzeczywistym</li>
									</ul>
								</div>
								<div className="bg-gray-50 p-6 rounded-lg">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">🔒 Bezpieczeństwo</h3>
									<ul className="text-gray-700 space-y-2">
										<li>• Szyfrowane połączenia SSL</li>
										<li>• Bezpieczne logowanie</li>
										<li>• Regularne kopie zapasowe</li>
										<li>• Zgodność z RODO</li>
									</ul>
								</div>
							</div>
						</div>

						{/* Comparison */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">
								Dlaczego Planopia to najlepsza darmowa aplikacja do ewidencji czasu pracy?
							</h2>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse border border-gray-300">
									<thead>
										<tr className="bg-gray-100">
											<th className="border border-gray-300 p-4 text-left">Funkcja</th>
											<th className="border border-gray-300 p-4 text-center">
												Planopia (próba + darmowy plan ewidencji)
											</th>
											<th className="border border-gray-300 p-4 text-center">Konkurencja</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">Ewidencja czasu pracy</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">
												✅ Pełna funkcjonalność
											</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Ograniczona</td>
										</tr>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">Zarządzanie urlopami</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">✅ Kompletny system</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Brak lub płatne</td>
										</tr>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">Raporty PDF</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">✅ Bez ograniczeń</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Ograniczone</td>
										</tr>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">Wsparcie techniczne</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">✅ Email + chat</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Tylko płatne</td>
										</tr>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">Aktualizacje</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">✅ Regularne</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Rzadkie</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* How to start */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">
								Jak zacząć korzystać z Planopii (próba i darmowa ewidencja)?
							</h2>
							<div className="grid md:grid-cols-3 gap-6">
								<div className="text-center p-6 bg-green-50 rounded-lg">
									<div className="text-4xl font-bold text-green-600 mb-2">1</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Załóż darmowy zespół</h3>
									<p className="text-gray-700">
										Kliknij &quot;Załóż darmowy zespół&quot; i wypełnij podstawowe informacje o firmie.
									</p>
								</div>
								<div className="text-center p-6 bg-blue-50 rounded-lg">
									<div className="text-4xl font-bold text-blue-600 mb-2">2</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Dodaj pracowników</h3>
									<p className="text-gray-700">Zaproś członków zespołu i przydziel im odpowiednie uprawnienia.</p>
								</div>
								<div className="text-center p-6 bg-purple-50 rounded-lg">
									<div className="text-4xl font-bold text-purple-600 mb-2">3</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Zacznij pracę</h3>
									<p className="text-gray-700">Rozpocznij ewidencję czasu pracy i zarządzanie urlopami już dziś!</p>
								</div>
							</div>
						</div>
					</>
				) : (
					<>
						{/* Introduction */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">
								Why choose a time tracking app with a free trial?
							</h2>
							<p className="text-lg text-gray-700 mb-4">
								Time tracking is an obligation for every company, but traditional methods are often inefficient and
								time-consuming. Excel, paper attendance sheets, or basic HR systems generate errors and consume valuable
								work hours.
							</p>
							<p className="text-lg text-gray-700 mb-6">
								<strong>Planopia</strong> solves these problems with a clear model: <strong>30 days</strong> full product
								for up to 5 users, then <strong>free time tracking</strong> for up to 5 active accounts or paid plans.
							</p>
						</div>

						{/* What is Planopia */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">What is Planopia?</h2>
							<p className="text-lg text-gray-700 mb-4">
								Planopia is a modern <strong>time tracking and leave management app</strong>, designed for small and
								medium-sized companies. It runs in a web browser — no software installation on employee computers.
							</p>
							<div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
								<p className="text-lg text-blue-800 font-semibold">
									✅ 30 days full product — then free time tracking for up to 5 active accounts
								</p>
								<p className="text-blue-700 mt-2">
									No credit card during the trial. After 30 days, free time tracking or a paid plan on the{' '}
									<Link href="/en#prices" className="underline font-medium">
										pricing page
									</Link>
									.
								</p>
							</div>
						</div>

						{/* Features */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">Free time tracking app features</h2>
							<div className="grid md:grid-cols-2 gap-6">
								<div className="bg-gray-50 p-6 rounded-lg">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Work Hours Tracking</h3>
									<ul className="text-gray-700 space-y-2">
										<li>• Real-time work hours registration</li>
										<li>• Automatic overtime calculations</li>
										<li>• Work calendar with visualization</li>
										<li>• Data export to PDF and Excel</li>
									</ul>
								</div>
								<div className="bg-gray-50 p-6 rounded-lg">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">🏖️ Leave Management</h3>
									<ul className="text-gray-700 space-y-2">
										<li>• Online leave requests</li>
										<li>• Supervisor approval system</li>
										<li>• Team leave calendar</li>
										<li>• Email notifications</li>
									</ul>
								</div>
								<div className="bg-gray-50 p-6 rounded-lg">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">📱 Accessibility</h3>
									<ul className="text-gray-700 space-y-2">
										<li>• PWA (Progressive Web App)</li>
										<li>• Works on all devices</li>
										<li>• Real-time synchronization</li>
									</ul>
								</div>
								<div className="bg-gray-50 p-6 rounded-lg">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">🔒 Security</h3>
									<ul className="text-gray-700 space-y-2">
										<li>• SSL encrypted connections</li>
										<li>• Secure login</li>
										<li>• Regular backups</li>
										<li>• GDPR compliance</li>
									</ul>
								</div>
							</div>
						</div>

						{/* Comparison */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">
								Why Planopia is the best free time tracking app?
							</h2>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse border border-gray-300">
									<thead>
										<tr className="bg-gray-100">
											<th className="border border-gray-300 p-4 text-left">Feature</th>
											<th className="border border-gray-300 p-4 text-center">Planopia (trial + free tier)</th>
											<th className="border border-gray-300 p-4 text-center">Competition</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">Work Hours Tracking</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">✅ Full functionality</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Limited</td>
										</tr>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">Leave Management</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">✅ Complete system</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Missing or paid</td>
										</tr>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">PDF Reports</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">✅ Unlimited</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Limited</td>
										</tr>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">Technical Support</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">✅ Email + chat</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Paid only</td>
										</tr>
										<tr>
											<td className="border border-gray-300 p-4 font-semibold">Updates</td>
											<td className="border border-gray-300 p-4 text-center text-green-600">✅ Regular</td>
											<td className="border border-gray-300 p-4 text-center text-red-600">❌ Rare</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* How to start */}
						<div className="mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">How to get started with Planopia (30-day trial)?</h2>
							<div className="grid md:grid-cols-3 gap-6">
								<div className="text-center p-6 bg-green-50 rounded-lg">
									<div className="text-4xl font-bold text-green-600 mb-2">1</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Create your free team</h3>
									<p className="text-gray-700">
										Click &quot;Create your free team&quot; and fill in basic company information.
									</p>
								</div>
								<div className="text-center p-6 bg-blue-50 rounded-lg">
									<div className="text-4xl font-bold text-blue-600 mb-2">2</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Add Employees</h3>
									<p className="text-gray-700">Invite team members and assign them appropriate permissions.</p>
								</div>
								<div className="text-center p-6 bg-purple-50 rounded-lg">
									<div className="text-4xl font-bold text-purple-600 mb-2">3</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Start Working</h3>
									<p className="text-gray-700">Begin time tracking and leave management today!</p>
								</div>
							</div>
						</div>
					</>
				)}

				{/* FAQ */}
				<div className="mb-12">
					<h2 className="text-3xl font-bold text-gray-900 mb-6">
						{locale === 'pl'
							? 'Często zadawane pytania o darmową aplikację do ewidencji czasu pracy'
							: 'Frequently asked questions about free time tracking app'}
					</h2>
					<div className="space-y-6">
						{copy.faqs.map((faq, index) => (
							<div key={faq.q} className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">{faq.q}</h3>
								<p className="text-gray-700">{renderFaqAnswer(locale, index, faq.a)}</p>
							</div>
						))}
					</div>
				</div>

				{/* CTA */}
				<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-5 sm:p-8 rounded-2xl shadow-sm">
					<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 justify-center leading-snug">
						{locale === 'pl'
							? 'Gotowy na darmową aplikację do ewidencji czasu pracy?'
							: 'Ready for a free time tracking app?'}
					</h2>
					<p className="text-sm sm:text-base md:text-lg text-gray-700 mb-5 sm:mb-6 max-w-2xl mx-auto leading-snug sm:leading-relaxed">
						{locale === 'pl'
							? 'Rozpocznij zarządzanie urlopami już dziś i uporządkuj planowanie w Twojej firmie!'
							: 'Start managing leave today and streamline planning in your company!'}
					</p>
					<Link
						href="https://app.planopia.pl/team-registration"
						className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-sm sm:text-base md:text-lg white-text-btn">
						{copy.cta}
					</Link>
				</div>

				<BlogRelatedLinks
					slug={copy.slug}
					{...(locale === 'en' ? { locale: 'en' as const } : {})}
					className="mt-10"
				/>
			</div>
		</article>
	)
}
