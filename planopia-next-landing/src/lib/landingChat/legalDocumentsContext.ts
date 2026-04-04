import fs from 'fs'
import path from 'path'

/**
 * Treść stron reklamacji (nie ma osobnych plików .md — utrzymuj zgodnie z app/reklamacje i en/complaints).
 */
const COMPLAINTS_PL = `
# Reklamacje (skrót treści ze strony planopia.pl/reklamacje)

Usługodawca: ML Devworks Michał Lipka, Rynek Główny 34 lok. 15, 31-010 Kraków, NIP: 6762707876, REGON: 543372505.

## 1. Złożenie reklamacji
Reklamacje dotyczące świadczenia usługi Planopia (w tym płatności i dostępu do aplikacji) można złożyć drogą elektroniczną, wysyłając wiadomość na adres: office@ml-devworks.com. W tytule lub treści prosimy o dopisek „Reklamacja Planopia” oraz opis przedmiotu reklamacji i dane pozwalające zidentyfikować konto (np. nazwa firmy / adres e-mail konta).

## 2. Termin na złożenie reklamacji
Reklamację należy złożyć w rozsądnym terminie po stwierdzeniu okoliczności stanowiących jej podstawę, nie później niż w ciągu 14 dni od dnia, w którym konsument lub Klient dowiedział się o przyczynie reklamacji (w sprawach objętych przepisami o konsumentach — zgodnie z obowiązującymi przepisami, w szczególności ustawą o prawach konsumenta).

## 3. Rozpatrzenie reklamacji
Reklamacja zostanie rozpatrzona w terminie 14 dni od daty jej otrzymania (wpływu żądania na wskazany adres e-mail). Odpowiedź zostanie przekazana na adres e-mail, z którego przesłano reklamację, chyba że zgłaszający wskaże inny sposób kontaktu.

## 4. Spory — poza sądem (dla konsumentów)
Konsument to m.in. osoba kupująca jako osoba prywatna (nie na potrzeby firmy). Jeśli nie uda się wyjaśnić sprawy z nami mailowo, konsument może skorzystać z darmowych procedur poza sądem — np. mediacji lub innych form polubownego załatwienia sporu. Można też użyć unijnej platformy ODR. Aktualne adresy, formularze i instrukcje publikuje UOKiK oraz strony Unii Europejskiej.

Szczegóły umowne znajdują się także w Regulaminie świadczenia usługi Planopia.pl (/terms).
`.trim()

const COMPLAINTS_EN = `
# Complaints (summary from planopia.pl/en/complaints)

Service provider: ML Devworks Michał Lipka, Rynek Główny 34 lok. 15, 31-010 Kraków, Poland. NIP: 6762707876, REGON: 543372505.

## 1. How to submit a complaint
Complaints regarding the Planopia service (including payments and access to the application) may be submitted by email to: office@ml-devworks.com. Please include "Planopia complaint" in the subject or body, describe the issue, and provide details to identify your account (e.g. company name / account email).

## 2. Time limit for filing
A complaint should be filed within a reasonable time after the circumstances arise, and in any case not later than 14 days from the day you became aware of the grounds for the complaint, where applicable under consumer protection rules.

## 3. Handling your complaint
We will respond within 14 days of receiving your complaint at the email address above. The reply will be sent to the email used for the complaint unless you specify otherwise.

## 4. Disputes — out of court (for consumers)
A consumer is, in short, a private individual buying for non-business purposes. If the issue cannot be settled with us by email, consumers may use free out-of-court options — e.g. mediation or other amicable dispute resolution. You can also use the EU ODR platform. Up-to-date forms, links, and guidance are published by national consumer authorities and the EU.

Contractual details are also set out in the Planopia Terms of Service (/en/terms).
`.trim()

