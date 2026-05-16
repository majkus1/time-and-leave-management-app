import { useEffect, useState } from 'react'
import { computeTimerMetrics } from '../utils/timerDisplay'

/**
 * Live timer metrics synced every second while active (same rules as TimerPanel).
 */
export function useTimerElapsed(activeTimer) {
	const [nowMs, setNowMs] = useState(() => Date.now())

	useEffect(() => {
		if (!activeTimer?.active || !activeTimer.startTime) return undefined
		const id = window.setInterval(() => setNowMs(Date.now()), 1000)
		return () => window.clearInterval(id)
	}, [activeTimer?.active, activeTimer?.startTime])

	return computeTimerMetrics(activeTimer, nowMs)
}
