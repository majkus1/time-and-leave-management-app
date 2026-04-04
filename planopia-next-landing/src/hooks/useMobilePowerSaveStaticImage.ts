import { useEffect, useState } from 'react'

export const MOBILE_MAX_767 = '(max-width: 767px)'

/** Podzbiór Battery Status API (nie we wszystkich TS DOM). */
export interface BatteryManagerLike {
	readonly charging: boolean
	readonly level: number
	addEventListener(type: 'chargingchange' | 'levelchange', listener: () => void): void
	removeEventListener(type: 'chargingchange' | 'levelchange', listener: () => void): void
}

export type NavigatorWithBattery = Navigator & { getBattery?: () => Promise<BatteryManagerLike> }

export function isMobileViewport(): boolean {
	if (typeof window === 'undefined') return false
	return window.matchMedia(MOBILE_MAX_767).matches
}

/**
 * Czy na mobile pokazać obraz zamiast wideo (Save-Data, prefers-reduced-data, niski stan baterii).
 */
export function useMobilePowerSaveStaticImage(): boolean {
	const [useImage, setUseImage] = useState(false)

	useEffect(() => {
		let cancelled = false
		let battery: BatteryManagerLike | null = null

		const applyBatteryState = (bat: BatteryManagerLike) => {
			if (cancelled) return
			setUseImage(!bat.charging && bat.level <= 0.25)
		}

		const onBatteryEvent = () => {
			if (cancelled || !battery) return
			applyBatteryState(battery)
		}

		const detachBattery = () => {
			if (battery) {
				battery.removeEventListener('chargingchange', onBatteryEvent)
				battery.removeEventListener('levelchange', onBatteryEvent)
				battery = null
			}
		}

		const evaluate = () => {
			detachBattery()
			if (cancelled) return

			if (!isMobileViewport()) {
				setUseImage(false)
				return
			}

			const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
			if (conn?.saveData) {
				setUseImage(true)
				return
			}

			try {
				if (window.matchMedia('(prefers-reduced-data: reduce)').matches) {
					setUseImage(true)
					return
				}
			} catch {
				/* brak wsparcia */
			}

			const getBat = (navigator as NavigatorWithBattery).getBattery
			if (typeof getBat !== 'function') {
				setUseImage(false)
				return
			}

			void getBat()
				.then((bat: BatteryManagerLike) => {
					if (cancelled) return
					battery = bat
					applyBatteryState(bat)
					bat.addEventListener('chargingchange', onBatteryEvent)
					bat.addEventListener('levelchange', onBatteryEvent)
				})
				.catch(() => {
					if (!cancelled) setUseImage(false)
				})
		}

		evaluate()
		const mq = window.matchMedia(MOBILE_MAX_767)
		mq.addEventListener('change', evaluate)

		return () => {
			cancelled = true
			detachBattery()
			mq.removeEventListener('change', evaluate)
		}
	}, [])

	return useImage
}
