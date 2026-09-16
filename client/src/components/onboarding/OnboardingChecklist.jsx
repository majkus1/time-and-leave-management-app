import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useOnboardingStatus, useDismissOnboarding } from '../../hooks/useOnboarding'
import { isAdmin, isHR } from '../../utils/roleHelpers'
import './OnboardingChecklist.css'

/** Kotwica sekcji świąt na stronie ustawień — Settings.jsx przewija do niej po wczytaniu. */
export const SETTINGS_HOLIDAYS_ANCHOR = 'settings-holidays-section'

function CheckIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<polyline points="20 6 9 17 4 12" />
		</svg>
	)
}

/**
 * „Pierwsze kroki” po założeniu zespołu. Widoczna dla Admina / HR, dopóki nie zrobią trzech rzeczy
 * albo jej nie ukryją. Kroki liczy serwer z faktycznych danych — nie da się jej „odklikać”.
 *
 * Nagłówek i stopka to <div>, nie <header>/<footer>: globalny styl aplikacji robi
 * `header { position: fixed }` i karta rozjeżdżała się na produkcji.
 */
export default function OnboardingChecklist({ variant = 'default' }) {
	const { t } = useTranslation()
	const location = useLocation()
	const { loggedIn, role } = useAuth()
	const staff = isAdmin(role) || isHR(role)
	const { data, isLoading } = useOnboardingStatus({ enabled: !!loggedIn && staff })
	const dismiss = useDismissOnboarding()

	if (!staff || isLoading || !data?.visible) return null

	const onWorkTime = location.pathname === '/work-time'
	const steps = [
		{
			key: 'employees',
			done: data.steps.employees.done,
			title: t('onboarding.step1Title'),
			body: t('onboarding.step1Body'),
			to: '/create-user',
			cta: t('onboarding.step1Cta'),
		},
		{
			key: 'settings',
			done: data.steps.settings.done,
			title: t('onboarding.step2Title'),
			body: t('onboarding.step2Body'),
			to: `/settings#${SETTINGS_HOLIDAYS_ANCHOR}`,
			cta: t('onboarding.step2Cta'),
		},
		{
			key: 'firstWorkday',
			done: data.steps.firstWorkday.done,
			title: t('onboarding.step3Title'),
			body: onWorkTime ? t('onboarding.step3BodyHere') : t('onboarding.step3Body'),
			to: onWorkTime ? null : '/work-time',
			cta: t('onboarding.step3Cta'),
		},
	]

	return (
		<section
			className={`po-onboarding po-onboarding--${variant} ${data.allDone ? 'po-onboarding--done' : ''}`}
			aria-label={t('onboarding.title')}
		>
			<div className="po-onboarding__head">
				<div>
					<span className="po-onboarding__eyebrow">{t('onboarding.eyebrow')}</span>
					<h2 className="po-onboarding__title">
						{data.allDone ? t('onboarding.doneTitle') : t('onboarding.title')}
					</h2>
					<p className="po-onboarding__subtitle">
						{data.allDone ? t('onboarding.doneSubtitle') : t('onboarding.subtitle')}
					</p>
				</div>
				<div className="po-onboarding__aside">
					<div className="po-onboarding__progress" aria-hidden="true">
						<span className="po-onboarding__progress-label">
							{t('onboarding.progress', { done: data.doneCount, total: data.total })}
						</span>
						<span className="po-onboarding__progress-bar">
							<span style={{ width: `${(data.doneCount / data.total) * 100}%` }} />
						</span>
					</div>
					<button
						type="button"
						className="po-onboarding__dismiss"
						onClick={() => dismiss.mutate()}
						disabled={dismiss.isPending}
						aria-label={t('onboarding.hide')}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
						<span>{t('onboarding.hideShort')}</span>
					</button>
				</div>
			</div>

			<ol className="po-onboarding__steps">
				{steps.map((step, index) => (
					<li key={step.key} className={`po-onboarding__step ${step.done ? 'is-done' : ''}`}>
						<span className="po-onboarding__mark">{step.done ? <CheckIcon /> : index + 1}</span>
						<div className="po-onboarding__step-text">
							<strong>{step.title}</strong>
							<p>{step.body}</p>
						</div>
						{!step.done && step.to ? (
							<Link to={step.to} className="po-onboarding__cta">
								{step.cta}
							</Link>
						) : null}
					</li>
				))}
			</ol>

			{data.allDone ? (
				<div className="po-onboarding__foot">
					<button type="button" className="po-onboarding__done-btn" onClick={() => dismiss.mutate()} disabled={dismiss.isPending}>
						{t('onboarding.hideDone')}
					</button>
				</div>
			) : null}
		</section>
	)
}
