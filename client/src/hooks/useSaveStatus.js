import { useCallback, useEffect, useRef, useState } from 'react'

const SAVED_VISIBLE_MS = 2500

/**
 * Stan zapisu pola: 'saving' od chwili wyboru do odpowiedzi serwera, potem przez chwilę 'saved'.
 * Bez tego zmiana w liście wygląda na zawieszoną, dopóki serwer nie odpowie.
 * track(task): task zwraca false, gdy zapis się nie udał (komunikat pokazuje sam) — wtedy stan znika.
 */
export default function useSaveStatus() {
	const [status, setStatus] = useState(null)
	const timer = useRef(null)

	useEffect(() => () => clearTimeout(timer.current), [])

	const track = useCallback(async task => {
		clearTimeout(timer.current)
		setStatus('saving')
		let ok
		try {
			ok = (await task()) !== false
		} catch (error) {
			setStatus(null)
			throw error
		}
		setStatus(ok ? 'saved' : null)
		if (ok) timer.current = setTimeout(() => setStatus(null), SAVED_VISIBLE_MS)
		return ok
	}, [])

	return [status, track]
}