const OWNER_PL = `
## Właściciel usługi i historia produktu
- **Usługodawca** (właściciel marki i świadczenia usługi Planopia.pl): **ML Devworks Michał Lipka**, Rynek Główny 34 lok. 15, 31-010 Kraków, NIP: 6762707876, REGON: 543372505.
- Aplikacja Planopia **powstała i została udostępniona jako produkt SaaS w 2025 roku** (publiczna oferta usługi).
- Oficjalne dokumenty prawne (pełny tekst): Regulamin — /terms; Polityka prywatności — /privacy; DPA — /dpa; reklamacje — /reklamacje (PL) lub /en/complaints (EN).
`.trim()

const OWNER_EN = `
## Service provider and product history
- **Service provider** (owner of the Planopia.pl brand and service): **ML Devworks Michał Lipka**, Rynek Główny 34 lok. 15, 31-010 Kraków, Poland. NIP: 6762707876, REGON: 543372505.
- The Planopia application **was created and launched as a SaaS product in 2025** (public availability).
- Official legal documents (full text): Terms — /en/terms; Privacy — /en/privacy; DPA — /en/dpa; complaints — /en/complaints.
`.trim()

function readMdSafe(filePath: string): string | null {
	try {
		return fs.readFileSync(filePath, 'utf-8')
	} catch {
		return null
	}
}

let cachedPl: string | null = null
let cachedEn: string | null = null

/**
 * Pełna treść regulaminów (markdown z repozytorium) + reklamacje + fakty o podmiocie.
 * Wywoływane wyłącznie po stronie serwera (API route).
 */
export function buildLegalDocumentsContext(locale: 'pl' | 'en'): string {
	if (locale === 'pl' && cachedPl) return cachedPl
	if (locale === 'en' && cachedEn) return cachedEn

	const dir = path.join(process.cwd(), 'legal-documents')
	const termsFile = locale === 'pl' ? 'TERMS.md' : 'TERMS_EN.md'
	const privacyFile = locale === 'pl' ? 'PRIVACY.md' : 'PRIVACY_EN.md'
	const dpaFile = locale === 'pl' ? 'DPA.md' : 'DPA_EN.md'

	const terms = readMdSafe(path.join(dir, termsFile)) ?? `[Brak pliku ${termsFile} w środowisku serwera.]`
	const privacy = readMdSafe(path.join(dir, privacyFile)) ?? `[Brak pliku ${privacyFile}]`
	const dpa = readMdSafe(path.join(dir, dpaFile)) ?? `[Brak pliku ${dpaFile}]`
	const complaints = locale === 'pl' ? COMPLAINTS_PL : COMPLAINTS_EN
	const owner = locale === 'pl' ? OWNER_PL : OWNER_EN

	const header =
		locale === 'pl'
			? '### KONTEKST PRAWNY (źródło: pliki legal-documents + strona reklamacji)\nTreść poniżej odpowiada publikacji na planopia.pl. W razie jakichkolwiek wątpliwości lub zmian wersji dokumentów, obowiązują strony /terms, /privacy, /dpa, /reklamacje.'
			: '### LEGAL CONTEXT (source: legal-documents markdown + complaints page)\nThe text below matches planopia.pl. If versions differ, the live pages /en/terms, /en/privacy, /en/dpa, /en/complaints prevail.'

	const bundle = [
		header,
		'',
		owner,
		'',
		'---',
		'',
		locale === 'pl' ? '### Regulamin (TERMS.md)' : '### Terms of Service (TERMS_EN.md)',
		terms,
		'',
		'---',
		'',
		locale === 'pl' ? '### Polityka prywatności (PRIVACY.md)' : '### Privacy Policy (PRIVACY_EN.md)',
		privacy,
		'',
		'---',
		'',
		locale === 'pl' ? '### Umowa DPA (DPA.md)' : '### Data Processing Agreement (DPA_EN.md)',
		dpa,
		'',
		'---',
		'',
		locale === 'pl' ? '### Reklamacje' : '### Complaints',
		complaints,
	].join('\n')

	if (locale === 'pl') cachedPl = bundle
	else cachedEn = bundle

	return bundle
}
