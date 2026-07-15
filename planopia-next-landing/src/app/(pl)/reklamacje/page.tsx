import LegalHeader from '@/components/LegalHeader'
import Link from 'next/link'

export default function ReklamacjePage() {
	return (
		<>
			<LegalHeader lang="pl" />
			<main className="min-h-screen bg-gray-50 pt-8 pb-16 px-4 sm:px-6">
				<article
					className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 mt-8"
					style={{ marginTop: '50px' }}
				>
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reklamacje</h1>
					<p className="mt-2 text-sm text-gray-500">
						Usługodawca: ML Devworks Michał Lipka, Rynek Główny 34 lok. 15, 31-010 Kraków, NIP: 6762707876,
						REGON: 543372505
					</p>

					<h2 className="text-lg font-semibold text-gray-900 mt-8">1. Złożenie reklamacji</h2>
					<p className="mt-3 text-gray-700 leading-relaxed">
						Reklamacje dotyczące świadczenia usługi Planopia (w tym płatności i dostępu do aplikacji) można złożyć
						<strong> drogą elektroniczną</strong>, wysyłając wiadomość na adres:{' '}
						<a href="mailto:biuro@planopia.pl" className="text-indigo-700 font-medium hover:underline">
							biuro@planopia.pl
						</a>
						. W tytule lub treści prosimy o dopisek „Reklamacja Planopia” oraz opis przedmiotu reklamacji i dane
						pozwalające zidentyfikować konto (np. nazwa firmy / adres e-mail konta).
					</p>

					<h2 className="text-lg font-semibold text-gray-900 mt-8">2. Termin na złożenie reklamacji</h2>
					<p className="mt-3 text-gray-700 leading-relaxed">
						Reklamację należy złożyć w rozsądnym terminie po stwierdzeniu okolicności stanowiących jej podstawę, nie
						później niż w ciągu <strong>14 dni</strong> od dnia, w którym konsument lub Klient dowiedział się o
						przyczynie reklamacji (w sprawach objętych przepisami o konsumentach — zgodnie z obowiązującymi
						przepisami, w szczególności ustawą o prawach konsumenta).
					</p>

					<h2 className="text-lg font-semibold text-gray-900 mt-8">3. Rozpatrzenie reklamacji</h2>
					<p className="mt-3 text-gray-700 leading-relaxed">
						Reklamacja zostanie rozpatrzona <strong>w terminie 14 dni</strong> od daty jej otrzymania (wpływu
						żądania na wskazany adres e-mail). Odpowiedź zostanie przekazana na adres e-mail, z którego przesłano
						reklamację, chyba że zgłaszający wskaże inny sposób kontaktu.
					</p>

					<h2 className="text-lg font-semibold text-gray-900 mt-8">4. Spory — poza sądem (dla konsumentów)</h2>
					<p className="mt-3 text-gray-700 leading-relaxed">
						<strong>Konsument</strong> to m.in. osoba kupująca jako osoba prywatna (nie na potrzeby firmy). Jeśli nie
						uda się wyjaśnić sprawy z nami mailowo, konsument może skorzystać z <strong>darmowych</strong> procedur{' '}
						<strong>poza sądem</strong> — np. <strong>mediacji</strong> (rozmowa z pośrednikiem) lub innych form
						polubownego załatwienia sporu. Można też użyć unijnej <strong>platformy ODR</strong> (internetowe
						zgłaszanie sporów między konsumentem a sprzedawcą). Aktualne adresy, formularze i instrukcje publikuje{' '}
						<strong>UOKiK</strong> oraz strony Unii Europejskiej — tam warto zajrzeć po konkretne kroki i linki.
					</p>

					<p className="mt-10 text-sm text-gray-500">
						Szczegóły umowne znajdują się także w{' '}
						<Link href="/terms" className="text-indigo-700 hover:underline">
							Regulaminie
						</Link>{' '}
						świadczenia usługi Planopia.pl.
					</p>
				</article>
			</main>
		</>
	)
}
