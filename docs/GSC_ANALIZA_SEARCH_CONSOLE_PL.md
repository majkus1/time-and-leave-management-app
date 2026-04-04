# Analiza Google Search Console (PL, 3 miesiące) + kod `planopia-next-landing`

Dokument roboczy: dane ze screenów (styczeń–marzec 2026), przegląd metadanych i struktury Next.js.

---

## 1. Sygnały z GSC (agregat)

| Metryka (okres z wykresu) | Wartość | Interpretacja |
|---------------------------|---------|----------------|
| Kliknięcia | ~459 | Głównie brand + jeden silny wpis blogowy |
| Wyświetlenia | ~15,3 tys. | Rosnące w czasie — indeksacja i obecność na długim ogonie |
| Średni CTR | ~3% | Typowe przy **średniej pozycji ~20** (druga strona wyników i niżej) |
| Średnia pozycja | ~20,2 | Większość fraz poza pierwszą „dziesiątką” — stąd **0 klików przy setkach impressions** na wiele zapytań |

**Wniosek:** To nie jest wyłącznie problem „złego meta description”. Przy pozycji 11–30 CTR naturalnie jest bliski zeru; meta poprawia CTR głównie gdy URL jest już **widoczny w pierwszej dziesiątce**.

---

## 2. Co już działa

- **Brand:** zapytanie `planopia` dominuje kliknięcia — dobra rozpoznawalność nazwy.
- **Jeden artykuł ciągnie ruch:** `/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy` — wysokie kliknięcia względem reszty; intencja „darmowa aplikacja / ewidencja” jest dobrze dopasowana do produktu i tytułu strony.
- **Kod techniczny (Next.js):** `metadata` per `layout.tsx`, canonical + `alternates.languages`, `robots.ts`, `sitemap.ts`, `metadataBase` w root, JSON-LD (`Blog`, `BlogPosting` w komponentach) — **baza pod SEO jest poprawna**; wcześniejsze poprawki weryfikacji Google w layoutach bloga były konieczne pod GSC.

---

## 3. Wzorzec problemu: wysokie wyświetlenia, 0 klików

Z screenów wynika wiele fraz z setkami impressions i **0 klików**, m.in.:

- elektroniczna ewidencja czasu pracy  
- program do urlopów / zarządzanie urlopami  
- program do ewidencji czasu pracy / ewidencja czasu pracy online  
- program do zarządzania firmą / aplikacja do zarządzania firmą  

**Mechanizm:** Google pokazuje snippet (często pozycja 11+), użytkownik nie klika — albo wybiera konkurentów z pozycji 1–5, albo intencja (np. sam Excel, sam darmowy szablon) nie pasuje do tytułu/opisu.

**Mapowanie na istniejące URL (macie już treści blisko intencji):**

| Zapytanie (skrót) | Pasujący istniejący URL | Uwaga |
|-------------------|-------------------------|--------|
| elektroniczna ewidencja… | `/blog/elektroniczna-ewidencja-czasu-pracy` | Wysokie impressions w GSC, niskie kliki — **priorytet optymalizacji** |
| zarządzanie urlopami / program do urlopów | `/blog/zarzadzanie-urlopami` | To samo |
| ewidencja czasu pracy online | `/blog/ewidencja-czasu-pracy-online` | Duże impressions, 0 klików w GSC — **CTR + pozycja** |
| planowanie urlopów / kalendarz | `/blog/planowanie-urlopow` | Wysokie impressions, mało klików |
| program/aplikacja do zarządzania firmą | `/blog/kompleksowa-aplikacja-do-zarzadzania-firma` | Zgodność tematyczna |

Nie trzeba od zera „wymyślać” nowych URL — **najpierw wzmocnić te strony** (nagłówki H2/H3 pod frazy z GSC, wewnętrzne linki z homepage i z innych wpisów, ewentualnie dopracowanie title/description pod dokładne frazy).

---

## 4. Błędy / ryzyka (produkt + SEO)

- **Średnia pozycja ~20:** bez wzmocnienia treści + linków wewnętrznych meta samo nie przeniesie fraz na stronę 1.
- **Powtarzalny suffix w meta** (`blogArticleOfferLine` — trial 30 dni itd.) jest spójny prawnie, ale **skraca miejsce na unikalny USP w description**; warto w opisach dla najważniejszych URL **pierwsze zdanie** poświęcić na frazę i korzyść, dopiero potem model cenowy.
- **Angielska wersja:** niski ruch vs PL — normalne przy `hreflang` i focusie na PL; nie jest to błąd kodu, tylko kwestia priorytetu treści i linkowania.

