import LandingChatSectionBody from '@/components/landingChat/LandingChatSectionBody'
import { LANDING_CHAT_SECTION_ID, landingChatCopy, type LandingChatLocale } from '@/components/landingChat/landingChatCopy'

/**
 * Sekcja „Zapytaj asystenta” na stronie głównej. Nagłówek i lead renderują się po stronie serwera
 * (treść dla wyszukiwarek); czat jest komponentem klienckim na wspólnym stanie z widgetem.
 */
export default function LandingChatSection({ locale }: { locale: LandingChatLocale }) {
	const copy = landingChatCopy[locale]
	const headingId = `landing-chat-heading-${locale}`
	return (
		<section id={LANDING_CHAT_SECTION_ID[locale]} className="landing-chat-section py-12 px-4" aria-labelledby={headingId}>
			<div className="max-w-7xl mx-auto">
				<div className="landing-chat-section__head">
					<p className="landing-section-eyebrow landing-chat-section__eyebrow">{copy.sectionEyebrow}</p>
					<h2 id={headingId} className="landing-chat-section__title">
						{copy.sectionTitle}
					</h2>
					<p className="landing-chat-section__lead">{copy.sectionLead}</p>
					<p className="landing-chat-section__hint">{copy.sectionHint}</p>
				</div>
				<LandingChatSectionBody />
			</div>
		</section>
	)
}
