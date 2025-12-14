import React, { useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { useUsers, useUpdateUserRoles, useDeleteUser, useResendPasswordLink, useSendApologyEmail } from '../../hooks/useUsers'
import { useDepartments, useCreateDepartment, useDeleteDepartment } from '../../hooks/useDepartments'
import { useUserLogs } from '../../hooks/useLogs'

function Logs() {
	const [expandedLogs, setExpandedLogs] = useState([])
	const [editingUser, setEditingUser] = useState(null)
	const [editedRoles, setEditedRoles] = useState([])
	const [error, setError] = useState('')
	const { t, i18n } = useTranslation()
	const [editedDepartments, setEditedDepartments] = useState([]) // Tablica działów - użytkownik może być w wielu działach
	const [departmentMode, setDepartmentMode] = useState('choose')
	const { role, username } = useAuth()
	const navigate = useNavigate()
	const { showAlert, showConfirm } = useAlert()
	const [deleteModal, setDeleteModal] = useState({ show: false, user: null })
	const [resendingLink, setResendingLink] = useState(false)
	const [sendingApology, setSendingApology] = useState(false)

	const isAdmin = role && role.includes('Admin')
	const isSuperAdmin = username === 'michalipka1@gmail.com'

	const availableRoles = [
		'Admin',
		'Pracownik (Worker)',
		'Może zatwierdzać urlopy swojego działu (Approve Leaves Department)',
		'Może widzieć ewidencję czasu pracy swojego działu (View Timesheets Department)',
		'Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)',
	]

	// TanStack Query hooks
	const { data: users = [], isLoading: loadingUsers } = useUsers()
	const { data: departments = [] } = useDepartments()
	const updateUserRolesMutation = useUpdateUserRoles()
	const deleteUserMutation = useDeleteUser()
	const createDepartmentMutation = useCreateDepartment()
	const deleteDepartmentMutation = useDeleteDepartment()
	const resendPasswordLinkMutation = useResendPasswordLink()
	const sendApologyEmailMutation = useSendApologyEmail()

	const loading = loadingUsers

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
		setEditedRoles(user.roles || [])
		
		// Dla wielu działów - upewnij się, że to tablica
		const userDepartments = Array.isArray(user.department) 
			? user.department 
			: (user.department ? [user.department] : [])
		setEditedDepartments(userDepartments)
		
		setDepartmentMode('choose')  // Zawsze zaczynaj od trybu wyboru
	}

	const handleRoleChange = role => {
		setEditedRoles(prevRoles => (prevRoles.includes(role) ? prevRoles.filter(r => r !== role) : [...prevRoles, role]))
	}

	const handleDepartmentToggle = (dept) => {
		setEditedDepartments(prev => 
			prev.includes(dept) 
				? prev.filter(d => d !== dept) // Usuń jeśli już jest
				: [...prev, dept] // Dodaj jeśli nie ma
		)
	}

	const handleDeleteDepartment = async (deptName) => {
		const confirmed = await showConfirm(t('newuser.deleteDepartmentConfirm'))
		if (!confirmed) return

		try {
			await deleteDepartmentMutation.mutateAsync(deptName)
			// Usuń dział z edytowanych działów jeśli był zaznaczony
			setEditedDepartments(prev => prev.filter(d => d !== deptName))
			await showAlert(t('newuser.deleteDepartmentSuccess'))
		} catch (error) {
			console.error('Error deleting department:', error)
			await showAlert(t('newuser.deleteDepartmentError'))
		}
	}

	const handleSaveRoles = async userId => {
		try {
			// Zaktualizuj użytkownika z nowymi rolami i działami (tablica)
			await updateUserRolesMutation.mutateAsync({
				userId,
				roles: editedRoles,
				department: editedDepartments, // Wyślij tablicę działów
			})
			
			// Resetuj tryb do wyboru działu i odśwież listę
			setDepartmentMode('choose')
			setEditingUser(null)
			await showAlert(t('logs.alert'))
		} catch (error) {
			console.error('Error updating roles/department:', error)
			setError(t('logs.alerttwo'))
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
			const response = await deleteUserMutation.mutateAsync(deleteModal.user._id)
			
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
				<div className="logs-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
					{isSuperAdmin && (
						<h2 style={{ 
							color: '#2c3e50', 
							marginBottom: '10px',
							fontSize: '24px',
							fontWeight: '600'
						}}>
							Super Admin - Wszyscy użytkownicy
						</h2>
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
					{/* Desktop view - tabela */}
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
												backgroundColor: '#3498db',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: 'white',
												fontWeight: 'bold',
												marginRight: '15px'
											}}>
												{user.username.charAt(0).toUpperCase()}
											</div>
											<div>
												<div style={{ 
													fontWeight: '600', 
													color: '#2c3e50', 
													marginBottom: '5px'
												}}>
													{user.username}
												</div>
												<div style={{ 
													fontSize: '14px', 
													color: '#7f8c8d'
												}}>
													{user.roles?.join(', ') || 'Brak ról'}
												</div>
												{user.department && (
													<div style={{ 
														fontSize: '12px', 
														color: '#95a5a6', 
														marginTop: '3px'
													}}>
														Dział: {Array.isArray(user.department) ? user.department.join(', ') : user.department}
													</div>
												)}
												{isSuperAdmin && user.teamName && (
													<div style={{ 
														fontSize: '12px', 
														color: '#3498db', 
														marginTop: '3px',
														fontWeight: '500'
													}}>
														Zespół: {user.teamName}
													</div>
												)}
												{(isSuperAdmin || isAdmin) && !user.hasPassword && (
													<div style={{ 
														fontSize: '12px', 
														color: '#dc3545', 
														marginTop: '3px',
														fontWeight: '600'
													}}>
														⚠️ Brak hasła
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
										{(isSuperAdmin || isAdmin) && !user.hasPassword && (
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
														borderBottom: '2px solid #3498db'
													}}>
														{t('logs.editrole')}
													</h4>
													
													{/* Role */}
													<div style={{ marginBottom: '30px' }}>
														<h5 style={{ color: '#34495e', marginBottom: '15px' }}>Role użytkownika:</h5>
														<div style={{ 
															display: 'grid', 
															gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
															gap: '10px'
														}}>
															{availableRoles.map(role => (
																<label key={role} style={{ 
																	display: 'flex', 
																	alignItems: 'center',
																	padding: '12px',
																	backgroundColor: 'white',
																	borderRadius: '6px',
																	border: '1px solid #dee2e6',
																	cursor: 'pointer',
																	transition: 'all 0.2s',
																	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
																}}>
																	<input
																		type="checkbox"
																		checked={editedRoles.includes(role)}
																		onChange={() => handleRoleChange(role)}
																		style={{ 
																			marginRight: '10px',
																			transform: 'scale(1.2)'
																		}}
																	/>
																	<span style={{ fontSize: '14px' }}>{role}</span>
																</label>
															))}
														</div>
													</div>

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
																	}}
																	style={{ 
																		padding: '8px 16px',
																		borderRadius: '6px',
																		border: '1px solid #3498db',
																		backgroundColor: 'transparent',
																		color: '#3498db',
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
																border: '2px solid #3498db'
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
																		onKeyDown={(e) => {
																			if (e.key === 'Enter') {
																				e.preventDefault()
																				const value = e.target.value.trim()
																				if (value && !editedDepartments.includes(value)) {
																					setEditedDepartments([...editedDepartments, value])
																					e.target.value = ''
																				}
																			}
																		}}
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
																		className="btn btn-outline-primary"
																		onClick={() => setDepartmentMode('choose')}
																		style={{ 
																			padding: '8px 16px',
																			borderRadius: '6px',
																			border: '1px solid #3498db',
																			backgroundColor: 'transparent',
																			color: '#3498db'
																		}}>
																		{t('newuser.department3')}
																	</button>
																</div>
															</div>
														)}
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
													borderBottom: '2px solid #3498db'
												}}>
													{t('logs.userl')} - {user.username}
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
										marginBottom: '15px'
									}}>
										<div style={{ 
											width: '50px', 
											height: '50px', 
											borderRadius: '50%', 
											backgroundColor: '#3498db',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
											fontWeight: 'bold',
											marginRight: '15px',
											flexShrink: 0
										}}>
											{user.username.charAt(0).toUpperCase()}
										</div>
										<div style={{ flex: 1 }}>
											<div style={{ 
												fontWeight: '600', 
												color: '#2c3e50', 
												marginBottom: '5px',
												fontSize: '18px'
											}}>
												{user.username}
											</div>
											<div style={{ 
												fontSize: '14px', 
												color: '#7f8c8d',
												marginBottom: '3px'
											}}>
												{user.roles?.join(', ') || 'Brak ról'}
											</div>
											{user.department && (
												<div style={{ 
													fontSize: '12px', 
													color: '#95a5a6'
												}}>
													Dział: {Array.isArray(user.department) ? user.department.join(', ') : user.department}
												</div>
											)}
											{isSuperAdmin && user.teamName && (
												<div style={{ 
													fontSize: '12px', 
													color: '#3498db',
													fontWeight: '500',
													marginTop: '3px'
												}}>
													Zespół: {user.teamName}
												</div>
											)}
											{(isSuperAdmin || isAdmin) && !user.hasPassword && (
												<div style={{ 
													fontSize: '12px', 
													color: '#dc3545',
													fontWeight: '600',
													marginTop: '3px'
												}}>
													⚠️ Brak hasła
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
										{(isSuperAdmin || isAdmin) && !user.hasPassword && (
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
											borderBottom: '2px solid #3498db',
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
											}}>Role użytkownika:</h5>
											<div style={{ 
												display: 'flex',
												flexDirection: 'column',
												gap: '10px'
											}}>
												{availableRoles.map(role => (
													<label key={role} style={{ 
														display: 'flex', 
														alignItems: 'flex-start',
														padding: '15px',
														backgroundColor: 'white',
														borderRadius: '8px',
														border: '1px solid #dee2e6',
														cursor: 'pointer',
														transition: 'all 0.2s',
														boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
													}}>
														<input
															type="checkbox"
															checked={editedRoles.includes(role)}
															onChange={() => handleRoleChange(role)}
															style={{ 
																marginRight: '12px',
																transform: 'scale(1.3)',
																marginTop: '2px',
																flexShrink: 0
															}}
														/>
														<span style={{ fontSize: '14px', lineHeight: '1.4' }}>{role}</span>
													</label>
												))}
											</div>
										</div>

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
														}}
														style={{ 
															width: '100%',
															padding: '12px 16px',
															borderRadius: '8px',
															border: '1px solid #3498db',
															backgroundColor: 'transparent',
															color: '#3498db',
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
													border: '2px solid #3498db'
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
															onKeyDown={(e) => {
																if (e.key === 'Enter') {
																	e.preventDefault()
																	const value = e.target.value.trim()
																	if (value && !editedDepartments.includes(value)) {
																		setEditedDepartments([...editedDepartments, value])
																		e.target.value = ''
																	}
																}
															}}
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
															className="btn btn-outline-primary"
															onClick={() => setDepartmentMode('choose')}
															style={{ 
																width: '100%',
																padding: '12px 16px',
																borderRadius: '8px',
																border: '1px solid #3498db',
																backgroundColor: 'transparent',
																color: '#3498db',
																fontSize: '14px'
															}}>
															{t('newuser.department3')}
														</button>
													</div>
												</div>
											)}
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
											borderBottom: '2px solid #3498db',
											fontSize: '18px'
										}}>
											{t('logs.userl')} - {user.username}
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
				</div>
			)}
			</div>

			{/* Modal potwierdzenia usunięcia */}
			{deleteModal.show && deleteModal.user && (
				<div style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 1000,
					padding: '20px'
				}} onClick={handleDeleteCancel}>
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
							{t('logs.deleteConfirmMessage', { username: deleteModal.user.username })}
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
									cursor: isDeleting ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'all 0.2s',
									opacity: deleteUserMutation.isLoading ? 0.5 : 1
								}}
								onMouseEnter={(e) => !isDeleting && (e.target.style.backgroundColor = '#f9fafb')}
								onMouseLeave={(e) => !isDeleting && (e.target.style.backgroundColor = 'white')}>
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
									cursor: isDeleting ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'all 0.2s',
									opacity: deleteUserMutation.isLoading ? 0.5 : 1,
									display: 'flex',
									alignItems: 'center',
									gap: '8px'
								}}
								onMouseEnter={(e) => !isDeleting && (e.target.style.backgroundColor = '#c82333')}
								onMouseLeave={(e) => !isDeleting && (e.target.style.backgroundColor = '#dc3545')}>
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

		</>
	)
}

export default Logs
