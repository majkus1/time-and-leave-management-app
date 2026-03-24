import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * Short intro above the chat (presentational).
 * @param {object} [props.aiEntitlements] — z /api/ai-assistant/status (pole ai z buildClientEntitlements)
 */
function AIAssistantHeader({ enabled, aiEntitlements }) {
	const { t } = useTranslation()

	const showQuota =
		enabled &&
		aiEntitlements &&
		!aiEntitlements.unrestricted &&
		aiEntitlements.metered === true

	return (
		<div className="ai-assistant-header" role="banner">
			<div className="ai-assistant-header__title-row">
				<img
					className="ai-assistant-header__logo"
					src="/img/aiasystent.png"
					alt=""
					width={40}
					height={40}
				/>
				<h1 className="ai-assistant-header__title">{t('aiAssistant.title')}</h1>
				{!enabled && (
					<span className="ai-assistant-header__badge ai-assistant-header__badge--off">
						{t('aiAssistant.disabledBadge')}
					</span>
				)}
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

			<details className="ai-assistant-header__intro-details">
				<summary className="ai-assistant-header__intro-summary">{t('aiAssistant.introToggle')}</summary>
				<div className="ai-assistant-header__intro-panel">
					{t('aiAssistant.intro')}{' '}
					<strong className="ai-assistant-header__intro-browser">{t('aiAssistant.introBrowserNote')}</strong>{' '}
					{t('aiAssistant.introLegalNote')}
				</div>
			</details>
		</div>
	)
}

export default AIAssistantHeader
