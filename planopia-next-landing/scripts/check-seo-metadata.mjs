const TITLE_MAX = 58
const DESCRIPTION_MIN = 90
const DESCRIPTION_MAX = 155

const protectedPages = {
	'/dpa': [
		'Umowa powierzenia przetwarzania danych (DPA) Planopia.pl | Planopia',
		'Zapoznaj się z Umową powierzenia przetwarzania danych osobowych (DPA) Planopia.pl. Warunki przetwarzania danych przez Planopię jako procesora.',
	],
	'/dla-gastronomii': [
		'Grafik pracy dla gastronomii i restauracji | Planopia',
		'Grafik pracy gastronomii, ewidencja godzin, urlopy i zadania w jednym systemie. Dla restauracji, kawiarni, barów i cateringu. 30 dni za darmo.',
	],
	'/dla-firm-sprzatajacych': [
		'Program dla firmy sprzątającej: grafik pracy | Planopia',
		'Planuj grafik ekip sprzątających, ewidencję godzin, urlopy, zastępstwa i zadania w jednym systemie. Dla firm obsługujących wiele obiektów. 30 dni gratis.',
	],
	'/blog/jak-ulozyc-grafik-pracy-w-restauracji': [
		'Jak ułożyć grafik pracy w restauracji? Poradnik | Planopia',
		'Grafik pracy w restauracji krok po kroku: dostępność zespołu, obsada sali i kuchni, zastępstwa, urlopy oraz rozliczenie godzin bez chaosu w Excelu.',
	],
	'/blog/jak-zarzadzac-firma-sprzatajaca': [
		'Jak zarządzać firmą sprzątającą? Poradnik | Planopia',
		'Zarządzanie firmą sprzątającą krok po kroku: obiekty, grafik ekip, zastępstwa, zadania, kontrola wykonania i rozliczenie godzin bez chaosu w Excelu.',
	],
}

const preservedTitleLengthExceptions = new Set(['/dpa'])

function argument(name, fallback) {
	const direct = process.argv.indexOf(name)
	if (direct !== -1 && process.argv[direct + 1]) return process.argv[direct + 1]
	const assigned = process.argv.find((value) => value.startsWith(`${name}=`))
	return assigned ? assigned.slice(name.length + 1) : fallback
}

function decode(value = '') {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
		.trim()
}

function attributes(tag) {
	const result = new Map()
	for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gs)) {
		result.set(match[1].toLowerCase(), decode(match[3]))
	}
	return result
}

function tags(html, name) {
	return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0])
}

function normalize(value) {
	const url = new URL(value)
	url.search = ''
	url.hash = ''
	if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '')
	return url.toString()
}

async function checkPage(baseUrl, canonicalUrl) {
	const canonical = new URL(canonicalUrl)
	const pathname = canonical.pathname.replace(/\/$/, '') || '/'
	const pageUrl = new URL(`${canonical.pathname}${canonical.search}`, baseUrl)
	const response = await fetch(pageUrl, { redirect: 'follow' })
	const html = await response.text()
	const errors = []

	if (!response.ok) errors.push(`HTTP ${response.status}`)
	const titles = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => decode(match[1]))
	const descriptions = tags(html, 'meta')
		.map(attributes)
		.filter((item) => item.get('name')?.toLowerCase() === 'description')
		.map((item) => item.get('content') ?? '')
	const canonicals = tags(html, 'link')
		.map(attributes)
		.filter((item) => (item.get('rel') ?? '').toLowerCase().split(/\s+/).includes('canonical'))
		.map((item) => item.get('href') ?? '')
	const htmlTag = tags(html, 'html')[0]
	const language = htmlTag ? attributes(htmlTag).get('lang') : undefined
	const expectedLanguage = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pl'

	if (titles.length !== 1) errors.push(`expected one title, found ${titles.length}`)
	if (descriptions.length !== 1) errors.push(`expected one description, found ${descriptions.length}`)
	if (canonicals.length !== 1) errors.push(`expected one canonical, found ${canonicals.length}`)

	const title = titles[0] ?? ''
	const description = descriptions[0] ?? ''
	if (title.length > TITLE_MAX && !preservedTitleLengthExceptions.has(pathname)) {
		errors.push(`title length ${title.length}: ${title}`)
	}
	if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) {
		errors.push(`description length ${description.length}`)
	}
	if ((title.match(/\|/g) ?? []).length > 1) errors.push(`multiple title separators: ${title}`)
	if (html.includes('blogArticleOfferLine')) errors.push('unresolved blogArticleOfferLine')
	if (language?.toLowerCase().split('-')[0] !== expectedLanguage) {
		errors.push(`html lang ${language ?? 'missing'}, expected ${expectedLanguage}`)
	}
	if (canonicals[0] && normalize(canonicals[0]) !== normalize(canonicalUrl)) {
		errors.push(`canonical ${canonicals[0]}, expected ${canonicalUrl}`)
	}
	const protectedMetadata = protectedPages[pathname]
	if (protectedMetadata && (title !== protectedMetadata[0] || description !== protectedMetadata[1])) {
		errors.push('protected metadata changed')
	}

	return { pathname, errors }
}

async function main() {
	const positionalUrl = process.argv.slice(2).find((value) => /^https?:\/\//.test(value))
	const baseUrl = new URL(argument('--base-url', positionalUrl ?? 'http://localhost:3000'))
	const sitemapResponse = await fetch(new URL('/sitemap.xml', baseUrl))
	if (!sitemapResponse.ok) throw new Error(`Sitemap returned HTTP ${sitemapResponse.status}`)
	const sitemap = await sitemapResponse.text()
	const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decode(match[1]))
	if (urls.length === 0) throw new Error('Sitemap does not contain URLs')

	const results = []
	for (let index = 0; index < urls.length; index += 6) {
		results.push(...(await Promise.all(urls.slice(index, index + 6).map((url) => checkPage(baseUrl, url)))))
	}
	const failures = results.filter((result) => result.errors.length)
	for (const failure of failures) {
		console.error(`\n${failure.pathname}`)
		failure.errors.forEach((error) => console.error(`  - ${error}`))
	}
	if (failures.length) throw new Error(`SEO metadata failed for ${failures.length}/${results.length} routes`)
	console.log(`SEO metadata passed for ${results.length} routes (${baseUrl.origin}).`)
}

main().catch((error) => {
	console.error(error.message)
	process.exitCode = 1
})
