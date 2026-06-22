import React, { useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { useUsers, useUpdateUserRoles, useDeleteUser, useResendPasswordLink, useSendApologyEmail, useDeletedUsers, useRestoreUser, usePermanentlyDeleteUser } from '../../hooks/useUsers'
import { useDepartments, useCreateDepartment, useDeleteDepartment, useDepartmentUsers } from '../../hooks/useDepartments'
import { useUserLogs, useAllLogs } from '../../hooks/useLogs'
import { useDeleteTeam, usePermanentlyDeleteTeam, useTeamInfo } from '../../hooks/useTeam'
import {
	useBillingSuperPaidPlanTeams,
	useBillingSuperStripePaidPlanTeams,
	useBillingSuperThankPurchaseEmail,
} from '../../hooks/useBilling'
import UsersInfoModal from '../shared/UsersInfoModal'
import SupervisorConfigModal from './SupervisorConfigModal'
import SubordinatesModal from './SubordinatesModal'
import SuperAdminActivityPanel from '../admin/SuperAdminActivityPanel'

const PAID_PLAN_LABELS = {
	starter: 'Starter',
	pro: 'Pro',
	business: 'Business',
	enterprise: 'Enterprise',
}

const WORKER_ROLE = 'Pracownik (Worker)'
const isManagedNoAccessUser = user =>
	user?.appAccessEnabled === false ||
	user?.managedOnly === true ||
	String(user?.username || '').endsWith('@no-access.planopia.local')

function Logs() {
	const [expandedLogs, setExpandedLogs] = useState([])
	const [editingUser, setEditingUser] = useState(null)
	const [editedRoles, setEditedRoles] = useState([])
	const [editedPosition, setEditedPosition] = useState('')
	const [error, setError] = useState('')
	const { t, i18n } = useTranslation()
	const [editedDepartments, setEditedDepartments] = useState([]) // Tablica działów - użytkownik może być w wielu działach
	const [departmentMode, setDepartmentMode] = useState('choose')
	const [newDepartmentName, setNewDepartmentName] = useState('') // Nowy dział do dodania
	// Stany dla sekcji działów na górze
	const [globalDepartmentMode, setGlobalDepartmentMode] = useState('choose')
	const [globalNewDepartmentName, setGlobalNewDepartmentName] = useState('')
	const { role, username, teamId, refreshUserData } = useAuth()
	const navigate = useNavigate()
	const { showAlert, showConfirm } = useAlert()
	const [deleteModal, setDeleteModal] = useState({ show: false, user: null })
	const [resendingLink, setResendingLink] = useState(false)
	const [sendingApology, setSendingApology] = useState(false)
	const [usersInfoModal, setUsersInfoModal] = useState({ isOpen: false, departmentName: null })
	const [roleInfoModal, setRoleInfoModal] = useState({ isOpen: false, roleName: null })
	const [supervisorConfigModal, setSupervisorConfigModal] = useState({ isOpen: false, userId: null })
	const [subordinatesModal, setSubordinatesModal] = useState({ isOpen: false, userId: null })
	const [expandedRoleDescriptions, setExpandedRoleDescriptions] = useState({}) // Stan dla rozwiniętych opisów ról
	const [deleteTeamModal, setDeleteTeamModal] = useState(false)
	const [permanentlyDeleteTeamModal, setPermanentlyDeleteTeamModal] = useState(false)
	const deleteTeamMutation = useDeleteTeam()
	const permanentlyDeleteTeamMutation = usePermanentlyDeleteTeam()
	const [activeTab, setActiveTab] = useState('active') // 'active' or 'deleted'
	const [deletedUsersModal, setDeletedUsersModal] = useState(false)
	const { data: deletedUsers = [], isLoading: loadingDeletedUsers } = useDeletedUsers()
	const restoreUserMutation = useRestoreUser()
	const permanentlyDeleteUserMutation = usePermanentlyDeleteUser()

	const isAdmin = role && role.includes('Admin')
	const isSuperAdmin = username === 'michalipka1@gmail.com'
	const isEnglish = i18n.language === 'en'

	const { data: paidPlanTeams = [], isLoading: loadingPaidPlanTeams } = useBillingSuperPaidPlanTeams(isSuperAdmin)
	const { data: stripePaidPlanTeams = [], isLoading: loadingStripePaidPlanTeams } =
		useBillingSuperStripePaidPlanTeams(isSuperAdmin)
	const thankPurchaseMutation = useBillingSuperThankPurchaseEmail()
	const [thankEmailBusy, setThankEmailBusy] = useState(null)

	const sendPurchaseThankEmail = async ({ busyKey, toEmail, teamName }) => {
		if (!toEmail) {
			await showAlert(t('logs.purchaseThankError'))
			return
		}
		setThankEmailBusy(busyKey)
		try {
			await thankPurchaseMutation.mutateAsync({ toEmail, teamName })
			await showAlert(t('logs.purchaseThankSent'))
		} catch {
			await showAlert(t('logs.purchaseThankError'))
		} finally {
			setThankEmailBusy(null)
		}
	}

	const availableRoles = [
		'Admin',
		WORKER_ROLE,
		'Przełożony (Supervisor)',
		'HR',
	]

	// Definicje ról z opisami
	const roleDefinitions = {
		'Admin': {
			pl: 'Pełny dostęp do wszystkich funkcji systemu. Może zarządzać użytkownikami, rolami, działami i wszystkimi zasobami.',
			en: 'Full access to all system functions. Can manage users, roles, departments and all resources.'
		},
		'Pracownik (Worker)': {
			pl: 'Podstawowa rola pracownika. Może przeglądać własne dane, składać wnioski urlopowe, ewidencjonować własny czas pracy oraz korzystać z funkcji aplikacji takich jak tablice zadań, czat i inne.',
			en: 'Basic employee role. Can view own data, submit leave requests, record own work time and use application features such as task boards, chat and others.'
		},
		'Przełożony (Supervisor)': {
			pl: 'Rola przełożonego z możliwością konfiguracji uprawnień. Może zatwierdzać urlopy, przeglądać ewidencję czasu pracy i zarządzać grafikiem dla swojego działu oraz/lub wybranych pracowników.',
			en: 'Supervisor role with configurable permissions. Can approve leaves, view timesheets and manage schedules for their department and/or selected employees.'
		},
		'HR': {
			pl: 'Rola HR. Może przeglądać wszystkie wnioski urlopowe i ewidencje czasu pracy wszystkich pracowników w zespole. Może również ustalać i sprawdzać grafiki pracy.',
			en: 'HR role. Can view all leave requests and timesheets of all employees in the team. Can also manage and review work schedules.'
		}
	}

	// TanStack Query hooks
	const { data: users = [], isLoading: loadingUsers } = useUsers()
	const { data: allLogs = [], isLoading: loadingAllLogs } = useAllLogs(isSuperAdmin)
	const allLogsSorted = [...allLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
	// Pobierz działy dla edytowanego użytkownika (jeśli edytujemy) lub dla własnego zespołu
	const editingUserTeamId = editingUser?.teamId || teamId
	const { data: departments = [], refetch: refetchDepartments } = useDepartments(editingUserTeamId)
	// Pobierz działy dla sekcji na górze (zawsze dla własnego zespołu)
	const { data: globalDepartments = [], refetch: refetchGlobalDepartments } = useDepartments(teamId)
	
	// Nazwa zespołu widzącego: viewerTeamName (API) lub teamName wiersza — po zmianach API zawsze dla własnego zespołu admina
	const displayTeamName =
		users.length > 0 ? users[0].viewerTeamName ?? users[0].teamName ?? null : null
	const updateUserRolesMutation = useUpdateUserRoles()
	const deleteUserMutation = useDeleteUser()
	const createDepartmentMutation = useCreateDepartment()
	const deleteDepartmentMutation = useDeleteDepartment()
	const resendPasswordLinkMutation = useResendPasswordLink()
	const sendApologyEmailMutation = useSendApologyEmail()
	// Hook dla użytkowników działu w modalu
	const { data: departmentUsers = [], isLoading: loadingDepartmentUsers } = useDepartmentUsers(
		usersInfoModal.departmentName,
		teamId,
		usersInfoModal.isOpen
	)

	const loading = loadingUsers

	const getUserDisplayName = user => {
		const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
		if (fullName) return fullName

		if (user?.appAccessEnabled === false || user?.managedOnly === true) {
			return isEnglish ? 'No-access employee' : 'Pracownik bez dostępu'
		}

		return user?.username || (isEnglish ? 'Unknown user' : 'Nieznany użytkownik')
	}

	const handleExpandLogs = userId => {
		if (expandedLogs.includes(userId)) {
			setExpandedLogs(expandedLogs.filter(id => id !== userId))
		} else {
			setExpandedLogs([...expandedLogs, userId])
		}
	}

	// Komponent do renderowania logów dla użytkownika (desktop)
	const UserLogsTable = ({ userId }) => {
		const { data: logs = [] } = useUserLogs(userId)
		return (
			<>
				{logs.map((log, logIndex) => (
					<tr key={log._id} style={{ 
						backgroundColor: logIndex % 2 === 0 ? '#ffffff' : '#f8f9fa'
					}}>
						<td style={{ 
							padding: '15px', 
							fontWeight: '500', 
							color: '#2c3e50'
						}}>
							{log.action}
						</td>
						<td style={{ 
							padding: '15px', 
							color: '#7f8c8d'
						}}>
							{log.details}
						</td>
						<td style={{ 
							padding: '15px', 
							color: '#95a5a6', 
							fontSize: '14px'
						}}>
							{new Date(log.timestamp).toLocaleString()}
						</td>
					</tr>
				))}
			</>
		)
	}

	// Komponent do renderowania logów dla użytkownika (mobile)
	const UserLogsCards = ({ userId }) => {
		const { data: logs = [] } = useUserLogs(userId)
		return (
			<>
				{logs.map((log, logIndex) => (
					<div key={log._id} style={{ 
						padding: '15px',
						borderBottom: logIndex < logs.length - 1 ? '1px solid #e9ecef' : 'none',
						backgroundColor: logIndex % 2 === 0 ? '#ffffff' : '#f8f9fa'
					}}>
						<div style={{ 
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							marginBottom: '8px',
							flexWrap: 'wrap',
							gap: '10px'
						}}>
							<div style={{ 
								fontWeight: '600', 
								color: '#2c3e50',
								fontSize: '14px'
							}}>
								{log.action}
							</div>
							<div style={{ 
								color: '#95a5a6', 
								fontSize: '12px',
								whiteSpace: 'nowrap'
							}}>
								{new Date(log.timestamp).toLocaleString()}
							</div>
						</div>
						<div style={{ 
							color: '#7f8c8d',
							fontSize: '14px',
							lineHeight: '1.4'
						}}>
							{log.details}
						</div>
					</div>
				))}
			</>
		)
	}

	const handleEditClick = user => {
		// console.log('handleEditClick called for user:', user)
		// console.log('user.department:', user.department)
		// console.log('user.roles:', user.roles)
		// console.log('user.department type:', typeof user.department)
		// console.log('user.department === null:', user.department === null)
		// console.log('user.department === undefined:', user.department === undefined)
		
		setEditingUser(editingUser?._id === user._id ? null : user)
		setEditedRoles(isManagedNoAccessUser(user) ? [WORKER_ROLE] : (user.roles || []))
		setEditedPosition(user.position || '')
		
		// Dla wielu działów - upewnij się, że to tablica
		const userDepartments = Array.isArray(user.department) 
			? user.department 
			: (user.department ? [user.department] : [])
		setEditedDepartments(userDepartments)
		
		setDepartmentMode('choose')  // Zawsze zaczynaj od trybu wyboru
		setNewDepartmentName('')  // Resetuj nazwę nowego działu
	}

	const handleRoleChange = role => {
		if (isManagedNoAccessUser(editingUser)) {
			setEditedRoles([WORKER_ROLE])
			return
		}
		setEditedRoles(prevRoles => (prevRoles.includes(role) ? prevRoles.filter(r => r !== role) : [...prevRoles, role]))
	}

	const handleDepartmentToggle = (dept) => {
		setEditedDepartments(prev => 
			prev.includes(dept) 
				? prev.filter(d => d !== dept) // Usuń jeśli już jest
				: [...prev, dept] // Dodaj jeśli nie ma
		)
	}

	const handleAddNewDepartment = async () => {
		const value = newDepartmentName.trim()
		
		// Walidacja długości
		if (value.length < 2) {
			await showAlert('Nazwa działu musi mieć minimum 2 znaki')
			return
		}
		if (value.length > 100) {
			await showAlert('Nazwa działu może mieć maksimum 100 znaków')
			return
		}
		
		if (!value) {
			return
		}
		
		// Użyj teamId użytkownika, którego edytujemy (nie super admina)
		const userTeamId = editingUser?.teamId || teamId
		
		if (!userTeamId) {
			await showAlert('Błąd: Nie można określić zespołu użytkownika')
			return
		}
		
		// Sprawdź czy dział już istnieje
		if (departments.includes(value)) {
			await showAlert('Dział o tej nazwie już istnieje')
			return
		}
		
		// Sprawdź czy dział już jest w edytowanych działach
		if (editedDepartments.includes(value)) {
			await showAlert('Dział już został dodany')
			return
		}
		
		try {
			// Utwórz nowy dział w bazie jeśli nie istnieje
			if (!departments.includes(value)) {
				await createDepartmentMutation.mutateAsync({ name: value, teamId: userTeamId })
				// Odśwież listę działów
				await refetchDepartments()
			}
			
			// Dodaj do wybranych działów
			setEditedDepartments([...editedDepartments, value])
			setNewDepartmentName('')
			setDepartmentMode('choose')
			await showAlert('Dział został dodany pomyślnie')
		} catch (error) {
			console.error('Error creating department:', error)
			const errorMessage = error.response?.data?.message || 'Błąd podczas tworzenia działu'
			await showAlert(errorMessage)
		}
	}

	const handleDeleteDepartment = async (deptName) => {
		const confirmed = await showConfirm(t('newuser.deleteDepartmentConfirm'))
		if (!confirmed) return

		try {
			// Użyj teamId użytkownika, którego edytujemy (nie super admina)
			const userTeamId = editingUser?.teamId || teamId
			
			if (!userTeamId) {
				await showAlert('Błąd: Nie można określić zespołu użytkownika')
				return
			}
			
			await deleteDepartmentMutation.mutateAsync({ name: deptName, teamId: userTeamId })
			// Usuń dział z edytowanych działów jeśli był zaznaczony
			setEditedDepartments(prev => prev.filter(d => d !== deptName))
			// Odśwież również globalną listę działów
			await refetchGlobalDepartments()
			await showAlert(t('newuser.deleteDepartmentSuccess'))
		} catch (error) {
			console.error('Error deleting department:', error)
			await showAlert(t('newuser.deleteDepartmentError'))
		}
	}

	// Funkcja do dodawania działu w sekcji na górze
	const handleAddGlobalDepartment = async () => {
		const value = globalNewDepartmentName.trim()
		
		// Walidacja długości
		if (value.length < 2) {
			await showAlert('Nazwa działu musi mieć minimum 2 znaki')
			return
		}
		if (value.length > 100) {
			await showAlert('Nazwa działu może mieć maksimum 100 znaków')
			return
		}
		
		if (!value) {
			return
		}
		
		if (!teamId) {
			await showAlert('Błąd: Nie można określić zespołu')
			return
		}
		
		// Sprawdź czy dział już istnieje
		if (globalDepartments.includes(value)) {
			await showAlert('Dział o tej nazwie już istnieje')
			return
		}
		
		try {
			// Utwórz nowy dział w bazie
			await createDepartmentMutation.mutateAsync({ name: value, teamId })
			// Odśwież listę działów
			await refetchGlobalDepartments()
			setGlobalNewDepartmentName('')
			setGlobalDepartmentMode('choose')
			await showAlert('Dział został dodany pomyślnie')
		} catch (error) {
			console.error('Error creating department:', error)
			const errorMessage = error.response?.data?.message || 'Błąd podczas tworzenia działu'
			await showAlert(errorMessage)
		}
	}

	// Funkcja do usuwania działu z sekcji na górze
	const handleDeleteGlobalDepartment = async (deptName) => {
		const confirmed = await showConfirm(t('newuser.deleteDepartmentConfirm'))
		if (!confirmed) return

		try {
			if (!teamId) {
				await showAlert('Błąd: Nie można określić zespołu')
				return
			}
			
			await deleteDepartmentMutation.mutateAsync({ name: deptName, teamId })
			await refetchGlobalDepartments()
			await showAlert(t('newuser.deleteDepartmentSuccess'))
		} catch (error) {
			console.error('Error deleting department:', error)
			await showAlert(t('newuser.deleteDepartmentError'))
		}
	}

	const handleSaveRoles = async userId => {
		try {
			// Użyj teamId użytkownika, którego edytujemy (nie super admina)
			const userTeamId = editingUser?.teamId || teamId
			
			if (!userTeamId) {
				await showAlert('Błąd: Nie można określić zespołu użytkownika')
				return
			}
			
			// Walidacja długości działów przed zapisem
			const invalidDepartments = editedDepartments.filter(dept => dept.length < 2 || dept.length > 100)
			if (invalidDepartments.length > 0) {
				await showAlert('Niektóre działy mają nieprawidłową długość (minimum 2, maksimum 100 znaków)')
				return
			}

			const canEditManagedPosition = isManagedNoAccessUser(editingUser)
			const normalizedPosition = canEditManagedPosition ? editedPosition.trim() : undefined
			if (normalizedPosition !== undefined && normalizedPosition.length > 100) {
				await showAlert('Stanowisko może mieć maksimum 100 znaków')
				return
			}
			
			// Sprawdź czy są nowe działy, które nie istnieją w liście działów
			const newDepartments = editedDepartments.filter(dept => !departments.includes(dept))
			
			// Utwórz nowe działy jeśli istnieją - używając teamId użytkownika
			if (newDepartments.length > 0) {
				for (const deptName of newDepartments) {
					try {
						await createDepartmentMutation.mutateAsync({ name: deptName, teamId: userTeamId })
					} catch (error) {
						console.error(`Error creating department ${deptName}:`, error)
						const errorMessage = error.response?.data?.message || `Błąd podczas tworzenia działu "${deptName}"`
						await showAlert(errorMessage)
						// Nie kontynuuj jeśli wystąpił błąd
						return
					}
				}
			}
			
			// Zaktualizuj użytkownika z nowymi rolami i działami (tablica)
			await updateUserRolesMutation.mutateAsync({
				userId,
				roles: isManagedNoAccessUser(editingUser) ? [WORKER_ROLE] : editedRoles,
				department: editedDepartments, // Wyślij tablicę działów
				...(normalizedPosition !== undefined ? { position: normalizedPosition } : {}),
			})
			
			// Jeśli zmieniamy role zalogowanego użytkownika, odśwież AuthContext
			if (editingUser?._id && editingUser.username === username) {
				await refreshUserData()
			}
			
			// Resetuj tryb do wyboru działu i odśwież listę
			setDepartmentMode('choose')
			setEditingUser(null)
			await showAlert(t('logs.alert'))
		} catch (error) {
			console.error('Error updating roles/department:', error)
			const code = error.response?.data?.code
			let errorMessage = t('logs.alerttwo')
			
			// Sprawdź czy to błąd walidacji ról
			if (code === 'ROLES_CONFLICT_HR' || code === 'ROLES_CONFLICT_ALL') {
				const translationKey = code === 'ROLES_CONFLICT_HR' ? 'logs.errorRolesConflict' : 'logs.errorAllRolesConflict'
				errorMessage = t(translationKey)
			} else if (error.response?.data?.message) {
				// Jeśli serwer zwrócił przetłumaczony komunikat, użyj go
				errorMessage = error.response.data.message
			}
			
			setError(errorMessage)
			await showAlert(errorMessage)
		}
	}

	const handleDeleteClick = (user) => {
		setDeleteModal({ show: true, user })
	}

	const handleDeleteCancel = () => {
		setDeleteModal({ show: false, user: null })
	}

	const handleDeleteConfirm = async () => {
		if (!deleteModal.user) return
		
		try {
			const response = await deleteUserMutation.mutateAsync({
				userId: deleteModal.user._id,
				teamId: deleteModal.user.teamId || teamId // Użyj teamId usuwanego użytkownika lub własnego teamId
			})
			
			// Sprawdź czy użytkownik usunął siebie
			if (response?.selfDeleted) {
				// Wyloguj użytkownika
				await showAlert(t('logs.deleteSelfSuccess'))
				window.location.href = '/login'
				return
			}
			
			await showAlert(response?.message || t('logs.deleteSuccess'))
			setDeleteModal({ show: false, user: null })
		} catch (error) {
			const errorMessage = error.response?.data?.message || t('logs.deleteError')
			await showAlert(errorMessage)
			console.error('Error deleting user:', error)
		}
	}

	const handleResendPasswordLink = async (userId) => {
		const confirmed = await showConfirm('Czy na pewno chcesz wysłać ponownie link do ustawienia hasła?')
		if (!confirmed) {
			return
		}

		setResendingLink(true)
		try {
			const response = await resendPasswordLinkMutation.mutateAsync(userId)
			await showAlert(response.message || 'Link został wysłany pomyślnie')
		} catch (error) {
			const errorMessage = error.response?.data?.message || 'Błąd podczas wysyłania linku'
			await showAlert(errorMessage)
			console.error('Error resending password link:', error)
		} finally {
			setResendingLink(false)
		}
	}

	const handleSendApologyEmail = async (userId) => {
		const confirmed = await showConfirm('Czy na pewno chcesz wysłać email informacyjny z przeprosinami?')
		if (!confirmed) {
			return
		}

		setSendingApology(true)
		try {
			const response = await sendApologyEmailMutation.mutateAsync(userId)
			await showAlert(response.message || 'Email został wysłany pomyślnie')
		} catch (error) {
			const errorMessage = error.response?.data?.message || 'Błąd podczas wysyłania emaila'
			await showAlert(errorMessage)
			console.error('Error sending apology email:', error)
		} finally {
			setSendingApology(false)
		}
	}

	return (
		<>
			<Sidebar />

			<div className="logs-container" style={{ 
				maxWidth: '1200px', 
				margin: '0 auto'
			}}>
				{/* Nagłówek */}
				<div className="logs-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
					<h2 style={{ 
						color: '#2c3e50', 
						marginBottom: '20px',
						fontSize: '28px',
						fontWeight: '600',
						textAlign: 'left'
					}}>
						<img src="img/contact-list.png" alt="ikonka w sidebar" />
						{t('logs.title')}
						{displayTeamName ? `: ${displayTeamName}` : ''}
					</h2>
					<hr />
					{isSuperAdmin && (
						<p style={{ 
							color: '#7f8c8d', 
							fontSize: '16px',
							marginTop: '10px'
						}}>
							Super Admin - Wszyscy użytkownicy
						</p>
					)}
				</div>

				{/* Sekcja ról z opisami */}
				<div style={{ 
					backgroundColor: 'white',
					borderRadius: '12px',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					padding: '15px',
					marginBottom: '30px'
				}}>
					<h3 style={{ 
						color: '#2c3e50',
						marginBottom: '20px',
						fontSize: '20px',
						fontWeight: '600',
						paddingBottom: '10px',
						borderBottom: '2px solid #00a846'
					}}>
						{t('logs.rolesTitle') || 'Role w systemie'}
					</h3>
					<div style={{ 
						display: 'grid', 
						gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
						gap: '15px'
					}}>
						{availableRoles.map(role => (
							<div key={role} style={{ 
								padding: '15px',
								backgroundColor: '#f8f9fa',
								borderRadius: '8px',
								border: '1px solid #dee2e6',
								display: 'flex',
								alignItems: 'flex-start',
								justifyContent: 'space-between',
								gap: '10px'
							}}>
								<div style={{ flex: 1 }}>
									<div style={{ 
										fontWeight: '600', 
										color: role === 'Przełożony (Supervisor)' ? '#27ae60' : '#2c3e50',
										marginBottom: '8px',
										fontSize: '16px'
									}}>
										{role}
									</div>
									{(() => {
										const description = roleDefinitions[role]?.[i18n.resolvedLanguage] || roleDefinitions[role]?.['pl'] || ''
										const isExpanded = expandedRoleDescriptions[role]
										const maxLength = 80 // Maksymalna długość przed zwinięciem
										const shouldTruncate = description.length > maxLength
										const displayText = isExpanded || !shouldTruncate 
											? description 
											: description.substring(0, maxLength) + '...'
										
										return (
											<div>
												<div style={{ 
													fontSize: '13px', 
													color: role === 'Przełożony (Supervisor)' ? '#27ae60' : '#7f8c8d',
													lineHeight: '1.5',
													marginBottom: shouldTruncate ? '5px' : '0',
													fontWeight: role === 'Przełożony (Supervisor)' ? '500' : 'normal'
												}}>
													{displayText}
												</div>
												{shouldTruncate && (
													<button
														type="button"
														onClick={() => setExpandedRoleDescriptions(prev => ({
															...prev,
															[role]: !prev[role]
														}))}
														style={{
															background: 'transparent',
															border: 'none',
															color: '#00a846',
															cursor: 'pointer',
															padding: '0',
															fontSize: '13px',
															textDecoration: 'underline',
															marginTop: '5px'
														}}
													>
														{isExpanded ? t('common.showLess') || 'Pokaż mniej' : t('common.showMore') || 'Pokaż więcej'}
													</button>
												)}
											</div>
										)
									})()}
								</div>
								<button
									type="button"
									onClick={() => setRoleInfoModal({ isOpen: true, roleName: role })}
									style={{
										background: 'transparent',
										border: 'none',
										color: '#00a846',
										cursor: 'pointer',
										padding: '4px 8px',
										borderRadius: '4px',
										fontSize: '18px',
										lineHeight: '1',
										transition: 'all 0.2s',
										flexShrink: 0
									}}
									onMouseEnter={(e) => {
										e.target.style.backgroundColor = '#e3f2fd'
										e.target.style.color = '#2980b9'
									}}
									onMouseLeave={(e) => {
										e.target.style.backgroundColor = 'transparent'
										e.target.style.color = '#00a846'
									}}
									title={t('logs.roleInfo') || 'Informacje o roli'}
								>
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
										<path d="M8 12V8M8 4H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
									</svg>
								</button>
							</div>
						))}
					</div>
				</div>

				{/* Sekcja działów */}
				<div style={{ 
					backgroundColor: 'white',
					borderRadius: '12px',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					padding: '15px',
					marginBottom: '30px'
				}}>
					<h3 style={{ 
						color: '#2c3e50',
						marginBottom: '20px',
						fontSize: '20px',
						fontWeight: '600',
						paddingBottom: '10px',
						borderBottom: '2px solid #00a846'
					}}>
						{t('logs.departmentsTitle')}
					</h3>
					
					{/* Tryb wyboru z listy */}
					{globalDepartmentMode === 'choose' && (
						<div>
							{!globalDepartments || globalDepartments.length === 0 ? (
								<div style={{ 
									backgroundColor: '#fff3cd', 
									padding: '15px', 
									borderRadius: '6px', 
									border: '1px solid #ffeaa7',
									color: '#856404',
									marginBottom: '15px'
								}}>
									{t('logs.noDepartments')}
								</div>
							) : (
								<div style={{ 
									display: 'grid', 
									gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
									gap: '10px',
									marginBottom: '15px'
								}}>
									{globalDepartments.map((dep) => {
										const depName = typeof dep === 'object' ? dep.name : dep;
										return (
											<div key={depName} style={{ 
												display: 'flex', 
												alignItems: 'center',
												justifyContent: 'space-between',
												padding: '12px',
												backgroundColor: '#f8f9fa',
												borderRadius: '6px',
												border: '1px solid #dee2e6',
												transition: 'all 0.2s'
											}}>
												<span style={{ fontSize: '14px', color: '#2c3e50' }}>{depName}</span>
												<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
													<button
														type="button"
														onClick={() => setUsersInfoModal({ isOpen: true, departmentName: depName })}
														style={{
															background: 'transparent',
															border: 'none',
															color: '#00a846',
															cursor: 'pointer',
															padding: '4px 8px',
															borderRadius: '4px',
															fontSize: '16px',
															lineHeight: '1',
															transition: 'all 0.2s',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center'
														}}
														onMouseEnter={(e) => {
															e.target.style.backgroundColor = '#ebf5fb'
															e.target.style.color = '#2980b9'
														}}
														onMouseLeave={(e) => {
															e.target.style.backgroundColor = 'transparent'
															e.target.style.color = '#00a846'
														}}
														title={t('usersInfo.viewUsers') || 'Zobacz użytkowników'}
													>
														<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
															<circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
															<path d="M8 12V8M8 4H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
														</svg>
													</button>
													{isAdmin && (
														<button
															type="button"
															onClick={() => handleDeleteGlobalDepartment(depName)}
															style={{
																background: 'transparent',
																border: 'none',
																color: '#dc3545',
																cursor: 'pointer',
																padding: '4px 8px',
																borderRadius: '4px',
																fontSize: '18px',
																lineHeight: '1',
																transition: 'all 0.2s'
															}}
															onMouseEnter={(e) => {
																e.target.style.backgroundColor = '#f8d7da'
																e.target.style.color = '#721c24'
															}}
															onMouseLeave={(e) => {
																e.target.style.backgroundColor = 'transparent'
																e.target.style.color = '#dc3545'
															}}
															title={t('newuser.deleteDepartmentConfirm')}
														>
															×
														</button>
													)}
												</div>
											</div>
										);
									})}
								</div>
							)}
							
							<button
								type="button"
								className="btn btn-outline-primary"
								onClick={() => {
									setGlobalDepartmentMode('new')
									setGlobalNewDepartmentName('')
								}}
								style={{ 
									padding: '10px 20px',
									borderRadius: '6px',
									border: '1px solid #00a846',
									backgroundColor: 'transparent',
									color: '#00a846',
									transition: 'all 0.2s',
									fontSize: '14px',
									fontWeight: '500',
									cursor: 'pointer'
								}}>
								{t('newuser.department2')}
							</button>
						</div>
					)}
					
					{/* Tryb dodawania nowego działu */}
					{globalDepartmentMode === 'new' && (
						<div style={{ 
							backgroundColor: '#f8f9fa',
							padding: '20px',
							borderRadius: '8px',
							border: '2px solid #00a846'
						}}>
							<div style={{ marginBottom: '15px' }}>
								<label style={{ 
									display: 'block',
									marginBottom: '8px',
									fontWeight: '600',
									color: '#2c3e50'
								}}>
									{t('newuser.department2')}
								</label>
								<input
									type="text"
									placeholder={t('newuser.department4')}
									value={globalNewDepartmentName}
									onChange={(e) => setGlobalNewDepartmentName(e.target.value)}
									style={{ 
										width: '100%',
										maxWidth: '400px',
										padding: '12px',
										border: '1px solid #bdc3c7',
										borderRadius: '6px',
										fontSize: '16px',
										transition: 'border-color 0.2s'
									}}
								/>
								<small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
									{t('newuser.departmentPressSave')}
								</small>
							</div>
							
							<div style={{ display: 'flex', gap: '10px' }}>
								<button
									type="button"
									className="btn btn-primary"
									onClick={handleAddGlobalDepartment}
									disabled={!globalNewDepartmentName.trim()}
									style={{ 
										padding: '10px 20px',
										borderRadius: '6px',
										border: '1px solid #00a846',
										backgroundColor: '#00a846',
										color: 'white',
										cursor: globalNewDepartmentName.trim() ? 'pointer' : 'not-allowed',
										opacity: globalNewDepartmentName.trim() ? 1 : 0.5,
										fontSize: '14px',
										fontWeight: '500'
									}}>
									{t('newuser.departmentAddButton')}
								</button>
								<button
									type="button"
									className="btn btn-outline-primary"
									onClick={() => {
										setGlobalDepartmentMode('choose')
										setGlobalNewDepartmentName('')
									}}
									style={{ 
										padding: '10px 20px',
										borderRadius: '6px',
										border: '1px solid #00a846',
										backgroundColor: 'transparent',
										color: '#00a846',
										fontSize: '14px',
										fontWeight: '500',
										cursor: 'pointer'
									}}>
									{t('boards.cancel')}
								</button>
							</div>
						</div>
					)}
				</div>

				{error && (
					<div style={{ 
						backgroundColor: '#f8d7da', 
						color: '#721c24', 
						padding: '15px', 
						borderRadius: '8px', 
						marginBottom: '20px',
						border: '1px solid #f5c6cb'
					}}>
						{error}
					</div>
				)}

			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
				<div className="logs-content">
					{/* Zakładki dla aktywnych i usuniętych użytkowników */}
					{isAdmin && (
						<div style={{
							display: 'flex',
							gap: '10px',
							marginBottom: '20px',
							borderBottom: '2px solid #dee2e6',
							paddingBottom: '10px'
						}}>
							<button
								type="button"
								onClick={() => setActiveTab('active')}
								style={{
									padding: '10px 20px',
									borderRadius: '6px 6px 0 0',
									border: 'none',
									backgroundColor: activeTab === 'active' ? '#00a846' : 'transparent',
									color: activeTab === 'active' ? 'white' : '#495057',
									fontSize: '16px',
									fontWeight: '600',
									cursor: 'pointer',
									transition: 'all 0.2s',
									borderBottom: activeTab === 'active' ? '3px solid #2980b9' : 'none'
								}}
							>
								{t('logs.activeUsers') || 'Aktywni użytkownicy'}
							</button>
							<button
								type="button"
								onClick={() => {
									setActiveTab('deleted')
									setDeletedUsersModal(true)
								}}
								style={{
									padding: '10px 20px',
									borderRadius: '6px 6px 0 0',
									border: 'none',
									backgroundColor: activeTab === 'deleted' ? '#dc3545' : 'transparent',
									color: activeTab === 'deleted' ? 'white' : '#495057',
									fontSize: '16px',
									fontWeight: '600',
									cursor: 'pointer',
									transition: 'all 0.2s',
									borderBottom: activeTab === 'deleted' ? '3px solid #c82333' : 'none',
									position: 'relative'
								}}
							>
								{t('logs.deletedUsers') || 'Ostatnio usunięci'}
								{deletedUsers.length > 0 && (
									<span style={{
										marginLeft: '8px',
										backgroundColor: activeTab === 'deleted' ? 'rgba(255,255,255,0.3)' : '#dc3545',
										color: activeTab === 'deleted' ? 'white' : 'white',
										padding: '2px 8px',
										borderRadius: '12px',
										fontSize: '12px',
										fontWeight: '600'
									}}>
										{deletedUsers.length}
									</span>
								)}
							</button>
						</div>
					)}

					{isSuperAdmin && (
						<div style={{
							backgroundColor: 'white',
							borderRadius: '12px',
							boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
							overflow: 'hidden',
							marginBottom: '24px'
						}}>
							<div style={{
								padding: '16px 20px',
								borderBottom: '1px solid #e9ecef',
								backgroundColor: '#f8f9fa',
								fontWeight: '600',
								color: '#2c3e50'
							}}>
								{isEnglish ? 'All logs (newest first)' : 'Wszystkie logi (od najnowszych)'}
							</div>

							{loadingAllLogs ? (
								<div className="content-with-loader" style={{ padding: '20px' }}>
									<Loader />
								</div>
							) : (
								<>
									<div className="logs-desktop-view" style={{ display: 'none' }}>
										<table className="table" style={{ margin: 0 }}>
											<thead style={{ backgroundColor: '#f8f9fa' }}>
												<tr>
													<th style={{ padding: '14px 16px' }}>{isEnglish ? 'Time' : 'Czas'}</th>
													<th style={{ padding: '14px 16px' }}>{isEnglish ? 'Log name' : 'Nazwa logu'}</th>
													<th style={{ padding: '14px 16px' }}>{isEnglish ? 'User' : 'Użytkownik'}</th>
													<th style={{ padding: '14px 16px' }}>{isEnglish ? 'Team' : 'Zespół'}</th>
												</tr>
											</thead>
											<tbody>
												{allLogsSorted.map((log, index) => (
													<tr key={log._id || `${log.timestamp}-${index}`} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
														<td style={{ padding: '14px 16px', fontSize: '14px', color: '#6c757d' }}>{new Date(log.timestamp).toLocaleString()}</td>
														<td style={{ padding: '14px 16px', fontWeight: '600', color: '#2c3e50' }}>{log.action}</td>
														<td style={{ padding: '14px 16px' }}>{getUserDisplayName(log.user)}</td>
														<td style={{ padding: '14px 16px' }}>{log.user?.teamId?.name || (isEnglish ? 'No team' : 'Brak zespołu')}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>

									<div className="logs-mobile-view" style={{ display: 'block' }}>
										{allLogsSorted.map((log, index) => (
											<div
												key={log._id || `${log.timestamp}-mobile-${index}`}
												style={{
													padding: '14px 16px',
													borderBottom: index < allLogsSorted.length - 1 ? '1px solid #e9ecef' : 'none',
													backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
												}}
											>
												<div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '6px' }}>
													{new Date(log.timestamp).toLocaleString()}
												</div>
												<div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
													{isEnglish ? 'Log name' : 'Nazwa logu'}: {log.action}
												</div>
												<div style={{ fontSize: '14px', color: '#495057' }}>
													{isEnglish ? 'User' : 'Użytkownik'}: {getUserDisplayName(log.user)}
												</div>
												<div style={{ fontSize: '14px', color: '#495057' }}>
													{isEnglish ? 'Team' : 'Zespół'}: {log.user?.teamId?.name || (isEnglish ? 'No team' : 'Brak zespołu')}
												</div>
											</div>
										))}
									</div>
								</>
							)}
						</div>
					)}

					{/* Desktop view - tabela */}
					{activeTab === 'active' && (
						<React.Fragment>
						<div className="users-table-container logs-desktop-view" style={{ 
						backgroundColor: 'white', 
						borderRadius: '12px', 
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						overflow: 'hidden',
						display: 'none' // Ukrywamy na mobile
					}}>
						<table className="table" style={{ margin: 0 }}>
							<thead style={{ backgroundColor: '#f8f9fa' }}>
								<tr>
									<th style={{ 
										padding: '20px', 
										borderBottom: '2px solid #dee2e6',
										color: '#495057',
										fontWeight: '600'
									}}>
										{t('logs.user')}
									</th>
									<th style={{ 
										padding: '20px', 
										borderBottom: '2px solid #dee2e6',
										color: '#495057',
										fontWeight: '600',
										textAlign: 'center'
									}}>
										{t('logs.action')}
									</th>
								</tr>
							</thead>
							<tbody>
								{users.map((user, index) => (
							<React.Fragment key={user._id}>
								<tr style={{ 
									backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
									transition: 'background-color 0.2s'
								}}>
									<td style={{ 
										padding: '20px', 
										verticalAlign: 'middle'
									}}>
										<div style={{ 
											display: 'flex', 
											alignItems: 'center'
										}}>
											<div style={{ 
												width: '40px', 
												height: '40px', 
												borderRadius: '50%', 
												backgroundColor: '#00a846',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: 'white',
												fontWeight: 'bold',
												marginRight: '15px'
											}}>
												{getUserDisplayName(user).charAt(0).toUpperCase()}
											</div>
											<div>
												<div style={{ 
													fontWeight: '600', 
													color: '#2c3e50', 
													marginBottom: '5px'
												}}>
													{getUserDisplayName(user)}
												</div>
												{(user.firstName || user.lastName) && (
													<div style={{ 
														fontSize: '12px', 
														color: '#95a5a6',
														marginBottom: '3px',
														fontStyle: 'italic'
													}}>
														{`${user.firstName || ''} ${user.lastName || ''}`.trim()}
													</div>
												)}
												{user.position && (
													<div style={{ 
														fontSize: '11px', 
														color: '#95a5a6',
														marginBottom: '3px',
														fontStyle: 'italic'
													}}>
														{user.position}
													</div>
												)}
												{user.appAccessEnabled === false ? (
													<div style={{
														fontSize: '12px',
														color: '#6c757d',
														marginTop: '3px',
														fontWeight: '600'
													}}>
														{t('logs.noAppAccess')}
													</div>
												) : (isSuperAdmin || isAdmin) && !user.hasPassword && (
													<div style={{ 
														fontSize: '12px', 
														color: '#dc3545', 
														marginTop: '3px',
														fontWeight: '600'
													}}>
														{t('logs.noPassword')}
													</div>
												)}
											</div>
										</div>
									</td>
									<td style={{ 
										padding: '20px', 
										textAlign: 'center'
									}}>
										<div style={{ 
											display: 'flex', 
											gap: '10px', 
											justifyContent: 'center',
											alignItems: 'center'
										}}>
										<button
											className="btn btn-primary"
											onClick={() => handleEditClick(user)}
											style={{ 
												padding: '8px 16px',
												borderRadius: '6px',
												border: 'none',
												fontSize: '14px',
												fontWeight: '500',
												transition: 'all 0.2s',
												boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
											}}>
											{t('logs.rolebtn')}
										</button>
										<button
											className="btn btn-info"
											onClick={() => handleExpandLogs(user._id)}
											style={{ 
												padding: '8px 16px',
												borderRadius: '6px',
												border: 'none',
												fontSize: '14px',
												fontWeight: '500',
												transition: 'all 0.2s',
												boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
											}}>
											{t('logs.actionbtn')}
										</button>
										{user.appAccessEnabled !== false && (isSuperAdmin || isAdmin) && !user.hasPassword && (
											<button
												onClick={() => handleResendPasswordLink(user._id)}
												disabled={resendingLink}
												title="Wyślij ponownie link do ustawienia hasła"
												style={{ 
													padding: '8px 12px',
													borderRadius: '6px',
													border: 'none',
													backgroundColor: '#28a745',
													color: 'white',
													cursor: resendingLink ? 'not-allowed' : 'pointer',
													transition: 'all 0.2s',
													boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													opacity: resendingLink ? 0.6 : 1
												}}
												onMouseEnter={(e) => !resendingLink && (e.target.style.backgroundColor = '#218838')}
												onMouseLeave={(e) => !resendingLink && (e.target.style.backgroundColor = '#28a745')}>
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
													<path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
													<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
												</svg>
											</button>
										)}
										{isSuperAdmin && (user.username === 'klaudia.b.lubszczyk@gmail.com' || user.username === 'lipkam420@gmail.com') && (
											<button
												onClick={() => handleSendApologyEmail(user._id)}
												disabled={sendingApology}
												title="Wyślij email informacyjny z przeprosinami"
												style={{ 
													padding: '8px 12px',
													borderRadius: '6px',
													border: 'none',
													backgroundColor: '#ff9800',
													color: 'white',
													cursor: sendingApology ? 'not-allowed' : 'pointer',
													transition: 'all 0.2s',
													boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													opacity: sendingApology ? 0.6 : 1,
													marginLeft: '5px'
												}}
												onMouseEnter={(e) => !sendingApology && (e.target.style.backgroundColor = '#f57c00')}
												onMouseLeave={(e) => !sendingApology && (e.target.style.backgroundColor = '#ff9800')}>
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
													<path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z"/>
												</svg>
											</button>
										)}
										{(isAdmin || isSuperAdmin) && !user.isTeamAdmin && (
											<button
												onClick={() => handleDeleteClick(user)}
												title={t('logs.deleteUser')}
												style={{ 
													padding: '8px 12px',
													borderRadius: '6px',
													border: 'none',
													backgroundColor: '#dc3545',
													color: 'white',
													cursor: 'pointer',
													transition: 'all 0.2s',
													boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center'
												}}
												onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
												onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}>
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
													<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
													<path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
												</svg>
											</button>
										)}
													</div>
									</td>
								</tr>
								{editingUser?._id === user._id && (
									<tr>
										<td colSpan="2" style={{ padding: '0' }}>
											<div style={{ 
												backgroundColor: '#f8f9fa', 
												padding: '30px',
												borderTop: '1px solid #dee2e6'
											}}>
												<div style={{ maxWidth: '800px', margin: '0 auto' }}>
													<h4 style={{ 
														color: '#2c3e50', 
														marginBottom: '20px',
														paddingBottom: '10px',
														borderBottom: '2px solid #00a846'
													}}>
														{t('logs.editrole')}
													</h4>
													
													{/* Role */}
													<div style={{ marginBottom: '30px' }}>
														<h5 style={{ color: '#34495e', marginBottom: '15px' }}>{t('logs.userRolesLabel')}</h5>
														{isManagedNoAccessUser(editingUser) && (
															<p style={{
																margin: '0 0 12px',
																color: '#6b7280',
																fontSize: '14px',
															}}>
																{t('logs.managedOnlyWorkerRole')}
															</p>
														)}
														<div style={{ 
															display: 'grid', 
															gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
															gap: '10px'
														}}>
															{availableRoles.map(role => (
																<div key={role} style={{ 
																	display: 'flex',
																	flexDirection: 'column',
																	gap: '8px'
																}}>
																	<label style={{ 
																		display: 'flex', 
																		alignItems: 'center',
																		padding: '12px',
																		backgroundColor: 'white',
																		borderRadius: '6px',
																		border: '1px solid #dee2e6',
																		cursor: isManagedNoAccessUser(editingUser) ? 'not-allowed' : 'pointer',
																		transition: 'all 0.2s',
																		boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
																		opacity: isManagedNoAccessUser(editingUser) && role !== WORKER_ROLE ? 0.55 : 1,
																	}}>
																		<input
																			type="checkbox"
																			checked={isManagedNoAccessUser(editingUser) ? role === WORKER_ROLE : editedRoles.includes(role)}
																			disabled={isManagedNoAccessUser(editingUser)}
																			onChange={() => handleRoleChange(role)}
																			style={{ 
																				marginRight: '10px',
																				transform: 'scale(1.2)'
																			}}
																		/>
																		<span style={{ fontSize: '14px', flex: 1 }}>{role}</span>
																	</label>
																	{role === 'Przełożony (Supervisor)' && !isManagedNoAccessUser(editingUser) && editedRoles.includes(role) && editingUser?._id && (
																		<div style={{ 
																			display: 'flex', 
																			gap: '10px',
																			marginLeft: '32px',
																			marginTop: '8px',
																			padding: '12px',
																			backgroundColor: '#f8f9fa',
																			borderRadius: '8px',
																			border: '1px solid #e9ecef',
																			borderLeft: '4px solid #00a846'
																		}}>
																			<button
																				type="button"
																				onClick={() => setSupervisorConfigModal({ isOpen: true, userId: editingUser._id })}
																				style={{
																					padding: '8px 16px',
																					border: '1px solid #00a846',
																					borderRadius: '6px',
																					backgroundColor: '#00a846',
																					color: 'white',
																					cursor: 'pointer',
																					fontSize: '13px',
																					fontWeight: '600',
																					transition: 'all 0.2s',
																					boxShadow: '0 2px 4px rgba(0, 168, 70, 0.18)'
																				}}
																				onMouseEnter={(e) => {
																					e.target.style.backgroundColor = '#00963e'
																					e.target.style.borderColor = '#00963e'
																					e.target.style.boxShadow = '0 3px 6px rgba(0, 168, 70, 0.26)'
																					e.target.style.transform = 'translateY(-1px)'
																				}}
																				onMouseLeave={(e) => {
																					e.target.style.backgroundColor = '#00a846'
																					e.target.style.borderColor = '#00a846'
																					e.target.style.boxShadow = '0 2px 4px rgba(0, 168, 70, 0.18)'
																					e.target.style.transform = 'translateY(0)'
																				}}>
																				{t('logs.configure') || 'Konfiguruj'}
																			</button>
																			<button
																				type="button"
																				onClick={() => setSubordinatesModal({ isOpen: true, userId: editingUser._id })}
																				style={{
																					padding: '8px 16px',
																					border: '1px solid #27ae60',
																					borderRadius: '6px',
																					backgroundColor: '#27ae60',
																					color: 'white',
																					cursor: 'pointer',
																					fontSize: '13px',
																					fontWeight: '600',
																					transition: 'all 0.2s',
																					boxShadow: '0 2px 4px rgba(39, 174, 96, 0.2)'
																				}}
																				onMouseEnter={(e) => {
																					e.target.style.backgroundColor = '#229954'
																					e.target.style.borderColor = '#229954'
																					e.target.style.boxShadow = '0 3px 6px rgba(39, 174, 96, 0.3)'
																					e.target.style.transform = 'translateY(-1px)'
																				}}
																				onMouseLeave={(e) => {
																					e.target.style.backgroundColor = '#27ae60'
																					e.target.style.borderColor = '#27ae60'
																					e.target.style.boxShadow = '0 2px 4px rgba(39, 174, 96, 0.2)'
																					e.target.style.transform = 'translateY(0)'
																				}}>
																				{t('logs.manageSubordinatesButton') || 'Podwładni'}
																			</button>
																		</div>
																	)}
																</div>
															))}
														</div>
													</div>

													{isManagedNoAccessUser(editingUser) && (
														<div style={{ marginBottom: '30px' }}>
															<h5 style={{ color: '#34495e', marginBottom: '12px' }}>Stanowisko:</h5>
															<input
																type="text"
																value={editedPosition}
																onChange={(e) => setEditedPosition(e.target.value)}
																maxLength={100}
																placeholder="np. specjalista, koordynator, pracownik"
																style={{
																	width: '100%',
																	padding: '12px',
																	border: '1px solid #bdc3c7',
																	borderRadius: '8px',
																	backgroundColor: 'white',
																	fontSize: '15px',
																}}
															/>
															<small style={{ color: '#6c757d', display: 'block', marginTop: '6px' }}>
																Pole opcjonalne dla pracownika bez dostępu do aplikacji.
															</small>
														</div>
													)}

													{/* Dział */}
													<div style={{ marginBottom: '30px' }}>
														<h5 style={{ 
															color: '#34495e', 
															marginBottom: '15px'
														}}>
															{t('newuser.department5')}
														</h5>
														
														{/* Tryb wyboru z listy */}
														{departmentMode === 'choose' && (
															<div style={{ marginBottom: '20px' }}>
																

																
																{/* Sprawdź czy są departmenty */}
																													{!departments || departments.length === 0 ? (
														<div style={{ 
															backgroundColor: '#fff3cd', 
															padding: '15px', 
															borderRadius: '6px', 
															border: '1px solid #ffeaa7',
															color: '#856404',
															marginBottom: '15px'
														}}>
															{t('logs.noDepartments')}
														</div>
													) : (
																	<div style={{ 
																		display: 'grid', 
																		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
																		gap: '10px',
																		marginBottom: '15px'
																	}}>
																		{departments.map((dep) => {
																			// Upewnij się, że dep to string
																			const depName = typeof dep === 'object' ? dep.name : dep;
																			return (
																				<label key={depName} style={{ 
																					display: 'flex', 
																					alignItems: 'center',
																					justifyContent: 'space-between',
																					padding: '10px',
																					backgroundColor: 'white',
																					borderRadius: '6px',
																					border: '1px solid #dee2e6',
																					cursor: 'pointer',
																					transition: 'all 0.2s',
																					marginBottom: '8px'
																				}}>
																					<div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
																						<input
																							type="checkbox"
																							checked={editedDepartments.includes(depName)}
																							onChange={() => handleDepartmentToggle(depName)}
																							onClick={(e) => e.stopPropagation()}
																							style={{ marginRight: '10px', transform: 'scale(1.2)', cursor: 'pointer' }}
																						/>
																						<span>{depName}</span>
																					</div>
																					{isAdmin && (
																						<button
																							type="button"
																							onClick={(e) => {
																								e.stopPropagation()
																								handleDeleteDepartment(depName)
																							}}
																							style={{
																								background: 'transparent',
																								border: 'none',
																								color: '#dc3545',
																								cursor: 'pointer',
																								padding: '4px 8px',
																								borderRadius: '4px',
																								fontSize: '18px',
																								lineHeight: '1',
																								transition: 'all 0.2s',
																								marginLeft: '10px'
																							}}
																							onMouseEnter={(e) => {
																								e.target.style.backgroundColor = '#f8d7da'
																								e.target.style.color = '#721c24'
																							}}
																							onMouseLeave={(e) => {
																								e.target.style.backgroundColor = 'transparent'
																								e.target.style.color = '#dc3545'
																							}}
																							title={t('newuser.deleteDepartmentConfirm')}
																						>
																							×
																						</button>
																					)}
																				</label>
																			);
																		})}
																	</div>
																)}
																
																<button
																	type="button"
																	className="btn btn-outline-primary"
																	onClick={() => {
																		setDepartmentMode('new')
																		setNewDepartmentName('')
																	}}
																	style={{ 
																		padding: '8px 16px',
																		borderRadius: '6px',
																		border: '1px solid #00a846',
																		backgroundColor: 'transparent',
																		color: '#00a846',
																		transition: 'all 0.2s'
																	}}>
																	{t('newuser.department2')}
																</button>
															</div>
														)}
														
														{/* Tryb dodawania nowego działu */}
														{departmentMode === 'new' && (
															<div style={{ 
																backgroundColor: 'white',
																padding: '20px',
																borderRadius: '8px',
																border: '2px solid #00a846'
															}}>
																<div style={{ marginBottom: '15px' }}>
																	<label style={{ 
																		display: 'block',
																		marginBottom: '8px',
																		fontWeight: '600',
																		color: '#2c3e50'
																	}}>
																		{t('newuser.department2')}
																	</label>
																	<input
																		type="text"
																		placeholder={t('newuser.department4')}
																		value={newDepartmentName}
																		onChange={(e) => setNewDepartmentName(e.target.value)}
																		style={{ 
																			width: '100%',
																			padding: '12px',
																			border: '1px solid #bdc3c7',
																			borderRadius: '6px',
																			fontSize: '16px',
																			transition: 'border-color 0.2s'
																		}}
																	/>
																	<small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
																		{t('newuser.departmentPressSave')}
																	</small>
																</div>
																
																<div style={{ display: 'flex', gap: '10px' }}>
																	<button
																		type="button"
																		className="btn btn-primary"
																		onClick={handleAddNewDepartment}
																		disabled={!newDepartmentName.trim()}
																		style={{ 
																			padding: '8px 16px',
																			borderRadius: '6px',
																			border: '1px solid #00a846',
																			backgroundColor: '#00a846',
																			color: 'white',
																			cursor: newDepartmentName.trim() ? 'pointer' : 'not-allowed',
																			opacity: newDepartmentName.trim() ? 1 : 0.5
																		}}>
																		{t('newuser.departmentAddButton')}
																	</button>
																	<button
																		type="button"
																		className="btn btn-outline-primary"
																		onClick={() => {
																			setDepartmentMode('choose')
																			setNewDepartmentName('')
																		}}
																		style={{ 
																			padding: '8px 16px',
																			borderRadius: '6px',
																			border: '1px solid #00a846',
																			backgroundColor: 'transparent',
																			color: '#00a846'
																		}}>
																		{t('newuser.department3')}
																	</button>
																</div>
															</div>
														)}
													</div>

													{/* Przypomnienie o zapisaniu zmian */}
													<div style={{ 
														marginTop: '20px', 
														marginBottom: '15px',
														padding: '12px 16px',
														backgroundColor: '#fff3cd',
														border: '1px solid #ffc107',
														borderRadius: '6px',
														fontSize: '14px',
														color: '#856404',
														fontWeight: '500'
													}}>
														<strong>💡 {t('logs.saveReminder')}</strong>
													</div>

													{/* Przyciski akcji */}
													<div style={{ 
														display: 'flex', 
														gap: '15px',
														paddingTop: '20px',
														borderTop: '1px solid #dee2e6'
													}}>
														<button
															className="btn btn-success"
															onClick={() => handleSaveRoles(user._id)}
															style={{ 
																padding: '12px 24px',
																borderRadius: '6px',
																border: 'none',
																fontSize: '16px',
																fontWeight: '500',
																transition: 'all 0.2s',
																boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
															}}>
															{t('logs.save')}
														</button>
														<button
															className="btn btn-danger"
															onClick={() => setEditingUser(null)}
															style={{ 
																padding: '12px 24px',
																borderRadius: '6px',
																border: 'none',
																fontSize: '16px',
																fontWeight: '500',
																transition: 'all 0.2s',
																boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
															}}>
															{t('logs.notsave')}
														</button>
													</div>
												</div>
											</div>
										</td>
									</tr>
								)}
								{expandedLogs.includes(user._id) && (
									<tr>
										<td colSpan="2" style={{ padding: '0' }}>
											<div style={{ 
												backgroundColor: '#f8f9fa', 
												padding: '30px',
												borderTop: '1px solid #dee2e6'
											}}>
												<h4 style={{ 
													color: '#2c3e50', 
													marginBottom: '20px',
													paddingBottom: '10px',
													borderBottom: '2px solid #00a846'
												}}>
													{t('logs.userl')} - {getUserDisplayName(user)}
												</h4>
												<div style={{ 
													backgroundColor: 'white',
													borderRadius: '8px',
													overflow: 'hidden',
													boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
												}}>
													<table className="table" style={{ margin: 0 }}>
														<thead style={{ backgroundColor: '#f8f9fa' }}>
															<tr>
																<th style={{ 
																	padding: '15px', 
																	color: '#495057', 
																	fontWeight: '600'
																}}>
																	{t('logs.actionth')}
																</th>
																<th style={{ 
																	padding: '15px', 
																	color: '#495057', 
																	fontWeight: '600'
																}}>
																	{t('logs.detailsth')}
																</th>
																<th style={{ 
																	padding: '15px', 
																	color: '#495057', 
																	fontWeight: '600'
																}}>
																	{t('logs.timeth')}
																</th>
															</tr>
														</thead>
														<tbody>
															<UserLogsTable userId={user._id} />
														</tbody>
													</table>
												</div>
											</div>
										</td>
									</tr>
								)}
							</React.Fragment>
						))}
					</tbody>
				</table>
				</div>

				{/* Mobile view - karty */}
				<div className="users-cards-container logs-mobile-view" style={{ 
						display: 'block' // Pokazujemy na mobile
					}}>
						{users.map((user, index) => (
							<div key={user._id} style={{ 
								backgroundColor: 'white',
								borderRadius: '12px',
								boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
								marginBottom: '20px',
								overflow: 'hidden'
							}}>
								{/* Nagłówek karty */}
								<div style={{ 
									padding: '20px',
									borderBottom: '1px solid #e9ecef'
								}}>
									<div style={{ 
										display: 'flex', 
										alignItems: 'center',
										marginBottom: '15px',
										width: '100%',
										minWidth: 0
									}}>
										<div style={{ 
											width: '50px', 
											height: '50px', 
											borderRadius: '50%', 
											backgroundColor: '#00a846',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
											fontWeight: 'bold',
											marginRight: '15px',
											flexShrink: 0
										}}>
											{getUserDisplayName(user).charAt(0).toUpperCase()}
										</div>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div style={{ 
												fontWeight: '600', 
												color: '#2c3e50', 
												marginBottom: '5px',
												fontSize: '18px',
												wordBreak: 'break-word',
												overflowWrap: 'break-word',
												hyphens: 'auto'
											}}>
												{getUserDisplayName(user)}
											</div>
											{(user.firstName || user.lastName) && (
												<div style={{ 
													fontSize: '12px', 
													color: '#95a5a6',
													marginBottom: '3px',
													fontStyle: 'italic',
													wordBreak: 'break-word',
													overflowWrap: 'break-word'
												}}>
													{`${user.firstName || ''} ${user.lastName || ''}`.trim()}
												</div>
											)}
											{user.position && (
												<div style={{ 
													fontSize: '11px', 
													color: '#95a5a6',
													marginBottom: '3px',
													fontStyle: 'italic',
													wordBreak: 'break-word',
													overflowWrap: 'break-word'
												}}>
													{user.position}
												</div>
											)}
											{user.appAccessEnabled === false ? (
												<div style={{
													fontSize: '12px',
													color: '#6c757d',
													fontWeight: '600',
													marginTop: '3px'
												}}>
													{t('logs.noAppAccess')}
												</div>
											) : (isSuperAdmin || isAdmin) && !user.hasPassword && (
												<div style={{ 
													fontSize: '12px', 
													color: '#dc3545',
													fontWeight: '600',
													marginTop: '3px'
												}}>
													{t('logs.noPassword')}
												</div>
											)}
										</div>
									</div>

									{/* Przyciski akcji - zawsze widoczne */}
									<div style={{ 
										display: 'flex', 
										gap: '10px',
										flexWrap: 'wrap'
									}}>
										<button
											className="btn btn-primary"
											onClick={() => handleEditClick(user)}
											style={{ 
												flex: 1,
												minWidth: '120px',
												padding: '12px 16px',
												borderRadius: '8px',
												border: 'none',
												fontSize: '14px',
												fontWeight: '500',
												transition: 'all 0.2s',
												boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
											}}>
											{t('logs.rolebtn')}
										</button>
										<button
											className="btn btn-info"
											onClick={() => handleExpandLogs(user._id)}
											style={{ 
												flex: 1,
												minWidth: '120px',
												padding: '12px 16px',
												borderRadius: '8px',
												border: 'none',
												fontSize: '14px',
												fontWeight: '500',
												transition: 'all 0.2s',
												boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
											}}>
											{t('logs.actionbtn')}
										</button>
										{user.appAccessEnabled !== false && (isSuperAdmin || isAdmin) && !user.hasPassword && (
											<button
												onClick={() => handleResendPasswordLink(user._id)}
												disabled={resendingLink}
												title="Wyślij ponownie link do ustawienia hasła"
												style={{ 
													flex: 1,
													minWidth: '120px',
													padding: '12px 16px',
													borderRadius: '8px',
													border: 'none',
													backgroundColor: '#28a745',
													color: 'white',
													cursor: resendingLink ? 'not-allowed' : 'pointer',
													transition: 'all 0.2s',
													boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													gap: '8px',
													fontSize: '14px',
													fontWeight: '500',
													opacity: resendingLink ? 0.6 : 1
												}}
												onMouseEnter={(e) => !resendingLink && (e.target.style.backgroundColor = '#218838')}
												onMouseLeave={(e) => !resendingLink && (e.target.style.backgroundColor = '#28a745')}>
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
													<path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
													<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
												</svg>
												Wyślij link
											</button>
										)}
										{isSuperAdmin && (user.username === 'klaudia.b.lubszczyk@gmail.com' || user.username === 'lipkam420@gmail.com') && (
											<button
												onClick={() => handleSendApologyEmail(user._id)}
												disabled={sendingApology}
												title="Wyślij email informacyjny z przeprosinami"
												style={{ 
													flex: 1,
													minWidth: '120px',
													padding: '12px 16px',
													borderRadius: '8px',
													border: 'none',
													backgroundColor: '#ff9800',
													color: 'white',
													cursor: sendingApology ? 'not-allowed' : 'pointer',
													transition: 'all 0.2s',
													boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													gap: '8px',
													fontSize: '14px',
													fontWeight: '500',
													opacity: sendingApology ? 0.6 : 1
												}}
												onMouseEnter={(e) => !sendingApology && (e.target.style.backgroundColor = '#f57c00')}
												onMouseLeave={(e) => !sendingApology && (e.target.style.backgroundColor = '#ff9800')}>
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
													<path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z"/>
												</svg>
												Email info
											</button>
										)}
										{(isAdmin || isSuperAdmin) && !user.isTeamAdmin && (
											<button
												onClick={() => handleDeleteClick(user)}
												title={t('logs.deleteUser')}
												style={{ 
													flex: 1,
													minWidth: '120px',
													padding: '12px 16px',
													borderRadius: '8px',
													border: 'none',
													backgroundColor: '#dc3545',
													color: 'white',
													cursor: 'pointer',
													transition: 'all 0.2s',
													boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													gap: '8px',
													fontSize: '14px',
													fontWeight: '500'
												}}
												onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
												onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}>
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
													<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
													<path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
												</svg>
												{t('logs.deleteUser')}
											</button>
										)}
									</div>
								</div>

								{/* Panel edycji */}
								{editingUser?._id === user._id && (
									<div style={{ 
										backgroundColor: '#f8f9fa', 
										padding: '20px',
										borderTop: '1px solid #e9ecef'
									}}>
										<h4 style={{ 
											color: '#2c3e50', 
											marginBottom: '20px',
											paddingBottom: '10px',
											borderBottom: '2px solid #00a846',
											fontSize: '18px'
										}}>
											{t('logs.editrole')}
										</h4>
										
										{/* Role */}
										<div style={{ marginBottom: '25px' }}>
											<h5 style={{ 
												color: '#34495e', 
												marginBottom: '15px',
												fontSize: '16px'
											}}>{t('logs.userRolesLabel')}</h5>
											{isManagedNoAccessUser(editingUser) && (
												<p style={{
													margin: '0 0 12px',
													color: '#6b7280',
													fontSize: '14px',
												}}>
													{t('logs.managedOnlyWorkerRole')}
												</p>
											)}
											<div style={{ 
												display: 'flex',
												flexDirection: 'column',
												gap: '10px'
											}}>
												{availableRoles.map(role => (
													<div key={role} style={{ 
														display: 'flex',
														flexDirection: 'column',
														gap: '8px'
													}}>
														<label style={{ 
															display: 'flex', 
															alignItems: 'flex-start',
															padding: '15px',
															backgroundColor: 'white',
															borderRadius: '8px',
															border: '1px solid #dee2e6',
															cursor: isManagedNoAccessUser(editingUser) ? 'not-allowed' : 'pointer',
															transition: 'all 0.2s',
															boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
															opacity: isManagedNoAccessUser(editingUser) && role !== WORKER_ROLE ? 0.55 : 1,
														}}>
															<input
																type="checkbox"
																checked={isManagedNoAccessUser(editingUser) ? role === WORKER_ROLE : editedRoles.includes(role)}
																disabled={isManagedNoAccessUser(editingUser)}
																onChange={() => handleRoleChange(role)}
																style={{ 
																	marginRight: '12px',
																	transform: 'scale(1.3)',
																	marginTop: '2px',
																	flexShrink: 0
																}}
															/>
															<span style={{ fontSize: '14px', lineHeight: '1.4', flex: 1 }}>{role}</span>
														</label>
														{role === 'Przełożony (Supervisor)' && !isManagedNoAccessUser(editingUser) && editedRoles.includes(role) && editingUser?._id && (
															<div style={{ 
																display: 'flex', 
																gap: '10px',
																marginLeft: '0',
																marginTop: '8px',
																padding: '12px',
																backgroundColor: '#f8f9fa',
																borderRadius: '8px',
																border: '1px solid #e9ecef',
																borderLeft: '4px solid #00a846',
																flexDirection: 'column'
															}}>
																<button
																	type="button"
																	onClick={() => setSupervisorConfigModal({ isOpen: true, userId: editingUser._id })}
																	style={{
																		padding: '10px 16px',
																		border: '1px solid #00a846',
																		borderRadius: '6px',
																		backgroundColor: '#00a846',
																		color: 'white',
																		cursor: 'pointer',
																		fontSize: '14px',
																		fontWeight: '600',
																		transition: 'all 0.2s',
																		boxShadow: '0 2px 4px rgba(0, 168, 70, 0.18)',
																		width: '100%'
																	}}
																	onMouseEnter={(e) => {
																		e.target.style.backgroundColor = '#00963e'
																		e.target.style.borderColor = '#00963e'
																		e.target.style.boxShadow = '0 3px 6px rgba(0, 168, 70, 0.26)'
																	}}
																	onMouseLeave={(e) => {
																		e.target.style.backgroundColor = '#00a846'
																		e.target.style.borderColor = '#00a846'
																		e.target.style.boxShadow = '0 2px 4px rgba(0, 168, 70, 0.18)'
																	}}>
																	{t('logs.configure') || 'Konfiguruj'}
																</button>
																<button
																	type="button"
																	onClick={() => setSubordinatesModal({ isOpen: true, userId: editingUser._id })}
																	style={{
																		padding: '10px 16px',
																		border: '1px solid #27ae60',
																		borderRadius: '6px',
																		backgroundColor: '#27ae60',
																		color: 'white',
																		cursor: 'pointer',
																		fontSize: '14px',
																		fontWeight: '600',
																		transition: 'all 0.2s',
																		boxShadow: '0 2px 4px rgba(39, 174, 96, 0.2)',
																		width: '100%'
																	}}
																	onMouseEnter={(e) => {
																		e.target.style.backgroundColor = '#229954'
																		e.target.style.borderColor = '#229954'
																		e.target.style.boxShadow = '0 3px 6px rgba(39, 174, 96, 0.3)'
																	}}
																	onMouseLeave={(e) => {
																		e.target.style.backgroundColor = '#27ae60'
																		e.target.style.borderColor = '#27ae60'
																		e.target.style.boxShadow = '0 2px 4px rgba(39, 174, 96, 0.2)'
																	}}>
																	{t('logs.manageSubordinatesButton') || 'Podwładni'}
																</button>
															</div>
														)}
													</div>
												))}
											</div>
										</div>

										{isManagedNoAccessUser(editingUser) && (
											<div style={{ marginBottom: '25px' }}>
												<h5 style={{
													color: '#34495e',
													marginBottom: '12px',
													fontSize: '16px'
												}}>Stanowisko:</h5>
												<input
													type="text"
													value={editedPosition}
													onChange={(e) => setEditedPosition(e.target.value)}
													maxLength={100}
													placeholder="np. specjalista, koordynator, pracownik"
													style={{
														width: '100%',
														padding: '12px',
														border: '1px solid #bdc3c7',
														borderRadius: '8px',
														backgroundColor: 'white',
														fontSize: '16px',
													}}
												/>
												<small style={{ color: '#6c757d', display: 'block', marginTop: '6px' }}>
													Pole opcjonalne dla pracownika bez dostępu do aplikacji.
												</small>
											</div>
										)}

										{/* Dział */}
										<div style={{ marginBottom: '25px' }}>
											<h5 style={{ 
												color: '#34495e', 
												marginBottom: '15px',
												fontSize: '16px'
											}}>
												{t('newuser.department5')}
											</h5>
											
																						{/* Tryb wyboru z listy */}
											{departmentMode === 'choose' && (
												<div style={{ marginBottom: '20px' }}>
													{!departments || departments.length === 0 ? (
														<div style={{ 
															backgroundColor: '#fff3cd', 
															padding: '15px', 
															borderRadius: '6px', 
															border: '1px solid #ffeaa7',
															color: '#856404',
															marginBottom: '15px'
														}}>
															{t('logs.noDepartments')}
														</div>
													) : (
														<div style={{ 
															display: 'flex',
															flexDirection: 'column',
															gap: '10px',
															marginBottom: '15px'
														}}>
															{departments.map((dep) => {
																const depName = typeof dep === 'object' ? dep.name : dep;
																return (
																	<label key={depName} style={{ 
																		display: 'flex', 
																		alignItems: 'center',
																		justifyContent: 'space-between',
																		padding: '12px',
																		backgroundColor: 'white',
																		borderRadius: '8px',
																		border: '1px solid #dee2e6',
																		cursor: 'pointer',
																		transition: 'all 0.2s',
																		marginBottom: '8px'
																	}}>
																		<div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
																			<input
																				type="checkbox"
																				checked={editedDepartments.includes(depName)}
																				onChange={() => handleDepartmentToggle(depName)}
																				onClick={(e) => e.stopPropagation()}
																				style={{ marginRight: '12px', transform: 'scale(1.3)', flexShrink: 0, cursor: 'pointer' }}
																			/>
																			<span>{depName}</span>
																		</div>
																		{isAdmin && (
																			<button
																				type="button"
																				onClick={(e) => {
																					e.stopPropagation()
																					handleDeleteDepartment(depName)
																				}}
																				style={{
																					background: 'transparent',
																					border: 'none',
																					color: '#dc3545',
																					cursor: 'pointer',
																					padding: '4px 8px',
																					borderRadius: '4px',
																					fontSize: '20px',
																					lineHeight: '1',
																					transition: 'all 0.2s',
																					marginLeft: '10px',
																					flexShrink: 0
																				}}
																				onMouseEnter={(e) => {
																					e.target.style.backgroundColor = '#f8d7da'
																					e.target.style.color = '#721c24'
																				}}
																				onMouseLeave={(e) => {
																					e.target.style.backgroundColor = 'transparent'
																					e.target.style.color = '#dc3545'
																				}}
																				title={t('newuser.deleteDepartmentConfirm')}
																			>
																				×
																			</button>
																		)}
																	</label>
																);
															})}
														</div>
													)}
													
													<button
														type="button"
														className="btn btn-outline-primary"
														onClick={() => {
															setDepartmentMode('new')
															setNewDepartmentName('')
														}}
														style={{ 
															width: '100%',
															padding: '12px 16px',
															borderRadius: '8px',
															border: '1px solid #00a846',
															backgroundColor: 'transparent',
															color: '#00a846',
															transition: 'all 0.2s',
															fontSize: '14px'
														}}>
														{t('newuser.department2')}
													</button>
												</div>
											)}
											
											{/* Tryb dodawania nowego działu */}
											{departmentMode === 'new' && (
												<div style={{ 
													backgroundColor: 'white',
													padding: '20px',
													borderRadius: '8px',
													border: '2px solid #00a846'
												}}>
													<div style={{ marginBottom: '15px' }}>
														<label style={{ 
															display: 'block',
															marginBottom: '8px',
															fontWeight: '600',
															color: '#2c3e50'
														}}>
															{t('newuser.department2')}
														</label>
														<input
															type="text"
															placeholder={t('newuser.department4')}
															value={newDepartmentName}
															onChange={(e) => setNewDepartmentName(e.target.value)}
															style={{ 
																width: '100%',
																padding: '12px',
																border: '1px solid #bdc3c7',
																borderRadius: '8px',
																fontSize: '16px',
																transition: 'border-color 0.2s'
															}}
														/>
														<small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
															{t('newuser.departmentPressSave')}
														</small>
													</div>
													
													<div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
														<button
															type="button"
															className="btn btn-primary"
															onClick={handleAddNewDepartment}
															disabled={!newDepartmentName.trim()}
															style={{ 
																width: '100%',
																padding: '12px 16px',
																borderRadius: '8px',
																border: '1px solid #00a846',
																backgroundColor: '#00a846',
																color: 'white',
																fontSize: '14px',
																cursor: newDepartmentName.trim() ? 'pointer' : 'not-allowed',
																opacity: newDepartmentName.trim() ? 1 : 0.5
															}}>
															{t('newuser.departmentAddButton')}
														</button>
														<button
															type="button"
															className="btn btn-outline-primary"
															onClick={() => {
																setDepartmentMode('choose')
																setNewDepartmentName('')
															}}
															style={{ 
																width: '100%',
																padding: '12px 16px',
																borderRadius: '8px',
																border: '1px solid #00a846',
																backgroundColor: 'transparent',
																color: '#00a846',
																fontSize: '14px'
															}}>
															{t('newuser.department3')}
														</button>
													</div>
												</div>
											)}
										</div>

										{/* Przypomnienie o zapisaniu zmian */}
										<div style={{ 
											marginTop: '20px', 
											marginBottom: '15px',
											padding: '12px 16px',
											backgroundColor: '#fff3cd',
											border: '1px solid #ffc107',
											borderRadius: '6px',
											fontSize: '14px',
											color: '#856404',
											fontWeight: '500'
										}}>
											<strong>💡 {t('logs.saveReminder')}</strong>
										</div>

										{/* Przyciski akcji */}
										<div style={{ 
											display: 'flex', 
											gap: '10px',
											paddingTop: '20px',
											borderTop: '1px solid #dee2e6',
											flexDirection: 'column'
										}}>
											<button
												className="btn btn-success"
												onClick={() => handleSaveRoles(user._id)}
												style={{ 
													width: '100%',
													padding: '14px 20px',
													borderRadius: '8px',
													border: 'none',
													fontSize: '16px',
													fontWeight: '500',
													transition: 'all 0.2s',
													boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
												}}>
												{t('logs.save')}
											</button>
											<button
												className="btn btn-danger"
												onClick={() => setEditingUser(null)}
												style={{ 
													width: '100%',
													padding: '14px 20px',
													borderRadius: '8px',
													border: 'none',
													fontSize: '16px',
													fontWeight: '500',
													transition: 'all 0.2s',
													boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
												}}>
												{t('logs.notsave')}
											</button>
										</div>
									</div>
								)}

								{/* Panel logów */}
								{expandedLogs.includes(user._id) && (
									<div style={{ 
										backgroundColor: '#f8f9fa', 
										padding: '20px',
										borderTop: '1px solid #e9ecef'
									}}>
										<h4 style={{ 
											color: '#2c3e50', 
											marginBottom: '20px',
											paddingBottom: '10px',
											borderBottom: '2px solid #00a846',
											fontSize: '18px'
										}}>
											{t('logs.userl')} - {getUserDisplayName(user)}
										</h4>
										<div style={{ 
											backgroundColor: 'white',
											borderRadius: '8px',
											overflow: 'hidden',
											boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
										}}>
											<UserLogsCards userId={user._id} />
										</div>
									</div>
								)}
							</div>
						))}
					</div>
					</React.Fragment>
				)}
				</div>
			)}

			{/* Sekcja usuwania zespołu - na dole strony */}
			{isAdmin && (
				<div style={{ 
					marginTop: '50px', 
					paddingTop: '30px', 
					marginBottom: '20px',
					borderTop: '1px solid #e5e7eb'
				}}>
					<h4 style={{ 
						color: '#dc3545', 
						marginBottom: '15px',
						fontSize: '18px',
						fontWeight: '600',
					}}>
						{t('logs.deleteTeamTitle')}
					</h4>
					<hr className="mb-4" />
					<p style={{ 
						color: '#6b7280', 
						marginBottom: '20px',
						fontSize: '14px',
						lineHeight: '1.6'
					}}>
						{t('logs.deleteTeamDescription')}
					</p>
					<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
						<button
							type="button"
							onClick={() => setDeleteTeamModal(true)}
							disabled={deleteTeamMutation.isPending || permanentlyDeleteTeamMutation.isPending}
							style={{
								padding: '12px 24px',
								borderRadius: '6px',
								border: '1px solid #dc3545',
								backgroundColor: 'white',
								color: '#dc3545',
								cursor: (deleteTeamMutation.isPending || permanentlyDeleteTeamMutation.isPending) ? 'not-allowed' : 'pointer',
								fontSize: '14px',
								fontWeight: '500',
								transition: 'all 0.2s',
								opacity: (deleteTeamMutation.isPending || permanentlyDeleteTeamMutation.isPending) ? 0.5 : 1
							}}
							onMouseEnter={(e) => {
								if (!deleteTeamMutation.isPending && !permanentlyDeleteTeamMutation.isPending) {
									e.target.style.backgroundColor = '#dc3545'
									e.target.style.color = 'white'
								}
							}}
							onMouseLeave={(e) => {
								if (!deleteTeamMutation.isPending && !permanentlyDeleteTeamMutation.isPending) {
									e.target.style.backgroundColor = 'white'
									e.target.style.color = '#dc3545'
								}
							}}>
							{deleteTeamMutation.isPending ? (
								<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<svg className="animate-spin" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									{t('logs.deletingTeam')}
								</span>
							) : (
								t('logs.deleteTeamButton')
							)}
						</button>
						<button
							type="button"
							onClick={() => setPermanentlyDeleteTeamModal(true)}
							disabled={deleteTeamMutation.isPending || permanentlyDeleteTeamMutation.isPending}
							style={{
								padding: '12px 24px',
								borderRadius: '6px',
								border: '1px solid #8b0000',
								backgroundColor: 'white',
								color: '#8b0000',
								cursor: (deleteTeamMutation.isPending || permanentlyDeleteTeamMutation.isPending) ? 'not-allowed' : 'pointer',
								fontSize: '14px',
								fontWeight: '600',
								transition: 'all 0.2s',
								opacity: (deleteTeamMutation.isPending || permanentlyDeleteTeamMutation.isPending) ? 0.5 : 1
							}}
							onMouseEnter={(e) => {
								if (!deleteTeamMutation.isPending && !permanentlyDeleteTeamMutation.isPending) {
									e.target.style.backgroundColor = '#8b0000'
									e.target.style.color = 'white'
								}
							}}
							onMouseLeave={(e) => {
								if (!deleteTeamMutation.isPending && !permanentlyDeleteTeamMutation.isPending) {
									e.target.style.backgroundColor = 'white'
									e.target.style.color = '#8b0000'
								}
							}}>
							{permanentlyDeleteTeamMutation.isPending ? (
								<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<svg className="animate-spin" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									{t('logs.deletingTeam')}
								</span>
							) : (
								t('logs.permanentlyDeleteTeamButton')
							)}
						</button>
					</div>
				</div>
			)}

			{/* Modal potwierdzenia usunięcia */}
			{deleteModal.show && deleteModal.user && (
				<div 
					className="fixed inset-0 flex items-center justify-center backdrop-blur-[1px]"
					style={{
						zIndex: 100000000,
						padding: '20px'
					}} 
					onClick={handleDeleteCancel}>
					<div style={{
						backgroundColor: 'white',
						borderRadius: '8px',
						padding: '30px',
						maxWidth: '500px',
						width: '100%',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						position: 'relative'
					}} onClick={(e) => e.stopPropagation()}>
						<h3 style={{
							margin: '0 0 20px 0',
							color: '#1f2937',
							fontSize: '24px',
							fontWeight: '600'
						}}>
							{t('logs.deleteConfirmTitle')}
						</h3>
						<p style={{
							margin: '0 0 30px 0',
							color: '#4b5563',
							fontSize: '16px',
							lineHeight: '1.6'
						}}>
							{t('logs.deleteConfirmMessage', { username: getUserDisplayName(deleteModal.user) })}
						</p>
						<div style={{
							display: 'flex',
							gap: '12px',
							justifyContent: 'flex-end'
						}}>
							<button
								onClick={handleDeleteCancel}
								disabled={deleteUserMutation.isLoading}
								style={{
									padding: '10px 20px',
									borderRadius: '6px',
									border: '1px solid #d1d5db',
									backgroundColor: 'white',
									color: '#374151',
									cursor: deleteUserMutation.isLoading ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'all 0.2s',
									opacity: deleteUserMutation.isLoading ? 0.5 : 1
								}}
								onMouseEnter={(e) => !deleteUserMutation.isLoading && (e.target.style.backgroundColor = '#f9fafb')}
								onMouseLeave={(e) => !deleteUserMutation.isLoading && (e.target.style.backgroundColor = 'white')}>
								{t('logs.cancel')}
							</button>
							<button
								onClick={handleDeleteConfirm}
								disabled={deleteUserMutation.isLoading}
								style={{
									padding: '10px 20px',
									borderRadius: '6px',
									border: 'none',
									backgroundColor: '#dc3545',
									color: 'white',
									cursor: deleteUserMutation.isLoading ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'all 0.2s',
									opacity: deleteUserMutation.isLoading ? 0.5 : 1,
									display: 'flex',
									alignItems: 'center',
									gap: '8px'
								}}
								onMouseEnter={(e) => !deleteUserMutation.isLoading && (e.target.style.backgroundColor = '#c82333')}
								onMouseLeave={(e) => !deleteUserMutation.isLoading && (e.target.style.backgroundColor = '#dc3545')}>
								{deleteUserMutation.isLoading ? (
									<>
										<svg className="animate-spin" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('logs.deleting')}
									</>
								) : (
									t('logs.deleteConfirm')
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal z usuniętymi użytkownikami */}
			{deletedUsersModal && (
				<div 
					className="fixed inset-0 flex items-center justify-center backdrop-blur-[1px]"
					style={{
						zIndex: 100000000,
						padding: '20px'
					}} 
					onClick={() => setDeletedUsersModal(false)}>
					<div style={{
						backgroundColor: 'white',
						borderRadius: '8px',
						padding: '30px',
						maxWidth: '800px',
						width: '100%',
						maxHeight: '90vh',
						overflow: 'auto',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						position: 'relative'
					}} onClick={(e) => e.stopPropagation()}>
						<h3 style={{
							margin: '0 0 20px 0',
							color: '#1f2937',
							fontSize: '24px',
							fontWeight: '600'
						}}>
							{t('logs.deletedUsers') || 'Ostatnio usunięci użytkownicy'}
						</h3>
						
						<div style={{
							backgroundColor: '#fff3cd',
							padding: '15px',
							borderRadius: '6px',
							marginBottom: '20px',
							border: '1px solid #ffc107',
							color: '#856404',
							fontSize: '14px',
							lineHeight: '1.6'
						}}>
							<strong>{t('logs.retentionPeriodTitle') || 'Okres karencji:'}</strong> {t('logs.retentionPeriodDescription') || 'Usunięci użytkownicy są przechowywani przez 30 dni. Po tym czasie zostaną trwale usunięci automatycznie. W każdej chwili możesz przywrócić użytkownika lub trwale usunąć go przed upływem karencji.'}
						</div>

						{loadingDeletedUsers ? (
							<div style={{ textAlign: 'center', padding: '40px' }}>
								<Loader />
							</div>
						) : deletedUsers.length === 0 ? (
							<div style={{
								textAlign: 'center',
								padding: '40px',
								color: '#6c757d'
							}}>
								{t('logs.noDeletedUsers') || 'Brak usuniętych użytkowników'}
							</div>
						) : (
							<div style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '15px'
							}}>
								{deletedUsers.map((user) => {
									const deletedDate = new Date(user.deletedAt)
									const retentionDate = new Date(deletedDate)
									retentionDate.setDate(retentionDate.getDate() + 30)
									const daysLeft = Math.ceil((retentionDate - new Date()) / (1000 * 60 * 60 * 24))

									return (
										<div key={user._id} style={{
											backgroundColor: '#f8f9fa',
											borderRadius: '8px',
											padding: '20px',
											border: '1px solid #dee2e6'
										}}>
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'flex-start',
												marginBottom: '15px'
											}}>
												<div style={{ flex: 1 }}>
													<div style={{
														fontWeight: '600',
														color: '#2c3e50',
														fontSize: '18px',
														marginBottom: '5px'
													}}>
														{getUserDisplayName(user)}
													</div>
													{(user.firstName || user.lastName) && (
														<div style={{
															fontSize: '14px',
															color: '#6c757d',
															marginBottom: '5px'
														}}>
															{`${user.firstName || ''} ${user.lastName || ''}`.trim()}
														</div>
													)}
													{user.position && (
														<div style={{
															fontSize: '14px',
															color: '#6c757d',
															marginBottom: '5px'
														}}>
															{user.position}
														</div>
													)}
													{user.roles && user.roles.length > 0 && (
														<div style={{
															marginTop: '10px',
															display: 'flex',
															flexWrap: 'wrap',
															gap: '5px'
														}}>
															{user.roles.map((role, idx) => (
																<span key={idx} style={{
																	backgroundColor: '#00a846',
																	color: 'white',
																	padding: '4px 8px',
																	borderRadius: '4px',
																	fontSize: '12px'
																}}>
																	{role}
																</span>
															))}
														</div>
													)}
												</div>
											</div>
											
											<div style={{
												fontSize: '13px',
												color: '#6c757d',
												marginBottom: '15px',
												padding: '10px',
												backgroundColor: '#e9ecef',
												borderRadius: '6px'
											}}>
												<div><strong>{t('logs.deletedAt') || 'Usunięty:'}</strong> {deletedDate.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
												<div><strong>{t('logs.daysLeft') || 'Pozostało dni:'}</strong> <span style={{ color: daysLeft <= 7 ? '#dc3545' : '#28a745', fontWeight: '600' }}>{daysLeft}</span></div>
												<div><strong>{t('logs.permanentDeletionDate') || 'Data trwałego usunięcia:'}</strong> {retentionDate.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
											</div>

											<div style={{
												display: 'flex',
												gap: '10px'
											}}>
												<button
													onClick={async () => {
														const userDisplayName = getUserDisplayName(user)
														const confirmed = await showConfirm(t('logs.restoreUserConfirm', { username: userDisplayName }) || `Czy na pewno chcesz przywrócić użytkownika ${userDisplayName}?`)
														if (!confirmed) return
														
														try {
															await restoreUserMutation.mutateAsync(user._id)
															await showAlert(t('logs.restoreUserSuccess') || 'Użytkownik został przywrócony pomyślnie')
															if (deletedUsers.length === 1) {
																setDeletedUsersModal(false)
																setActiveTab('active')
															}
														} catch (error) {
															const errorMessage = error.response?.data?.message || t('logs.restoreUserError') || 'Błąd podczas przywracania użytkownika'
															await showAlert(errorMessage)
														}
													}}
													disabled={restoreUserMutation.isPending}
													style={{
														padding: '10px 20px',
														borderRadius: '6px',
														border: 'none',
														backgroundColor: '#28a745',
														color: 'white',
														cursor: restoreUserMutation.isPending ? 'not-allowed' : 'pointer',
														fontSize: '14px',
														fontWeight: '500',
														transition: 'all 0.2s',
														opacity: restoreUserMutation.isPending ? 0.5 : 1
													}}
													onMouseEnter={(e) => !restoreUserMutation.isPending && (e.target.style.backgroundColor = '#218838')}
													onMouseLeave={(e) => !restoreUserMutation.isPending && (e.target.style.backgroundColor = '#28a745')}
												>
													{t('logs.restoreUser') || 'Przywróć'}
												</button>
												<button
													onClick={async () => {
														const userDisplayName = getUserDisplayName(user)
														const confirmed = await showConfirm(t('logs.permanentDeleteConfirm', { username: userDisplayName }) || `Czy na pewno chcesz trwale usunąć użytkownika ${userDisplayName}? Ta operacja jest nieodwracalna.`)
														if (!confirmed) return
														
														try {
															await permanentlyDeleteUserMutation.mutateAsync(user._id)
															await showAlert(t('logs.permanentDeleteSuccess') || 'Użytkownik został trwale usunięty')
															if (deletedUsers.length === 1) {
																setDeletedUsersModal(false)
																setActiveTab('active')
															}
														} catch (error) {
															const errorMessage = error.response?.data?.message || t('logs.permanentDeleteError') || 'Błąd podczas trwałego usuwania użytkownika'
															await showAlert(errorMessage)
														}
													}}
													disabled={permanentlyDeleteUserMutation.isPending}
													style={{
														padding: '10px 20px',
														borderRadius: '6px',
														border: 'none',
														backgroundColor: '#dc3545',
														color: 'white',
														cursor: permanentlyDeleteUserMutation.isPending ? 'not-allowed' : 'pointer',
														fontSize: '14px',
														fontWeight: '500',
														transition: 'all 0.2s',
														opacity: permanentlyDeleteUserMutation.isPending ? 0.5 : 1
													}}
													onMouseEnter={(e) => !permanentlyDeleteUserMutation.isPending && (e.target.style.backgroundColor = '#c82333')}
													onMouseLeave={(e) => !permanentlyDeleteUserMutation.isPending && (e.target.style.backgroundColor = '#dc3545')}
												>
													{t('logs.permanentDelete') || 'Trwale usuń'}
												</button>
											</div>
										</div>
									)
								})}
							</div>
						)}

						<div style={{
							marginTop: '20px',
							display: 'flex',
							gap: '12px',
							justifyContent: 'flex-end'
						}}>
							<button
								onClick={() => {
									setDeletedUsersModal(false)
									setActiveTab('active')
								}}
								style={{
									padding: '10px 20px',
									borderRadius: '6px',
									border: '1px solid #d1d5db',
									backgroundColor: 'white',
									color: '#374151',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'all 0.2s'
								}}
								onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
								onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
							>
								{t('logs.close') || 'Zamknij'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal z użytkownikami działu */}
			<UsersInfoModal
				isOpen={usersInfoModal.isOpen}
				onClose={() => setUsersInfoModal({ isOpen: false, departmentName: null })}
				users={departmentUsers}
				isLoading={loadingDepartmentUsers}
				title={usersInfoModal.departmentName ? `${t('usersInfo.departmentUsers') || 'Użytkownicy działu'}: ${usersInfoModal.departmentName}` : (t('usersInfo.title') || 'Lista użytkowników')}
			/>

			{/* Modal konfiguracji przełożonego */}
			<SupervisorConfigModal
				isOpen={supervisorConfigModal.isOpen}
				onClose={() => setSupervisorConfigModal({ isOpen: false, userId: null })}
				supervisorId={supervisorConfigModal.userId}
			/>

			{/* Modal zarządzania podwładnymi */}
			<SubordinatesModal
				isOpen={subordinatesModal.isOpen}
				onClose={() => setSubordinatesModal({ isOpen: false, userId: null })}
				supervisorId={subordinatesModal.userId}
			/>

			{/* Modal z informacjami o roli */}
			{roleInfoModal.isOpen && roleInfoModal.roleName && (
				<UsersInfoModal
					isOpen={roleInfoModal.isOpen}
					onClose={() => setRoleInfoModal({ isOpen: false, roleName: null })}
					users={users.filter(user => user.roles && user.roles.includes(roleInfoModal.roleName))}
					isLoading={loadingUsers}
					title={`${roleInfoModal.roleName} - ${t('logs.usersWithRole') || 'Użytkownicy z tą rolą'}`}
				/>
			)}

			{/* Modal potwierdzenia usunięcia zespołu */}
			{deleteTeamModal && (
				<div 
					className="fixed inset-0 flex items-center justify-center backdrop-blur-[1px]"
					style={{
						zIndex: 100000000,
						padding: '20px'
					}} 
					onClick={() => setDeleteTeamModal(false)}>
					<div style={{
						backgroundColor: 'white',
						borderRadius: '8px',
						padding: '30px',
						maxWidth: '500px',
						width: '100%',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						position: 'relative'
					}} onClick={(e) => e.stopPropagation()}>
					<h3 style={{
						margin: '0 0 20px 0',
						color: '#1f2937',
						fontSize: '24px',
						fontWeight: '600'
					}}>
						{t('logs.deleteTeamConfirmTitle')}
					</h3>
					<p style={{
						margin: '0 0 20px 0',
						color: '#4b5563',
						fontSize: '16px',
						lineHeight: '1.6'
					}}>
						{t('logs.deleteTeamConfirmMessage')}
					</p>
					<div style={{
						backgroundColor: '#fff3cd',
						padding: '15px',
						borderRadius: '6px',
						marginBottom: '20px',
						border: '1px solid #ffc107',
						color: '#856404',
						fontSize: '14px',
						lineHeight: '1.6'
					}}>
						<p style={{ margin: 0 }}>
							<strong>{t('logs.retentionPeriodTitle') || 'Okres karencji:'}</strong> {t('logs.deleteTeamRetentionInfo') || 'Zespół będzie przechowywany przez 30 dni, a następnie dane zostaną trwale usunięte. Email administratora zespołu będzie można użyć do rejestracji nowego zespołu dopiero po upływie karencji (30 dni).'}
						</p>
					</div>
					<p style={{
						margin: '0 0 30px 0',
						color: '#4b5563',
						fontSize: '16px',
						lineHeight: '1.6'
					}}>
						{t('logs.deleteTeamWarning')}
					</p>
						<div style={{
							display: 'flex',
							gap: '12px',
							justifyContent: 'flex-end'
						}}>
							<button
								onClick={() => setDeleteTeamModal(false)}
								disabled={deleteTeamMutation.isPending}
								style={{
									padding: '10px 20px',
									borderRadius: '6px',
									border: '1px solid #d1d5db',
									backgroundColor: 'white',
									color: '#374151',
									cursor: deleteTeamMutation.isPending ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'all 0.2s',
									opacity: deleteTeamMutation.isPending ? 0.5 : 1
								}}
								onMouseEnter={(e) => !deleteTeamMutation.isPending && (e.target.style.backgroundColor = '#f9fafb')}
								onMouseLeave={(e) => !deleteTeamMutation.isPending && (e.target.style.backgroundColor = 'white')}>
								{t('logs.cancel')}
							</button>
							<button
								onClick={async () => {
									try {
										await deleteTeamMutation.mutateAsync(teamId)
										await showAlert(t('logs.deleteTeamSuccess'))
										setDeleteTeamModal(false)
										// Wyloguj użytkownika i przekieruj do logowania
										setTimeout(() => {
											window.location.href = '/login'
										}, 2000)
									} catch (error) {
										await showAlert(t('logs.deleteTeamError'))
										console.error('Error deleting team:', error)
									}
								}}
								disabled={deleteTeamMutation.isPending}
								style={{
									padding: '10px 20px',
									borderRadius: '6px',
									border: 'none',
									backgroundColor: '#dc3545',
									color: 'white',
									cursor: deleteTeamMutation.isPending ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'all 0.2s',
									opacity: deleteTeamMutation.isPending ? 0.5 : 1
								}}
								onMouseEnter={(e) => !deleteTeamMutation.isPending && (e.target.style.backgroundColor = '#c82333')}
								onMouseLeave={(e) => !deleteTeamMutation.isPending && (e.target.style.backgroundColor = '#dc3545')}>
								{deleteTeamMutation.isPending ? (
									<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<svg className="animate-spin" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('logs.deletingTeam')}
									</span>
								) : (
									t('logs.deleteTeamConfirmButton')
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal potwierdzenia trwałego usunięcia zespołu */}
			{permanentlyDeleteTeamModal && (
				<div 
					className="fixed inset-0 flex items-center justify-center backdrop-blur-[1px]"
					style={{
						zIndex: 100000000,
						padding: '20px'
					}} 
					onClick={() => setPermanentlyDeleteTeamModal(false)}>
					<div style={{
						backgroundColor: 'white',
						borderRadius: '8px',
						padding: '30px',
						maxWidth: '500px',
						width: '100%',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						position: 'relative'
					}} onClick={(e) => e.stopPropagation()}>
					<h3 style={{
						margin: '0 0 20px 0',
						color: '#8b0000',
						fontSize: '24px',
						fontWeight: '600'
					}}>
						{t('logs.permanentlyDeleteTeamConfirmTitle')}
					</h3>
					<p style={{
						margin: '0 0 20px 0',
						color: '#4b5563',
						fontSize: '16px',
						lineHeight: '1.6'
					}}>
						{t('logs.permanentlyDeleteTeamConfirmMessage')}
					</p>
					<div style={{
						backgroundColor: '#fee',
						padding: '15px',
						borderRadius: '6px',
						marginBottom: '20px',
						border: '2px solid #8b0000',
						color: '#8b0000',
						fontSize: '14px',
						lineHeight: '1.6',
						fontWeight: '600'
					}}>
						<p style={{ margin: 0 }}>
							{t('logs.permanentlyDeleteTeamWarning')}
						</p>
					</div>
						<div style={{
							display: 'flex',
							gap: '12px',
							justifyContent: 'flex-end'
						}}>
							<button
								onClick={() => setPermanentlyDeleteTeamModal(false)}
								disabled={permanentlyDeleteTeamMutation.isPending}
								style={{
									padding: '10px 20px',
									borderRadius: '6px',
									border: '1px solid #d1d5db',
									backgroundColor: 'white',
									color: '#374151',
									cursor: permanentlyDeleteTeamMutation.isPending ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'all 0.2s',
									opacity: permanentlyDeleteTeamMutation.isPending ? 0.5 : 1
								}}
								onMouseEnter={(e) => !permanentlyDeleteTeamMutation.isPending && (e.target.style.backgroundColor = '#f9fafb')}
								onMouseLeave={(e) => !permanentlyDeleteTeamMutation.isPending && (e.target.style.backgroundColor = 'white')}>
								{t('logs.cancel')}
							</button>
							<button
								onClick={async () => {
									try {
										await permanentlyDeleteTeamMutation.mutateAsync(teamId)
										await showAlert(t('logs.permanentlyDeleteTeamSuccess'))
										setPermanentlyDeleteTeamModal(false)
										// Wyloguj użytkownika i przekieruj do logowania
										setTimeout(() => {
											window.location.href = '/login'
										}, 2000)
									} catch (error) {
										await showAlert(t('logs.permanentlyDeleteTeamError'))
										console.error('Error permanently deleting team:', error)
									}
								}}
								disabled={permanentlyDeleteTeamMutation.isPending}
								style={{
									padding: '10px 20px',
									borderRadius: '6px',
									border: 'none',
									backgroundColor: '#8b0000',
									color: 'white',
									cursor: permanentlyDeleteTeamMutation.isPending ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '600',
									transition: 'all 0.2s',
									opacity: permanentlyDeleteTeamMutation.isPending ? 0.5 : 1
								}}
								onMouseEnter={(e) => !permanentlyDeleteTeamMutation.isPending && (e.target.style.backgroundColor = '#6b0000')}
								onMouseLeave={(e) => !permanentlyDeleteTeamMutation.isPending && (e.target.style.backgroundColor = '#8b0000')}>
								{permanentlyDeleteTeamMutation.isPending ? (
									<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<svg className="animate-spin" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('logs.deletingTeam')}
									</span>
								) : (
									t('logs.permanentlyDeleteTeamConfirmButton')
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{isSuperAdmin && (
				<section
					style={{
						marginTop: '3rem',
						paddingTop: '2rem',
						borderTop: '2px solid #e5e7eb',
					}}
					aria-labelledby="paid-plan-purchases-heading"
				>
					<h2
						id="paid-plan-purchases-heading"
						style={{
							margin: '0 0 0.5rem',
							fontSize: '1.35rem',
							fontWeight: 700,
							color: '#111827',
						}}
					>
						{t('logs.paidPlanPurchasesTitle')}
					</h2>
					<p style={{ margin: '0 0 1.25rem', color: '#6b7280', fontSize: '0.95rem', maxWidth: '52rem' }}>
						{t('logs.paidPlanPurchasesSub')}
					</p>
					{loadingPaidPlanTeams ? (
						<p style={{ color: '#6b7280' }}>{t('logs.paidPlanPurchasesLoading')}</p>
					) : paidPlanTeams.length === 0 ? (
						<p style={{ color: '#6b7280' }}>{t('logs.paidPlanPurchasesEmpty')}</p>
					) : (
						<div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
							<table
								style={{
									width: '100%',
									borderCollapse: 'collapse',
									fontSize: '0.9rem',
									backgroundColor: '#fff',
								}}
							>
								<thead>
									<tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesTeam')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesPayer')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesAdmin')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesPlan')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesPaidAt')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb', width: '1%' }} />
									</tr>
								</thead>
								<tbody>
									{paidPlanTeams.map(row => {
										const planLabel = PAID_PLAN_LABELS[row.planKey] || row.planKey || '—'
										const cycle =
											row.billingCycle === 'annual'
												? ' — ' + (isEnglish ? 'annual' : 'rocznie')
												: row.billingCycle === 'monthly'
													? ' — ' + (isEnglish ? 'monthly' : 'mies.')
													: ''
										const paidStr = row.paidAt
											? new Date(row.paidAt).toLocaleString(isEnglish ? 'en-GB' : 'pl-PL', {
													dateStyle: 'short',
													timeStyle: 'short',
												})
											: '—'
										const payer = row.payerEmail || ''
										const rowKey = `p24-${row.teamId}`
										return (
											<tr key={row.teamId}>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													<strong>{row.teamName}</strong>
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													{payer || '—'}
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													{row.teamAdminEmail || '—'}
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													{planLabel}
													{cycle}
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													{paidStr}
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													<button
														type="button"
														disabled={
															!payer ||
															thankEmailBusy === rowKey ||
															thankPurchaseMutation.isPending
														}
														onClick={() =>
															sendPurchaseThankEmail({
																busyKey: rowKey,
																toEmail: payer,
																teamName: row.teamName,
															})
														}
														style={{
															padding: '8px 14px',
															borderRadius: '6px',
															border: 'none',
															background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
															color: '#fff',
															fontWeight: 600,
															fontSize: '0.85rem',
															cursor:
																!payer ||
																thankEmailBusy === rowKey ||
																thankPurchaseMutation.isPending
																	? 'not-allowed'
																	: 'pointer',
															opacity:
																!payer ||
																thankEmailBusy === rowKey ||
																thankPurchaseMutation.isPending
																	? 0.55
																	: 1,
															whiteSpace: 'nowrap',
														}}
													>
														{thankEmailBusy === rowKey
															? t('logs.paidPlanPurchasesThankSending')
															: t('logs.paidPlanPurchasesThank')}
													</button>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</section>
			)}

			{isSuperAdmin && (
				<section
					style={{
						marginTop: '2.5rem',
						paddingTop: '2rem',
						borderTop: '2px solid #e5e7eb',
					}}
					aria-labelledby="stripe-paid-plan-purchases-heading"
				>
					<h2
						id="stripe-paid-plan-purchases-heading"
						style={{
							margin: '0 0 0.5rem',
							fontSize: '1.35rem',
							fontWeight: 700,
							color: '#111827',
						}}
					>
						{t('logs.stripePaidPlanPurchasesTitle')}
					</h2>
					<p style={{ margin: '0 0 1.25rem', color: '#6b7280', fontSize: '0.95rem', maxWidth: '52rem' }}>
						{t('logs.stripePaidPlanPurchasesSub')}
					</p>
					{loadingStripePaidPlanTeams ? (
						<p style={{ color: '#6b7280' }}>{t('logs.paidPlanPurchasesLoading')}</p>
					) : stripePaidPlanTeams.length === 0 ? (
						<p style={{ color: '#6b7280' }}>{t('logs.stripePaidPlanPurchasesEmpty')}</p>
					) : (
						<div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
							<table
								style={{
									width: '100%',
									borderCollapse: 'collapse',
									fontSize: '0.9rem',
									backgroundColor: '#fff',
								}}
							>
								<thead>
									<tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesTeam')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesPayer')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesAdmin')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesPlan')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb' }}>
											{t('logs.paidPlanPurchasesPaidAt')}
										</th>
										<th style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb', width: '1%' }} />
									</tr>
								</thead>
								<tbody>
									{stripePaidPlanTeams.map(row => {
										const planLabel = PAID_PLAN_LABELS[row.planKey] || row.planKey || '—'
										const cycle =
											row.billingCycle === 'annual'
												? ' — ' + (isEnglish ? 'annual' : 'rocznie')
												: row.billingCycle === 'monthly'
													? ' — ' + (isEnglish ? 'monthly' : 'mies.')
													: ''
										const paidStr = row.paidAt
											? new Date(row.paidAt).toLocaleString(isEnglish ? 'en-GB' : 'pl-PL', {
													dateStyle: 'short',
													timeStyle: 'short',
												})
											: '—'
										const payer = row.payerEmail || ''
										const rowKey = `stripe-${row.teamId}`
										return (
											<tr key={rowKey}>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													<strong>{row.teamName}</strong>
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													{payer || '—'}
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													{row.teamAdminEmail || '—'}
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													{planLabel}
													{cycle}
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													{paidStr}
												</td>
												<td style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
													<button
														type="button"
														disabled={!payer || thankEmailBusy === rowKey || thankPurchaseMutation.isPending}
														onClick={() =>
															sendPurchaseThankEmail({
																busyKey: rowKey,
																toEmail: payer,
																teamName: row.teamName,
															})
														}
														style={{
															padding: '8px 14px',
															borderRadius: '6px',
															border: 'none',
															background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
															color: '#fff',
															fontWeight: 600,
															fontSize: '0.85rem',
															cursor:
																!payer || thankEmailBusy === rowKey || thankPurchaseMutation.isPending
																	? 'not-allowed'
																	: 'pointer',
															opacity:
																!payer || thankEmailBusy === rowKey || thankPurchaseMutation.isPending
																	? 0.55
																	: 1,
															whiteSpace: 'nowrap',
														}}
													>
														{thankEmailBusy === rowKey
															? t('logs.paidPlanPurchasesThankSending')
															: t('logs.paidPlanPurchasesThank')}
													</button>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</section>
			)}

			{isSuperAdmin && <SuperAdminActivityPanel />}

			</div> {/* logs-container */}
		</>
	)
}

export default Logs
