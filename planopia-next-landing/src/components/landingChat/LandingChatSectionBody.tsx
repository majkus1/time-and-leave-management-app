'use client'

import { useEffect, useRef } from 'react'
import LandingChatPanel from './LandingChatPanel'
import { useLandingChat } from './LandingChatProvider'

/** Część interaktywna sekcji na stronie głównej; nagłówek i lead są w komponencie serwerowym (SEO). */
export default function LandingChatSectionBody() {
	const { registerSection } = useLandingChat()
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => registerSection(ref.current), [registerSection])

	return (
		<div ref={ref} className="landing-chat-section__panel">
			<LandingChatPanel variant="section" />
		</div>
	)
}
