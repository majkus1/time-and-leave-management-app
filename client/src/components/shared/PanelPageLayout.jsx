import React from 'react'
import { Helmet } from 'react-helmet-async'
import Sidebar from '../dashboard/Sidebar'

/**
 * Układ stron paneli (program partnerski, biuro rachunkowe, panel admina partnerów) — jak pozostałe strony aplikacji:
 * menu boczne, kontener odsunięty od menu (logs-container) i nagłówek z ikoną. contentRef wskazuje kontener, który
 * istnieje także w stanie ładowania (np. dla useTableCellLabels).
 */
export default function PanelPageLayout({ title, icon, contentRef, children }) {
	return (
		<>
			<Helmet>
				<title>{title} — Planopia</title>
			</Helmet>
			<Sidebar />
			<div className="logs-container panel-page" ref={contentRef}>
				<div className="logs-header panel-page__header">
					<h2>
						{icon ? <img src={icon} alt="" /> : null} {title}
					</h2>
					<hr />
				</div>
				{children}
			</div>
		</>
	)
}
