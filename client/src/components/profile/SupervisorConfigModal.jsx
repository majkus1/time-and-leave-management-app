import React, { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useSupervisorConfig, useUpdateSupervisorConfig } from '../../hooks/useSupervisor'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'

Modal.setAppElement('#root')

function SupervisorConfigModal({ isOpen, onClose, supervisorId }) {
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()
	const { data: config, isLoading } = useSupervisorConfig(supervisorId, isOpen)
	const updateConfigMutation = useUpdateSupervisorConfig()

	const [permissions, setPermissions] = useState({
		canApproveLeaves: true,
		canApproveLeavesDepartment: true,
		canApproveLeavesSelectedEmployees: true,
		canViewTimesheets: true,
		canViewTimesheetsDepartment: true,
		canViewTimesheetsSelectedEmployees: true,
		canManageSchedule: true,
		canManageScheduleDepartment: true,
		canManageScheduleCustom: true
	})

	useEffect(() => {
		if (config && config.permissions) {
			setPermissions(config.permissions)
		}
	}, [config])

	const handlePermissionChange = (key) => {
		setPermissions(prev => ({
			...prev,
			[key]: !prev[key]
		}))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		try {
			// Automatycznie ustaw sub-pola zgodnie z głównymi checkboxami
			const finalPermissions = {
				canApproveLeaves: permissions.canApproveLeaves,
				canApproveLeavesDepartment: permissions.canApproveLeaves,
				canApproveLeavesSelectedEmployees: permissions.canApproveLeaves,
				canViewTimesheets: permissions.canViewTimesheets,
				canViewTimesheetsDepartment: permissions.canViewTimesheets,
				canViewTimesheetsSelectedEmployees: permissions.canViewTimesheets,
				canManageSchedule: permissions.canManageSchedule,
				canManageScheduleDepartment: permissions.canManageSchedule,
				canManageScheduleCustom: permissions.canManageSchedule
			}
			
			await updateConfigMutation.mutateAsync({
				supervisorId,
				permissions: finalPermissions,
				selectedEmployees: config?.selectedEmployees || []
			})
			await showAlert(t('logs.supervisorConfigUpdated') || 'Konfiguracja przełożonego została zaktualizowana')
			onClose()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('logs.supervisorConfigError') || 'Błąd podczas aktualizacji konfiguracji')
		}
	}

	if (!isOpen) return null

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			style={{
				overlay: {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(2px)',
				},
				content: {
					position: 'relative',
					inset: 'unset',
					margin: '0',
					maxWidth: '700px',
					width: '90%',
					maxHeight: '90vh',
					overflowY: 'auto',
					borderRadius: '12px',
					padding: '30px',
					backgroundColor: 'white',
				},
			}}
			contentLabel={t('logs.supervisorConfig') || 'Konfiguracja przełożonego'}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
				<h2 style={{ 
					margin: 0,
					color: '#2c3e50',
					fontSize: '24px',
					fontWeight: '600'
				}}>
					{t('logs.supervisorConfig') || 'Konfiguracja przełożonego'}
				</h2>
				<button
					onClick={onClose}
					style={{
						background: 'transparent',
						border: 'none',
						fontSize: '28px',
						cursor: 'pointer',
						color: '#7f8c8d',
						lineHeight: '1',
						padding: '0',
						width: '30px',
						height: '30px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
					onMouseEnter={(e) => e.target.style.color = '#2c3e50'}
					onMouseLeave={(e) => e.target.style.color = '#7f8c8d'}>
					×
				</button>
			</div>

			{isLoading ? (
				<div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
					<Loader />
				</div>
			) : (
				<form onSubmit={handleSubmit}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
						{/* Może zatwierdzać urlopy */}
						<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '15px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
							<input
								type="checkbox"
								checked={permissions.canApproveLeaves}
								onChange={() => handlePermissionChange('canApproveLeaves')}
								style={{ marginRight: '12px', transform: 'scale(1.3)' }}
							/>
							<span style={{ color: '#2c3e50', fontSize: '16px', fontWeight: '500' }}>
								{t('logs.canApproveLeaves') || 'Może zatwierdzać urlopy'}
							</span>
						</label>

						{/* Może przeglądać ewidencję czasu pracy */}
						<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '15px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
							<input
								type="checkbox"
								checked={permissions.canViewTimesheets}
								onChange={() => handlePermissionChange('canViewTimesheets')}
								style={{ marginRight: '12px', transform: 'scale(1.3)' }}
							/>
							<span style={{ color: '#2c3e50', fontSize: '16px', fontWeight: '500' }}>
								{t('logs.canViewTimesheets') || 'Może przeglądać ewidencję czasu pracy'}
							</span>
						</label>

						{/* Może zarządzać grafikiem */}
						<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '15px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
							<input
								type="checkbox"
								checked={permissions.canManageSchedule}
								onChange={() => handlePermissionChange('canManageSchedule')}
								style={{ marginRight: '12px', transform: 'scale(1.3)' }}
							/>
							<span style={{ color: '#2c3e50', fontSize: '16px', fontWeight: '500' }}>
								{t('logs.canManageSchedule') || 'Może zarządzać grafikiem'}
							</span>
						</label>
					</div>

					<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px' }}>
						<button
							type="button"
							onClick={onClose}
							style={{
								padding: '10px 20px',
								border: '1px solid #bdc3c7',
								borderRadius: '6px',
								backgroundColor: 'white',
								color: '#2c3e50',
								cursor: 'pointer',
								fontSize: '16px',
								fontWeight: '500'
							}}>
							{t('boards.cancel') || 'Anuluj'}
						</button>
						<button
							type="submit"
							disabled={updateConfigMutation.isPending}
							style={{
								padding: '10px 20px',
								border: 'none',
								borderRadius: '6px',
								backgroundColor: '#3498db',
								color: 'white',
								cursor: updateConfigMutation.isPending ? 'not-allowed' : 'pointer',
								fontSize: '16px',
								fontWeight: '500',
								opacity: updateConfigMutation.isPending ? 0.6 : 1
							}}>
							{updateConfigMutation.isPending ? (t('schedule.updating') || 'Aktualizowanie...') : (t('schedule.save') || 'Zapisz')}
						</button>
					</div>
				</form>
			)}
		</Modal>
	)
}

export default SupervisorConfigModal

