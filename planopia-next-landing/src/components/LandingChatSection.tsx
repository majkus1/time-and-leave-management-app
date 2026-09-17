import LandingChatSectionBody from '@/components/landingChat/LandingChatSectionBody'
import { LANDING_CHAT_SECTION_ID, landingChatCopy, type LandingChatLocale } from '@/components/landingChat/landingChatCopy'

type Variant = 'home' | 'guide'

/**
 * Sekcja „Zapytaj asystenta”. Nagłówek i lead renderują się po stronie serwera (treść dla wyszukiwarek);
 * czat jest komponentem klienckim na wspólnym stanie z widgetem.
 * `home` — pełna sekcja na stronie głównej (kontener 7xl, eyebrow + lead);
 * `guide` — zwarta karta na górze instrukcji /jak-korzystac (kontener 4xl jak reszta strony, sam tytuł + podpowiedź).
 */
export default function LandingChatSection({ locale, variant = 'home' }: { locale: LandingChatLocale; variant?: Variant }) {
	const copy = landingChatCopy[locale]
	const headingId = `landing-chat-heading-${locale}-${variant}`
	const guide = variant === 'guide'
	return (
		<section
			id={LANDING_CHAT_SECTION_ID[locale]}
			className={`landing-chat-section${guide ? ' landing-chat-section--guide' : ''} px-4`}
			aria-labelledby={headingId}
		>
			<div className={guide ? 'mx-auto max-w-4xl px-1 sm:px-2' : 'max-w-7xl mx-auto'}>
				<div className="landing-chat-section__head">
					{!guide && <p className="landing-section-eyebrow landing-chat-section__eyebrow">{copy.sectionEyebrow}</p>}
					<h2 id={headingId} className="landing-chat-section__title">
						{guide ? copy.guideTitle : copy.sectionTitle}
					</h2>
					{!guide && <p className="landing-chat-section__lead">{copy.sectionLead}</p>}
					<p className="landing-chat-section__hint">{guide ? copy.guideHint : copy.sectionHint}</p>
				</div>
				<LandingChatSectionBody />
			</div>
		</section>
	)
}
