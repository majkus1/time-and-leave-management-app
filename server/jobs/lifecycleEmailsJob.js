/**
 * Codzienny job maili cyklu życia (powitanie, „dodaj zespół”, koniec trialu…).
 *
 * Włączany JAWNIE zmienną LIFECYCLE_EMAILS_ENABLED=true — bez niej nic nie wysyła.
 * Powód: lokalny serwer podpięty pod produkcyjną bazę wysłałby maile do prawdziwych klientów.
 *
 * Bez zewnętrznej biblioteki crona: pierwszy przebieg kilka minut po starcie (nadrabia
 * zaległości po restarcie), potem codziennie o LIFECYCLE_EMAILS_HOUR (domyślnie 9:00 czasu serwera).
 */
const lifecycleEmailService = require('../services/lifecycleEmailService')

const STARTUP_DELAY_MS = 3 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function isEnabled() {
	return String(process.env.LIFECYCLE_EMAILS_ENABLED || '').toLowerCase() === 'true'
}

function msUntilNextRun(now = new Date()) {
	const hour = Number.parseInt(process.env.LIFECYCLE_EMAILS_HOUR || '9', 10)
	const next = new Date(now)
	next.setHours(Number.isFinite(hour) ? hour : 9, 0, 0, 0)
	if (next <= now) next.setTime(next.getTime() + DAY_MS)
	return next.getTime() - now.getTime()
}

let running = false

async function runSafely() {
	if (running) return
	running = true
	try {
		const result = await lifecycleEmailService.runLifecycleEmailsOnce()
		const sent = (result.results || []).filter(r => r.sent)
		console.log(`[lifecycleEmails] sprawdzono ${result.teamsChecked} zespołów, wysłano ${sent.length}`)
		for (const r of sent) console.log(`[lifecycleEmails]   ${r.kind} -> ${r.team}`)
	} catch (e) {
		console.error('[lifecycleEmails] przebieg nieudany:', e.message)
	} finally {
		running = false
	}
}

function scheduleNext() {
	const delay = msUntilNextRun()
	setTimeout(async () => {
		await runSafely()
		scheduleNext()
	}, delay).unref?.()
}

function startLifecycleEmailsJob() {
	if (!isEnabled()) {
		console.log('[lifecycleEmails] wyłączone (ustaw LIFECYCLE_EMAILS_ENABLED=true, aby włączyć)')
		return
	}
	setTimeout(runSafely, STARTUP_DELAY_MS).unref?.()
	scheduleNext()
	console.log('[lifecycleEmails] włączone — pierwszy przebieg za 3 min, potem codziennie')
}

module.exports = { startLifecycleEmailsJob, msUntilNextRun, isEnabled }
