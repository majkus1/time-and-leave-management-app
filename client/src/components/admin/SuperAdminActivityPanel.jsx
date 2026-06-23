import React, { useMemo, useState } from 'react'
import { useSuperAdminActivity } from '../../hooks/useSuperAdminActivity'
import Loader from '../Loader'

function formatDt(iso) {
	if (!iso) return '—'
	try {
		return new Date(iso).toLocaleString('pl-PL', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	} catch {
		return iso
	}
}

function minutesAgo(iso) {
	if (!iso) return '—'
	const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
	if (m < 1) return 'przed chwilą'
	if (m === 1) return '1 min temu'
	if (m < 60) return `${m} min temu`
	const h = Math.floor(m / 60)
	return h === 1 ? '1 godz. temu' : `${h} godz. temu`
}

function StatCard({ label, value, sub }) {
	return (
		<div
			className="super-admin-stat-card"
			style={{
				background: '#fff',
				border: '1px solid #e5e7eb',
				borderRadius: '12px',
				padding: '16px 20px',
				minWidth: '140px',
				flex: '1 1 140px',
			}}
		>
			<div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '6px' }}>{label}</div>
			<div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
			{sub ? <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>{sub}</div> : null}
		</div>
	)
}

function DataTable({ columns, rows, empty }) {
	return (
		<div className="super-admin-data-table" style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
			<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
				<thead>
					<tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
						{columns.map(c => (
							<th
								key={c.key}
								style={{
									textAlign: 'left',
									padding: '10px 12px',
									fontWeight: 600,
									color: '#374151',
									whiteSpace: 'nowrap',
								}}
							>
								{c.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 ? (
						<tr>
							<td colSpan={columns.length} style={{ padding: '24px', color: '#6b7280', textAlign: 'center' }}>
								{empty}
							</td>
						</tr>
					) : (
						rows.map((row, i) => (
							<tr key={row.id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
								{columns.map(c => (
									<td key={c.key} style={{ padding: '10px 12px', color: '#1f2937', verticalAlign: 'top' }}>
										{c.render ? c.render(row) : row[c.key]}
									</td>
								))}
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	)
}

export default function SuperAdminActivityPanel() {
	const [onlineMinutes, setOnlineMinutes] = useState(30)
	const [historyDays, setHistoryDays] = useState(7)

	const { data, isLoading, isFetching, refetch, error } = useSuperAdminActivity({
		onlineMinutes,
		historyDays,
		enabled: true,
	})

	const onlineColumns = useMemo(
		() => [
			{ key: 'teamName', label: 'Zespół' },
			{ key: 'username', label: 'Użytkownik' },
			{
				key: 'lastSeenAt',
				label: 'Ostatnia aktywność',
				render: r => (
					<span>
						{minutesAgo(r.lastSeenAt)}
						<span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>
							{formatDt(r.lastSeenAt)}
						</span>
					</span>
				),
			},
			{
				key: 'startedAt',
				label: 'Sesja od',
				render: r => formatDt(r.startedAt),
			},
			{
				key: 'durationMinutes',
				label: 'Czas trwania',
				render: r => `${r.durationMinutes} min`,
			},
		],
		[]
	)

	const historyColumns = useMemo(
		() => [
			{ key: 'teamName', label: 'Zespół' },
			{ key: 'username', label: 'Użytkownik' },
			{
				key: 'status',
				label: 'Status',
				render: r =>
					r.endedAt ? (
						<span style={{ color: '#6b7280' }}>zakończona</span>
					) : (
						<span style={{ color: '#059669', fontWeight: 600 }}>aktywna</span>
					),
			},
			{
				key: 'lastSeenAt',
				label: 'Ostatnio',
				render: r => formatDt(r.lastSeenAt),
			},
			{
				key: 'startedAt',
				label: 'Start',
				render: r => formatDt(r.startedAt),
			},
			{
				key: 'durationMinutes',
				label: 'Min',
				render: r => r.durationMinutes,
			},
		],
		[]
	)

	const stats = data?.stats || {}

	return (
		<section
			className="super-admin-activity-panel"
			style={{
				marginTop: '3rem',
				paddingTop: '2rem',
				borderTop: '2px solid #e5e7eb',
			}}
			aria-labelledby="platform-sessions-heading"
		>
			<header
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'flex-start',
					justifyContent: 'space-between',
					gap: '16px',
					marginBottom: '20px',
				}}
			>
				<div>
					<h2
						id="platform-sessions-heading"
						style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 700, color: '#111827' }}
					>
						Aktywność w aplikacji
					</h2>
					<p style={{ margin: 0, color: '#6b7280', maxWidth: '40rem', fontSize: '0.95rem' }}>
						Sesje użytkowników (login, odświeżenie tokenu, socket). „Online” = aktywność w ostatnich{' '}
						{data?.onlineWindowMinutes ?? onlineMinutes} min.
					</p>
					{data?.generatedAt && (
						<p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
							Odświeżono: {formatDt(data.generatedAt)}
							{isFetching ? ' · …' : ''}
						</p>
					)}
				</div>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
					<label style={{ fontSize: '0.85rem', color: '#374151' }}>
						Online (min){' '}
						<select
							value={onlineMinutes}
							onChange={e => setOnlineMinutes(Number(e.target.value))}
							style={{ marginLeft: '4px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
						>
							<option value={15}>15</option>
							<option value={30}>30</option>
							<option value={60}>60</option>
						</select>
					</label>
					<label style={{ fontSize: '0.85rem', color: '#374151' }}>
						Historia (dni){' '}
						<select
							value={historyDays}
							onChange={e => setHistoryDays(Number(e.target.value))}
							style={{ marginLeft: '4px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
						>
							<option value={3}>3</option>
							<option value={7}>7</option>
							<option value={14}>14</option>
							<option value={30}>30</option>
						</select>
					</label>
					<button
						type="button"
						onClick={() => refetch()}
						style={{
							padding: '8px 16px',
							borderRadius: '8px',
							border: 'none',
							background: '#4f46e5',
							color: '#fff',
							fontWeight: 600,
							cursor: 'pointer',
						}}
					>
						Odśwież
					</button>
				</div>
			</header>

			{isLoading && !data ? (
				<div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
					<Loader />
				</div>
			) : error ? (
				<p style={{ color: '#b91c1c', margin: 0 }}>Nie udało się załadować danych sesji.</p>
			) : (
				<>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
						<StatCard label="Online teraz" value={stats.onlineNow ?? 0} />
						<StatCard label="Unikalni (24 h)" value={stats.uniqueUsersLast24h ?? 0} />
						<StatCard label="Nowe sesje dziś" value={stats.sessionsStartedToday ?? 0} />
						<StatCard label="Otwarte sesje" value={stats.openSessions ?? 0} sub="bez endedAt" />
						<StatCard label="Zespoły online" value={stats.teamsOnlineNow ?? 0} />
					</div>

					{data?.teamsOnlineBreakdown?.length > 0 && (
						<div style={{ marginBottom: '24px', fontSize: '0.9rem', color: '#4b5563' }}>
							<strong>Zespoły z aktywnymi użytkownikami:</strong>{' '}
							{data.teamsOnlineBreakdown.map(t => `${t.teamName} (${t.count})`).join(' · ')}
						</div>
					)}

					<div style={{ marginBottom: '28px' }}>
						<h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: '#111827' }}>
							Aktywni teraz
						</h3>
						<DataTable
							columns={onlineColumns}
							rows={data?.onlineNow || []}
							empty="Nikogo w wybranym oknie czasu."
						/>
					</div>

					<div>
						<h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: '#111827' }}>
							Historia sesji ({historyDays} dni)
						</h3>
						<DataTable
							columns={historyColumns}
							rows={data?.recentSessions || []}
							empty="Brak sesji w tym okresie."
						/>
					</div>
				</>
			)}
		</section>
	)
}
