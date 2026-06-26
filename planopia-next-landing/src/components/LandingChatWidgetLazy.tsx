'use client'

import dynamic from 'next/dynamic'

const LandingChatWidget = dynamic(() => import('./LandingChatWidget'), { ssr: false })

export default function LandingChatWidgetLazy() {
	return <LandingChatWidget />
}
