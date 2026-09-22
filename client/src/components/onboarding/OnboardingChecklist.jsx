import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useOnboardingStatus, useDismissOnboarding, useCreateDemoData, useRemoveDemoData } from '../../hooks/useOnboarding'
import { useAlert } from '../../context/AlertContext'
import { isAdmin, isHR } from '../../utils/roleHelpers'
import './OnboardingChecklist.css'

/** Kotwica sekcji świąt na stronie ustawień — Settings.jsx przewija do niej po wczytaniu. */
export const SETTINGS_HOLIDAYS_ANCHOR = 'settings-holidays-section'
/** Krok 2 listy prowadzi do „Konfiguracja pracy w weekendy” — pierwszej sekcji o godzinach i dniach wolnych. */
export const SETTINGS_WORK_SETUP_ANCHOR = 'settings-weekends-section'

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
	const createDemo = useCreateDemoData()
	const removeDemo = useRemoveDemoData()
	const { showAlert, showConfirm } = useAlert()

	if (!staff || isLoading) return null

	const demoPresent = Boolean(data?.demo?.present)
	// Bez numeru w rejestracji nie zadzwonimy sami — dajemy kalendarz. Z numerem: rozmowa i tak jest umawiana telefonicznie.
	const founderCall = data?.founderCall
	const showCallButton = Boolean(founderCall?.active && founderCall.url && !founderCall.phoneLeft)
	const demoAvailable = Boolean(data?.demo?.available) // tylko okres próbny
	const demoBusy = createDemo.isPending || removeDemo.isPending

	const loadDemo = async () => {
		try {
			const result = await createDemo.mutateAsync()
			void showAlert(t('onboarding.demoLoaded', { count: result?.employees ?? 0 }))
		} catch (e) {
			const code = e?.response?.data?.code
			void showAlert(
				code === 'DEMO_NO_SEATS'
					? t('onboarding.demoNoSeats')
					: code === 'DEMO_EXISTS'
						? t('onboarding.demoExists')
						: code === 'DEMO_NOT_TRIAL'
							? t('onboarding.demoNotTrial')
							: t('onboarding.demoError')
			)
		}
	}

	const clearDemo = async () => {
		if (!(await showConfirm(t('onboarding.demoRemoveConfirm')))) return
		try {
			await removeDemo.mutateAsync()
			void showAlert(t('onboarding.demoRemoved'))
		} catch {
			void showAlert(t('onboarding.demoError'))
		}
	}

	// Lista ukryta, ale dane demo wciąż w zespole — zostaje sam pasek z przyciskiem usunięcia.
	if (!data?.visible) {
		if (!demoPresent) return null
		return (
			<section className={`po-onboarding po-onboarding--${variant} po-onboarding--demo-only`} aria-label={t('onboarding.demoBarTitle')}>
				<div className="po-onboarding__demo-bar">
					<span>{t('onboarding.demoBarBody')}</span>
					<button type="button" className="po-onboarding__btn po-onboarding__btn--danger" onClick={clearDemo} disabled={demoBusy}>
						{removeDemo.isPending ? t('onboarding.demoRemoving') : t('onboarding.demoRemove')}
					</button>
				</div>
			</section>
		)
	}

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
			to: `/settings#${SETTINGS_WORK_SETUP_ANCHOR}`,
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
					<div className="po-onboarding__progress" aria-hidden="true">
						<span className="po-onboarding__progress-label">
							{t('onboarding.progress', { done: data.doneCount, total: data.total })}
						</span>
						<span className="po-onboarding__progress-bar">
							<span style={{ width: `${(data.doneCount / data.total) * 100}%` }} />
						</span>
					</div>
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

			<div className="po-onboarding__actions">
				<Link to="/ai-assistant?mode=help&module=general" className="po-onboarding__btn po-onboarding__btn--ai">
					<span aria-hidden="true">✦</span>
					{t('onboarding.askAssistant')}
				</Link>
				{showCallButton && (
					<a href={founderCall.url} className="po-onboarding__btn po-onboarding__btn--call" target={founderCall.url.startsWith('http') && !founderCall.url.includes(window.location.host) ? '_blank' : undefined} rel="noopener noreferrer">
						<img src="/img/1709827103942.webp" alt="" width="20" height="20" />
						{t('onboarding.bookCall')}
					</a>
				)}
				{demoPresent ? (
					<button type="button" className="po-onboarding__btn po-onboarding__btn--danger" onClick={clearDemo} disabled={demoBusy}>
						{removeDemo.isPending ? t('onboarding.demoRemoving') : t('onboarding.demoRemove')}
					</button>
				) : demoAvailable ? (
					<button type="button" className="po-onboarding__btn po-onboarding__btn--demo" onClick={loadDemo} disabled={demoBusy}>
						{createDemo.isPending ? t('onboarding.demoLoading') : t('onboarding.demoLoad')}
					</button>
				) : null}
			</div>
			{(demoPresent || demoAvailable) && (
				<p className="po-onboarding__help">{demoPresent ? t('onboarding.demoPresentHint') : t('onboarding.demoHint')}</p>
			)}

		</section>
	)
}
