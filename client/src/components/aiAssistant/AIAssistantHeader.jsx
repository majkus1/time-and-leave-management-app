import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'

const InfoIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<circle cx="12" cy="12" r="9" />
		<path d="M12 11v5M12 8h.01" />
	</svg>
)

const DownloadIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
	</svg>
)

const TrashIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
	</svg>
)

/**
 * Nagłówek asystenta: tytuł, status i małe akcje (informacje, pobierz rozmowę, wyczyść) w jednym wierszu —
 * zamiast osobnego wiersza „Informacje” i przycisków nad czatem.
 * @param {object} [props.aiEntitlements] — z /api/ai-assistant/status (pole ai z buildClientEntitlements)
 * @param {boolean} [props.statusPending] — pierwsze pobranie statusu (nie pokazuj „wyłączony” zanim przyjdzie odpowiedź)
 * @param {boolean} [props.statusError] — błąd pobrania statusu
 */
function AIAssistantHeader({
	enabled,
	aiEntitlements,
	statusPending,
	statusError,
	helpMode = false,
	onClear,
	onExport,
	canClear = false,
	canExport = false,
}) {
	const { t } = useTranslation()
	const { isDark } = useTheme()
	const [infoOpen, setInfoOpen] = useState(false)
	const planioLogoSrc = isDark ? '/img/star.png' : '/img/planio.png'
	const introBullets = t('aiAssistant.introBullets', { returnObjects: true })
	const introList = Array.isArray(introBullets) ? introBullets : []

	const showQuota =
		!helpMode &&
		!statusPending &&
		!statusError &&
		enabled &&
		aiEntitlements &&
		!aiEntitlements.unrestricted &&
		aiEntitlements.metered === true

	return (
		<div className="ai-assistant-header" role="banner">
			<div className="ai-assistant-header__title-row">
				<img
					className="ai-assistant-header__logo"
					src={planioLogoSrc}
					alt=""
					width={40}
					height={40}
					draggable={false}
				/>
				<h1 className="ai-assistant-header__title">{t('aiAssistant.title')}</h1>
				{!helpMode && statusPending && (
					<span className="ai-assistant-header__badge ai-assistant-header__badge--pending" aria-live="polite">
						<span className="ai-assistant-header__badge-dot" aria-hidden />
						{t('aiAssistant.statusChecking')}
					</span>
				)}
				{!helpMode && !statusPending && statusError && (
					<span className="ai-assistant-header__badge ai-assistant-header__badge--warn" role="status">
						{t('aiAssistant.statusLoadError')}
					</span>
				)}
				{!helpMode && !statusPending && !statusError && !enabled && (
					<span className="ai-assistant-header__badge ai-assistant-header__badge--off">
						{t('aiAssistant.disabledBadge')}
					</span>
				)}
				<div className="ai-assistant-header__actions">
					<button
						type="button"
						className={`ai-assistant-header__icon-btn${infoOpen ? ' ai-assistant-header__icon-btn--active' : ''}`}
						onClick={() => setInfoOpen(o => !o)}
						aria-expanded={infoOpen}
						aria-controls="ai-assistant-intro-panel"
						title={t('aiAssistant.header.info')}
						aria-label={t('aiAssistant.header.info')}
					>
						<InfoIcon />
					</button>
					{onExport && (
						<button
							type="button"
							className="ai-assistant-header__icon-btn"
							onClick={onExport}
							disabled={!canExport}
							title={t('aiAssistant.header.export')}
							aria-label={t('aiAssistant.header.export')}
						>
							<DownloadIcon />
						</button>
					)}
					{onClear && (
						<button
							type="button"
							className="ai-assistant-header__icon-btn"
							onClick={onClear}
							disabled={!canClear}
							title={t('aiAssistant.header.clear')}
							aria-label={t('aiAssistant.header.clear')}
						>
							<TrashIcon />
						</button>
					)}
				</div>
			</div>

			{showQuota && (
				<div
					className={`ai-assistant-quota-bar ${aiEntitlements.needsSubscription ? 'ai-assistant-quota-bar--warn' : ''} ${!aiEntitlements.hasAccess && !aiEntitlements.needsSubscription ? 'ai-assistant-quota-bar--warn' : ''}`}
					role="status"
				>
					<div className="ai-assistant-quota-bar__main">
						{aiEntitlements.needsSubscription ? (
							<>
								<span>{t('aiAssistant.aiQuota.needPlan')}</span>{' '}
								<Link to="/packages" className="ai-assistant-quota-bar__link">
									{t('aiAssistant.quotaLink')}
								</Link>
							</>
						) : aiEntitlements.hasAccess ? (
							<span>
								{t('aiAssistant.aiQuota.remaining', {
									n:
										aiEntitlements.remainingApprox === Number.POSITIVE_INFINITY
											? '—'
											: String(aiEntitlements.remainingApprox ?? '—'),
								})}
							</span>
						) : (
							<>
								<span>{t('aiAssistant.aiQuota.depleted')}</span>{' '}
								<Link to="/packages" className="ai-assistant-quota-bar__link">
									{t('aiAssistant.quotaLink')}
								</Link>
							</>
						)}
					</div>
					<div className="ai-assistant-quota-bar__hint">{t('aiAssistant.aiQuota.sharedHint')}</div>
				</div>
			)}

			{infoOpen && (
				<div id="ai-assistant-intro-panel" className="ai-assistant-header__intro-panel ai-assistant-header__intro-panel--standalone">
					{introList.length > 0 && (
						<ul className="ai-assistant-header__intro-list">
							{introList.map((line, idx) => (
								<li key={idx}>
									<span className="ai-assistant-header__intro-list-text">{line}</span>
								</li>
							))}
						</ul>
					)}
					<div className="ai-assistant-header__intro-privacy" role="note">
						<p>{t('aiAssistant.introBrowserNote')}</p>
						<p>{t('aiAssistant.introPrivacySensitive')}</p>
					</div>
					<p className="ai-assistant-header__intro-legal">{t('aiAssistant.introLegalNote')}</p>
				</div>
			)}
		</div>
	)
}

export default AIAssistantHeader
