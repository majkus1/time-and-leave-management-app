import { NextResponse } from 'next/server'
import { generateFallbackSlots, type SlotsPayload } from '@/lib/founderCallSlots'

export const dynamic = 'force-dynamic'

/**
 * Wolne terminy rozmowy wdrożeniowej dla formularza kontaktowego. Źródłem jest backend aplikacji (te same sloty,
 * co na app.planopia.pl/umow-rozmowe, z ukrytymi zajętymi); gdy backend nie odpowie, siatka liczona lokalnie.
 */
export async function GET() {
	const backend = (process.env.PLANOPIA_BACKEND_URL || '').replace(/\/$/, '')
	let payload: SlotsPayload | null = null
	if (backend) {
		try {
			const res = await fetch(`${backend}/api/founder-call/public/slots`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) })
			if (res.ok) {
				const data = (await res.json()) as SlotsPayload
				if (Array.isArray(data?.days)) payload = { tz: data.tz, stepMin: data.stepMin, days: data.days }
			}
		} catch {
			// backend niedostępny — zapas poniżej
		}
	}
	if (!payload) payload = generateFallbackSlots()
	return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, max-age=60' } })
}
