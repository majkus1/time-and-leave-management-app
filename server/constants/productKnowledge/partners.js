// Źródło: utils/referralCode.js, client/src/utils/referral.js + landing lib/referral.ts (cookie planopia_ref),
// services/partnerService.js, services/commissionService.js + utils/commissionCalc.js, services/partnerPortalService.js,
// client/src/components/partner/PartnerPanel.jsx.
module.exports = {
	id: 'partners',
	order: 10,
	title: { pl: 'Program partnerski', en: 'Partner program' },
	summary: {
		pl: 'Biura rachunkowe, kadrowe i doradcy polecają Planopię swoim linkiem i dostają prowizję od płatności poleconych firm; panel partnera z linkiem, firmami i prowizjami.',
		en: 'Accounting/HR offices and advisers recommend Planopia with their own link and earn a commission on payments of referred companies; partner panel with link, companies and commissions.',
	},
	keywords: {
		pl: ['partner', 'program partnerski', 'polecen', 'polecaj', 'prowizj', 'link ref', '?ref', 'afiliac', 'wypłat', 'zestawienie prowizji'],
		en: ['partner', 'partner program', 'referral', 'refer', 'commission', 'ref link', 'affiliate', 'payout'],
	},
	requires: { modules: [], bundles: [], trial: true, freemium: true },
	suggestedQuestions: {
		pl: ['Jak działa program partnerski Planopii?', 'Kiedy naliczana jest prowizja partnera?', 'Gdzie partner widzi swoje prowizje?'],
		en: ['How does the Planopia partner program work?', 'When is a partner commission accrued?', 'Where does a partner see their commissions?'],
	},
	body: {
		pl: `### Jak to działa
- Partnera (np. biuro rachunkowe) zakłada Planopia — warunki ustalamy indywidualnie: procent prowizji i okres (np. 12 miesięcy od pierwszej płatności poleconej firmy albo bez limitu). Chęć współpracy: biuro@planopia.pl.
- Partner dostaje link planopia.pl/?ref=KOD. Kto wejdzie z tego linku i w ciągu 90 dni założy zespół, zostaje przypisany do partnera (liczy się pierwsze polecenie; zapamiętuje to funkcjonalne cookie z samym kodem partnera). Planopia może też przypisać firmę ręcznie.
- Prowizja naliczana jest od kwot netto płatności poleconej firmy za plany: kartą, przez Przelewy24 albo z faktury. Okres prowizji liczy się od pierwszej płatności firmy (czas na okresie próbnym albo planie darmowym go nie skraca); gdy firma przestaje płacić, prowizji nie ma. Zwrot płatności cofa prowizję proporcjonalnie.
- Bez prowizji: płatności sprzed polecenia, po okresie prowizji (liczonym od pierwszej płatności), gdy partner jest wstrzymany, płatności testowe i polecenie samego siebie (ta sama firma, e-mail albo NIP).
- Rozliczenie: Planopia zamyka miesiąc → prowizje przechodzą do „do wypłaty” → partner wystawia fakturę na tę kwotę → Planopia oznacza wypłatę.

### Panel partnera
- Menu → „Program partnerski” (Administrator i HR zespołu partnera): link do skopiowania i warunki, kwoty do wypłaty / naliczone / wypłacone, prowizje w miesiącach z listą płatności, polecone firmy (stan planu, od kiedy, do kiedy prowizja — przed pierwszą płatnością „N mies. od 1. płatności”), eksport do Excela i zestawienie miesiąca w PDF do faktury.
- Panel działa niezależnie od planu zespołu partnera.

### Czego NIE robi
- Nie da się samodzielnie zarejestrować jako partner — partnera zakłada Planopia.
- Nie wypłaca prowizji automatycznie (wypłata po fakturze partnera).
- Link polecający nie daje firmie rabatu ani innej ceny.
- Partner nie widzi danych pracowników poleconych firm ani identyfikatorów płatności.
- Udostępnienie danych biuru rachunkowemu nie robi z firmy „poleconej” przez to biuro.

### Gdzie w aplikacji / kto może
Panel: menu → Program partnerski (Administrator/HR zespołu partnera). Ustawienia partnera, stawki i rozliczenia prowadzi Planopia.`,
		en: null,
	},
}
