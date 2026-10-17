/**
 * IndexNow — powiadamia Bing (i inne wyszukiwarki z IndexNow: Yandex, Seznam, Naver) o adresach z sitemapy.
 * Bing zasila wyszukiwanie ChatGPT i Copilota, a sam odwiedza mało znane domeny rzadko — bez tego nowe i zmienione
 * strony czekają tygodniami. Uruchamiaj PO `vercel --prod`, bo plik z kluczem musi już być na produkcji.
 *
 *   npm run indexnow                         wszystkie adresy z sitemapy
 *   npm run indexnow -- --since 2026-10-17   tylko adresy z lastmod od tej daty
 *   npm run indexnow -- --dry-run            pokaż, co zostałoby wysłane
 *
 * Klucz jest publiczny z założenia (leży w public/<klucz>.txt) — to nie jest sekret.
 */

const HOST = 'planopia.pl'
const KEY = '4cccbaa1d6aac41d5cd02b0b290900a6'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/indexnow'

function argument(name) {
	const i = process.argv.indexOf(name)
	return i !== -1 ? process.argv[i + 1] : undefined
}

async function main() {
	const since = argument('--since')
	const dryRun = process.argv.includes('--dry-run')

	// Bez klucza na produkcji API odpowie 403 — sprawdzamy wcześniej, żeby błąd był zrozumiały
	const keyResponse = await fetch(KEY_LOCATION)
	const keyBody = keyResponse.ok ? (await keyResponse.text()).trim() : ''
	if (keyBody !== KEY) {
		throw new Error(`Plik klucza ${KEY_LOCATION} nie zwraca klucza (HTTP ${keyResponse.status}). Najpierw wdróż landing: vercel --prod`)
	}

	const sitemap = await fetch(`https://${HOST}/sitemap.xml`).then(r => r.text())
	const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => ({
		loc: (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1],
		lastmod: (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || '',
	}))
	const urls = entries.filter(e => e.loc && (!since || e.lastmod.slice(0, 10) >= since)).map(e => e.loc)
	if (urls.length === 0) {
		console.log(since ? `Brak adresów z lastmod od ${since}.` : 'Sitemapa nie zawiera adresów.')
		return
	}

	console.log(`${urls.length} adresów${since ? ` (lastmod od ${since})` : ''}:`)
	for (const url of urls) console.log(`  ${url}`)
	if (dryRun) return

	const response = await fetch(ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
		body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
	})
	// 200 i 202 = przyjęte (202: klucz jeszcze weryfikowany); 403 zły klucz; 422 adresy spoza hosta; 429 za często
	const meaning = { 200: 'przyjęte', 202: 'przyjęte, klucz w weryfikacji', 400: 'błędne żądanie', 403: 'klucz nieważny', 422: 'adresy nie pasują do hosta', 429: 'za dużo zgłoszeń — spróbuj później' }
	console.log(`IndexNow: HTTP ${response.status} — ${meaning[response.status] ?? (await response.text()).slice(0, 200)}`)
	if (response.status !== 200 && response.status !== 202) process.exitCode = 1
}

main().catch(error => {
	console.error(error.message)
	process.exitCode = 1
})
