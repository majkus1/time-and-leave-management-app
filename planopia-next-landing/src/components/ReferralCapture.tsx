'use client'

import { useEffect } from 'react'
import { captureReferralFromUrl } from '@/lib/referral'

/** Zapis kodu partnera z linku planopia.pl/?ref=KOD (first-touch, 90 dni) — nic nie renderuje */
export default function ReferralCapture() {
	useEffect(() => {
		captureReferralFromUrl()
	}, [])
	return null
}
