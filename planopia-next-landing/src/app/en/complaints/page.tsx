import LegalHeader from '@/components/LegalHeader'
import Link from 'next/link'

export default function ComplaintsEnPage() {
	return (
		<>
			<LegalHeader lang="en" />
			<main className="min-h-screen bg-gray-50 pt-8 pb-16 px-4 sm:px-6">
				<article
					className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 mt-8"
					style={{ marginTop: '50px' }}
				>
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900">Complaints</h1>
					<p className="mt-2 text-sm text-gray-500">
						Service provider: ML Devworks Michał Lipka, Rynek Główny 34 lok. 15, 31-010 Kraków, Poland. NIP:
						6762707876, REGON: 543372505
					</p>

					<h2 className="text-lg font-semibold text-gray-900 mt-8">1. How to submit a complaint</h2>
					<p className="mt-3 text-gray-700 leading-relaxed">
						Complaints regarding the Planopia service (including payments and access to the application) may be
						submitted <strong>by email</strong> to:{' '}
						<a href="mailto:office@ml-devworks.com" className="text-indigo-700 font-medium hover:underline">
							office@ml-devworks.com
						</a>
						. Please include “Planopia complaint” in the subject or body, describe the issue, and provide details to
						identify your account (e.g. company name / account email).
					</p>

					<h2 className="text-lg font-semibold text-gray-900 mt-8">2. Time limit for filing</h2>
					<p className="mt-3 text-gray-700 leading-relaxed">
						A complaint should be filed within a reasonable time after the circumstances arise, and in any case not
						later than <strong>14 days</strong> from the day you became aware of the grounds for the complaint, where
						applicable under consumer protection rules.
					</p>

					<h2 className="text-lg font-semibold text-gray-900 mt-8">3. Handling your complaint</h2>
					<p className="mt-3 text-gray-700 leading-relaxed">
						We will respond within <strong>14 days</strong> of receiving your complaint at the email address above.
						The reply will be sent to the email used for the complaint unless you specify otherwise.
					</p>

					<h2 className="text-lg font-semibold text-gray-900 mt-8">4. Disputes — out of court (for consumers)</h2>
					<p className="mt-3 text-gray-700 leading-relaxed">
						A <strong>consumer</strong> is, in short, a private individual buying for non-business purposes. If the issue
						cannot be settled with us by email, consumers may use <strong>free out-of-court</strong> options — e.g.{' '}
						<strong>mediation</strong> (a neutral third party helps both sides agree) or other amicable dispute
						resolution. You can also use the EU <strong>ODR platform</strong> (online dispute resolution between consumer
						and trader). Up-to-date forms, links, and guidance are published by national consumer authorities and the EU
						— check those sites for the exact steps.
					</p>

					<p className="mt-10 text-sm text-gray-500">
						Contractual details are also set out in the Planopia{' '}
						<Link href="/en/terms" className="text-indigo-700 hover:underline">
							Terms of Service
						</Link>
						.
					</p>
				</article>
			</main>
		</>
	)
}
