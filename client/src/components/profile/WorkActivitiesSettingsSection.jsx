import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	useWorkActivities,
	useUpdateWorkActivities,
	useAddWorkActivity,
	useDeleteWorkActivity,
} from '../../hooks/useWorkActivities'
import { WORK_ACTIVITY_GROUPS } from '../../utils/workActivities'
import { useAlert } from '../../context/AlertContext'

const sectionHeadingStyle = {
	color: '#2c3e50',
	marginTop: '40px',
	marginBottom: '20px',
	fontSize: '20px',
	fontWeight: '600',
	paddingBottom: '10px',
	borderBottom: '2px solid #00a846',
}

function WorkActivitiesSettingsSection({ canEditSettings, embedded = false }) {
	const { t } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	const { data: workActivities = [], isLoading } = useWorkActivities({ enabled: canEditSettings })
	const updateMutation = useUpdateWorkActivities()
	const addMutation = useAddWorkActivity()
	const deleteMutation = useDeleteWorkActivity()

	const [newName, setNewName] = useState('')
	const [newNameEn, setNewNameEn] = useState('')
	const [newGroup, setNewGroup] = useState('line')
	const [newTrackQuantity, setNewTrackQuantity] = useState(false)
	const [newUnit, setNewUnit] = useState('')

	const handleToggleEnabled = async (activityId, isEnabled) => {
		try {
			const updated = workActivities.map(item =>
				item.id === activityId ? { ...item, isEnabled: !isEnabled } : item
			)
			await updateMutation.mutateAsync(updated)
		} catch {
			await showAlert(t('settings.workActivitiesUpdateError'))
		}
	}

	const handlePatchActivity = async (activityId, patch) => {
		try {
			const updated = workActivities.map(item =>
				item.id === activityId ? { ...item, ...patch } : item
			)
			await updateMutation.mutateAsync(updated)
		} catch {
			await showAlert(t('settings.workActivitiesUpdateError'))
		}
	}

	const handleToggleQuantityTracking = async (activity) => {
		const willTrack = activity.trackQuantity !== true
		if (willTrack && !String(activity.unit || '').trim()) {
			await showAlert(t('settings.workActivitiesUnitRequired'))
			return
		}
		await handlePatchActivity(activity.id, { trackQuantity: willTrack })
	}

	const handleAdd = async () => {
		if (!newName.trim()) {
			await showAlert(t('settings.workActivitiesNameRequired'))
			return
		}
		if (newTrackQuantity && !newUnit.trim()) {
			await showAlert(t('settings.workActivitiesUnitRequired'))
			return
		}
		try {
			await addMutation.mutateAsync({
				name: newName.trim(),
				nameEn: newNameEn.trim() || undefined,
				group: newGroup,
				trackQuantity: newTrackQuantity,
				unit: newTrackQuantity ? newUnit.trim() : '',
				isEnabled: true,
			})
			setNewName('')
			setNewNameEn('')
			setNewTrackQuantity(false)
			setNewUnit('')
			await showAlert(t('settings.workActivitiesAddSuccess'))
		} catch {
			await showAlert(t('settings.workActivitiesAddError'))
		}
	}

	const handleDelete = async (activityId) => {
		const confirmed = await showConfirm(t('settings.workActivitiesDeleteConfirm'))
		if (!confirmed) return
		try {
			await deleteMutation.mutateAsync(activityId)
			await showAlert(t('settings.workActivitiesDeleteSuccess'))
		} catch {
			await showAlert(t('settings.workActivitiesDeleteError'))
		}
	}

	if (!canEditSettings) return null

	return (
		<div className="settings-section work-activities-settings-section" style={{ marginTop: embedded ? 0 : '30px' }}>
			{embedded ? (
				<h4 style={{
					marginBottom: '15px',
					fontSize: '18px',
					fontWeight: '600',
					color: '#2c3e50',
				}}>
					{t('settings.workActivitiesTitle')}
				</h4>
			) : (
				<h3 style={sectionHeadingStyle}>{t('settings.workActivitiesTitle')}</h3>
			)}
			<p style={{ color: '#7f8c8d', marginBottom: '16px', lineHeight: 1.6 }}>
				{t('settings.workActivitiesDescription')}
			</p>

			{isLoading ? (
				<p>{t('settings.loading') || '...'}</p>
			) : (
				<>
					{workActivities.length === 0 ? (
						<p style={{ color: '#888', marginBottom: '12px' }}>{t('settings.workActivitiesEmpty')}</p>
					) : (
						<div className="work-activities-settings-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
							{workActivities.map(activity => (
								<div
									key={activity.id}
									className="work-activities-settings-item"
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										flexWrap: 'wrap',
										gap: '12px',
										padding: '10px 12px',
										border: '1px solid #dee2e6',
										borderRadius: '8px',
										backgroundColor: '#fff',
									}}
								>
									<div className="work-activities-settings-item__main" style={{ flex: '1 1 240px', minWidth: 0 }}>
										<strong>{activity.name}</strong>
										{activity.nameEn ? <span style={{ color: '#666' }}> / {activity.nameEn}</span> : null}
										<span style={{ marginLeft: '8px', fontSize: '12px', color: '#888' }}>
											({t(WORK_ACTIVITY_GROUPS.find(g => g.id === activity.group)?.labelKey || 'workcalendar.activities.groupOther')})
										</span>
										{activity.trackQuantity && activity.unit ? (
											<span style={{ marginLeft: '8px', fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>
												{t('settings.workActivityMeasured')}: {activity.unit}
											</span>
										) : null}
									</div>
									<div className="work-activities-settings-item__actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
										<label className="work-activities-settings-option" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
											<input
												type="checkbox"
												checked={activity.trackQuantity === true}
												onChange={() => handleToggleQuantityTracking(activity)}
												disabled={updateMutation.isPending}
											/>
											{t('settings.workActivityTrackQuantity')}
										</label>
										<input
											type="text"
											defaultValue={activity.unit || ''}
											onBlur={e => {
												const value = e.target.value.trim()
												if (value !== (activity.unit || '')) handlePatchActivity(activity.id, { unit: value })
											}}
											placeholder={t('settings.workActivityUnitPlaceholder')}
											className="form-control work-activities-settings-unit-input"
											style={{ width: '82px', height: '34px', padding: '6px 8px' }}
										/>
										<label className="work-activities-settings-option" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
											<input
												type="checkbox"
												checked={activity.isEnabled !== false}
												onChange={() => handleToggleEnabled(activity.id, activity.isEnabled !== false)}
												disabled={updateMutation.isPending}
											/>
											{t('settings.enabled')}
										</label>
										<button
											type="button"
											onClick={() => handleDelete(activity.id)}
											disabled={deleteMutation.isPending}
											className="btn btn-danger btn-sm"
										>
											{t('settings.delete')}
										</button>
									</div>
								</div>
							))}
						</div>
					)}

					<div className="work-activities-settings-add-card" style={{
						padding: '16px',
						border: '1px solid #dee2e6',
						borderRadius: '8px',
						backgroundColor: embedded ? '#fff' : '#f8f9fa',
					}}>
						<h4 style={{ marginBottom: '12px' }}>{t('settings.workActivitiesAdd')}</h4>
						<div className="work-activities-settings-add-grid" style={{ display: 'grid', gap: '8px', alignItems: 'end' }}>
							<div>
								<label className="block text-sm mb-1">{t('settings.typeName')}</label>
								<input
									type="text"
									value={newName}
									onChange={e => setNewName(e.target.value)}
									placeholder={t('settings.workActivityNamePlaceholder')}
									className="form-control"
								/>
							</div>
							<div>
								<label className="block text-sm mb-1">{t('settings.typeNameEn')}</label>
								<input
									type="text"
									value={newNameEn}
									onChange={e => setNewNameEn(e.target.value)}
									className="form-control"
								/>
							</div>
							<div>
								<label className="block text-sm mb-1">{t('settings.workActivityGroup')}</label>
								<select value={newGroup} onChange={e => setNewGroup(e.target.value)} className="form-control">
									{WORK_ACTIVITY_GROUPS.map(group => (
										<option key={group.id} value={group.id}>{t(group.labelKey)}</option>
									))}
								</select>
							</div>
							<div style={{ height: '36px', display: 'flex', alignItems: 'center' }}>
								<label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '13px', lineHeight: 1.2, fontWeight: 500, color: '#243b53', whiteSpace: 'nowrap' }}>
									<input
										type="checkbox"
										checked={newTrackQuantity}
										onChange={e => setNewTrackQuantity(e.target.checked)}
										style={{ margin: 0 }}
									/>
									{t('settings.workActivityTrackQuantity')}
								</label>
							</div>
							<div>
								<label className="block text-sm mb-1">{t('settings.workActivityUnit')}</label>
								<input
									type="text"
									value={newUnit}
									onChange={e => setNewUnit(e.target.value)}
									disabled={!newTrackQuantity}
									placeholder={t('settings.workActivityUnitPlaceholder')}
									className="form-control"
								/>
							</div>
							<button
								type="button"
								onClick={handleAdd}
								disabled={addMutation.isPending}
								className="btn btn-primary work-activities-settings-add-button"
							>
								{t('settings.add')}
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	)
}

export default WorkActivitiesSettingsSection