---

## 5. Szanse — istniejące wpisy (konkretne działania)

1. **`elektroniczna-ewidencja-czasu-pracy`**  
   - Dopasować **title** (np. obecność frazy „elektroniczna ewidencja czasu pracy” na początku — już jest, sprawdzić długość i konkurencję w SERP).  
   - W treści: krótka sekcja „program vs Excel”, „wymagania prawne” w kontekście ewidencji — pod zapytania typu „program”, „elektroniczna”.  
   - Link z homepage i z wpisu o darmowej aplikacji.

2. **`zarzadzanie-urlopami` + `planowanie-urlopow`**  
   - Frazy: „program do urlopów”, „aplikacja do planowania urlopów”, „roczny plan urlopów excel” — dodać **FAQ** lub akapit + schema FAQ (jeśli jeszcze nie ma) pod realne pytania z GSC.  
   - Wewnętrznie linkować z `/blog/dni-wolne-2026` (kalendarz).

3. **`ewidencja-czasu-pracy-online`**  
   - W opisie i pierwszym akapicie explicite: „online”, „aplikacja”, „bez Excela” — zgodnie z zapytaniami z GSC.  
   - Porównanie „system / aplikacja / program” w jednym miejscu (słowniczek synonimów dla SEO).

4. **`kompleksowa-aplikacja-do-zarzadzania-firma`**  
   - Pod frazy „program do zarządzania firmą”, „system do zarządzania firmą” — ujednolicić słownictwo w H2.

5. **Strona główna**  
   - Już ma silne H1 (`planOfferingCopy.heroH1`) i meta — opcjonalnie w sekcjach landingowych **kotwice** z anchorami typu „ewidencja czasu pracy online” prowadzące do bloga (nie tylko „Blog” w menu).

---

## 6. Propozycje **nowych** wpisów (z fraz z GSC — luki treści)

| Temat (PL) | Uzasadnienie (dane) |
|------------|---------------------|
| Roczny plan urlopów **Excel / PDF** (np. 2026) + jak przenieść do aplikacji | Zapytania z „excel”, „pdf”, „roczny plan” — obecnie konkurencja to szablony; możecie złapać ruch edukacyjny i skierować do Planopii. |
| **Program do wniosków urlopowych** — co powinien umieć (checklista) | Pojawia się w zapytaniach; mało treści = szansa na featured snippet / FAQ. |
| Ewidencja czasu pracy **Excel vs program** (tabela decyzyjna) | Frazy „excel”, „darmowy program” — intencja informacyjna + przejście na trial. |
| **Nadgodziny** — ewidencja i rozliczenia (oprogramowanie) | Zapytanie typu „oprogramowanie do ewidencji nadgodzin”. |
| **Kadry i urlopy** — program kadrowy dla małej firmy | „program kadrowy urlopy” + synonimy. |

Nowe wpisy mają sens **dopiero** gdy są powiązane linkowaniem wewnętrznym z istniejącymi filarami (darmowa ewidencja, elektroniczna ewidencja, zarządzanie urlopami).

---

## 7. Kod — podsumowanie dla developera

- **App Router:** `layout.tsx` z `export const metadata` — OK dla Google; artykuły mają osobne metadane.  
- **`planOfferingCopy` + `blogArticleOfferLine`:** jedna prawda o produkcie — dobrze na spójność; dla SEO rozważyć **krótszy wariant** `description` na najtrudniejsze URL albo drugie zdanie generowane per wpis.  
- **`Blog.tsx`:** JSON-LD `Blog` — OK; lista wpisów na `/blog` może mieć **semantic HTML** (lista `<article>` z linkami — jeśli już jest, sprawdzić w jednym PR).  
- **Priorytet inżynierski:** nie dodawać kolejnych identycznych meta-szablonów bez testu w GSC (URL Inspection + „View crawled page”).

---

## 8. Czy można wdrażać na produkcję?

**Tak** — technicznie wdrożenie jest spójne z dobrymi praktykami Next.js i SEO on-page. **Wzrost kliknięć z organicznych** przy obecnej średniej pozycji ~20 wymaga głównie **treści + wewnętrznego linkowania + ewentualnej przebudowy title/description pod konkretne frazy z tej tabeli**, a nie tylko kolejnych poprawek w kodzie szablonu.

---

*Dokument: analiza GSC (screeny) + przegląd `planopia-next-landing` (metadata, dane centralne, blog).*
