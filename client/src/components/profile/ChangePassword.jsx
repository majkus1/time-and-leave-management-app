import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../dashboard/Sidebar'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { useUserProfile, useChangePassword, useUpdatePosition, useUpdateName, useDeleteUser } from '../../hooks/useUsers'

function ChangePassword() {
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [position, setPosition] = useState('')
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const { t, i18n } = useTranslation()
	const { role, username, teamId } = useAuth()
	const navigate = useNavigate()
	const { showAlert } = useAlert()
	const [deleteModal, setDeleteModal] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	// TanStack Query hooks
	const { data: userProfile, isLoading: loadingProfile } = useUserProfile()
	const changePasswordMutation = useChangePassword()
	const updatePositionMutation = useUpdatePosition()
	const updateNameMutation = useUpdateName()
	const deleteUserMutation = useDeleteUser()

	const userId = userProfile?._id || null
	const loading = loadingProfile

	// Sync position, firstName, lastName from profile
	useEffect(() => {
		if (userProfile?.position) {
			setPosition(userProfile.position)
		}
		if (userProfile?.firstName) {
			setFirstName(userProfile.firstName)
		}
		if (userProfile?.lastName) {
			setLastName(userProfile.lastName)
		}
	}, [userProfile])

	const isPasswordValid = newPassword => {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
		return regex.test(newPassword)
	}


	const handleSubmit = async e => {
		e.preventDefault()
		if (newPassword !== confirmPassword) {
			await showAlert(t('editprofile.notsamepass'))
			return
		}
		if (!isPasswordValid(newPassword)) {
			await showAlert(t('newpass.invalidPassword'))
			return
		}
		try {
			await changePasswordMutation.mutateAsync({ currentPassword, newPassword })
			await showAlert(t('editprofile.successchangepass'))
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch (error) {
			await showAlert(t('editprofile.failchangepass'))
			console.error(error)
		}
	}

	const handlePositionUpdate = async () => {
		try {
			await updatePositionMutation.mutateAsync(position)
			await showAlert(t('editprofile.successchangepos'))
		} catch (error) {
			await showAlert(t('editprofile.failchangepos'))
			console.error(error)
		}
	}

	const handleNameUpdate = async () => {
		try {
			await updateNameMutation.mutateAsync({ firstName, lastName })
			await showAlert(t('editprofile.successchangename'))
		} catch (error) {
			await showAlert(t('editprofile.failchangename'))
			console.error(error)
		}
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
				<div className="container my-5">
					<div className="row justify-content-start">
						<div className="col-md-8">
							<div>
								<h4><img src="img/user-avatar.png" alt="ikonka w sidebar" />{t('editprofile.headertxt')}</h4>
								<hr />
								<div className="card-body editformbox" style={{ 
									backgroundColor: 'white',
									borderRadius: '12px',
									boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
									padding: '15px',
									marginBottom: '30px',
									marginTop: '20px'
								}}>

									<form
										onSubmit={e => {
											e.preventDefault()
											handleNameUpdate()
										}}
										className="max-w-md space-y-6">
										<div>
											<label htmlFor="firstName" className="block text-gray-700 font-medium mb-1">
												{t('editprofile.firstnamelabel')}
											</label>
											<input
												type="text"
												id="firstName"
												value={firstName}
												onChange={e => setFirstName(e.target.value)}
												placeholder={t('editprofile.firstnameplaceholder')}
												className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>

										<div>
											<label htmlFor="lastName" className="block text-gray-700 font-medium mb-1">
												{t('editprofile.lastnamelabel')}
											</label>
											<input
												type="text"
												id="lastName"
												value={lastName}
												onChange={e => setLastName(e.target.value)}
												placeholder={t('editprofile.lastnameplaceholder')}
												className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>

										<button
											type="submit"
											disabled={updateNameMutation.isPending}
											className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
											{updateNameMutation.isPending ? (
												<span className="flex items-center">
													<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													{t('editprofile.saving')}
												</span>
											) : (
												t('editprofile.confirmname')
											)}
										</button>
									</form>

									<form
										onSubmit={e => {
											e.preventDefault()
											handlePositionUpdate()
										}}
										className="max-w-md space-y-6">
										<div>
											<label htmlFor="position" className="block text-gray-700 font-medium mb-1">
												{t('editprofile.positionlabel')}
											</label>
											<input
												type="text"
												id="position"
												value={position}
												onChange={e => setPosition(e.target.value)}
												placeholder={t('editprofile.placeholder1')}
												className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>

										<button
											type="submit"
											disabled={updatePositionMutation.isPending}
											className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
											{updatePositionMutation.isPending ? (
												<span className="flex items-center">
													<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													{t('editprofile.saving')}
												</span>
											) : (
												t('editprofile.confirmposition')
											)}
										</button>
									</form>

									<div className="mb-3">
										<label className="form-label">{t('editprofile.rolelabel')}</label>
										<input 
											type="text" 
											className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 form-control yourrolesinput" 
											value={
												loadingProfile 
													? t('editprofile.loading') 
													: (userProfile?.roles && userProfile.roles.length > 0 
														? userProfile.roles.join(', ') 
														: (Array.isArray(role) && role.length > 0 
															? role.join(', ') 
															: ''))
											} 
											readOnly 
										/>
									</div>

									<form onSubmit={handleSubmit} className="max-w-md space-y-6 pt-10">
										<h4 className="text-xl font-semibold text-gray-800">{t('editprofile.changepassh4')}</h4>
										<hr className="mb-4" />

										<div>
											<label htmlFor="currentPassword" className="block text-gray-700 font-medium mb-1">
												{t('editprofile.currentpasslabel')}
											</label>
											<div className="relative">
												<input
													type={showCurrentPassword ? 'text' : 'password'}
													id="currentPassword"
													value={currentPassword}
													onChange={e => setCurrentPassword(e.target.value)}
													required
													placeholder={t('editprofile.placeholder2')}
													className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
												<button
													type="button"
													onClick={() => setShowCurrentPassword(!showCurrentPassword)}
													className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
													style={{ cursor: 'pointer' }}
												>
													{showCurrentPassword ? (
														<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.46 3.46L12 12m-3.42-3.42l3.42 3.42M12 12l3.42 3.42M12 12l-3.42-3.42m0 0L5.12 5.12m3.46 3.46L12 12" />
														</svg>
													) : (
														<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
														</svg>
													)}
												</button>
											</div>
										</div>

										<div>
											<label htmlFor="newPassword" className="block text-gray-700 font-medium mb-1">
												{t('editprofile.newpasslabel')}
											</label>
											<div className="relative">
												<input
													type={showNewPassword ? 'text' : 'password'}
													id="newPassword"
													value={newPassword}
													onChange={e => setNewPassword(e.target.value)}
													required
													placeholder={t('editprofile.placeholder3')}
													className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
												<button
													type="button"
													onClick={() => setShowNewPassword(!showNewPassword)}
													className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
													style={{ cursor: 'pointer' }}
												>
													{showNewPassword ? (
														<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.46 3.46L12 12m-3.42-3.42l3.42 3.42M12 12l3.42 3.42M12 12l-3.42-3.42m0 0L5.12 5.12m3.46 3.46L12 12" />
														</svg>
													) : (
														<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
														</svg>
													)}
												</button>
											</div>
										</div>

										<div>
											<label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">
												{t('editprofile.confirmnewpasslabel')}
											</label>
											<div className="relative">
												<input
													type={showConfirmPassword ? 'text' : 'password'}
													id="confirmPassword"
													value={confirmPassword}
													onChange={e => setConfirmPassword(e.target.value)}
													required
													placeholder={t('editprofile.placeholder4')}
													className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
												<button
													type="button"
													onClick={() => setShowConfirmPassword(!showConfirmPassword)}
													className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
													style={{ cursor: 'pointer' }}
												>
													{showConfirmPassword ? (
														<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.46 3.46L12 12m-3.42-3.42l3.42 3.42M12 12l3.42 3.42M12 12l-3.42-3.42m0 0L5.12 5.12m3.46 3.46L12 12" />
														</svg>
													) : (
														<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
														</svg>
													)}
												</button>
											</div>
										</div>

										<button
											type="submit"
											disabled={changePasswordMutation.isPending}
											className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
											{changePasswordMutation.isPending ? (
												<span className="flex items-center">
													<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													{t('editprofile.saving')}
												</span>
											) : (
												t('editprofile.confirmnewpassbtn')
											)}
										</button>
									</form>

									{/* Sekcja usuwania konta */}
									<div style={{ 
										marginTop: '50px', 
										paddingTop: '30px', 
										marginBottom: '20px'
									}}>
										<h4 style={{ 
											color: '#dc3545', 
											marginBottom: '15px',
											fontSize: '18px',
											fontWeight: '600',
										}}>
											{t('editprofile.deleteAccountTitle')}
										</h4>
										<hr className="mb-4" />
										<p style={{ 
											color: '#6b7280', 
											marginBottom: '20px',
											fontSize: '14px',
											lineHeight: '1.6'
										}}>
											{t('editprofile.deleteAccountDescription')}
										</p>
										<button
											type="button"
											onClick={() => setDeleteModal(true)}
											style={{
												padding: '12px 24px',
												borderRadius: '6px',
												border: '1px solid #dc3545',
												backgroundColor: 'white',
												color: '#dc3545',
												cursor: 'pointer',
												fontSize: '14px',
												fontWeight: '500',
												transition: 'all 0.2s'
											}}
											onMouseEnter={(e) => {
												e.target.style.backgroundColor = '#dc3545'
												e.target.style.color = 'white'
											}}
											onMouseLeave={(e) => {
												e.target.style.backgroundColor = 'white'
												e.target.style.color = '#dc3545'
											}}>
											{t('editprofile.deleteAccountButton')}
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Modal potwierdzenia usunięcia konta */}
			{deleteModal && (
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
				}} onClick={() => setDeleteModal(false)}>
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
							color: '#dc3545',
							fontSize: '24px',
							fontWeight: '600'
						}}>
							{t('editprofile.deleteAccountConfirmTitle')}
						</h3>
						<p style={{
							margin: '0 0 10px 0',
							color: '#1f2937',
							fontSize: '16px',
							fontWeight: '600',
							lineHeight: '1.6'
						}}>
							{t('editprofile.deleteAccountConfirmMessage')}
						</p>
						<p style={{
							margin: '0 0 30px 0',
							color: '#6b7280',
							fontSize: '14px',
							lineHeight: '1.6'
						}}>
							{t('editprofile.deleteAccountWarning')}
						</p>
						<div style={{
							display: 'flex',
							gap: '12px',
							justifyContent: 'flex-end'
						}}>
							<button
								onClick={() => setDeleteModal(false)}
								disabled={isDeleting}
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
									opacity: isDeleting ? 0.5 : 1
								}}
								onMouseEnter={(e) => !isDeleting && (e.target.style.backgroundColor = '#f9fafb')}
								onMouseLeave={(e) => !isDeleting && (e.target.style.backgroundColor = 'white')}>
								{t('editprofile.cancel')}
							</button>
							<button
								onClick={async () => {
									if (!userId) return
									setIsDeleting(true)
									try {
										await deleteUserMutation.mutateAsync(userId)
										await showAlert(t('editprofile.deleteAccountSuccess'))
										window.location.href = '/login'
									} catch (error) {
										const errorMessage = error.response?.data?.message || t('editprofile.deleteAccountError')
										await showAlert(errorMessage)
										console.error('Error deleting account:', error)
									} finally {
										setIsDeleting(false)
										setDeleteModal(false)
									}
								}}
								disabled={isDeleting || deleteUserMutation.isPending}
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
									opacity: isDeleting ? 0.5 : 1,
									display: 'flex',
									alignItems: 'center',
									gap: '8px'
								}}
								onMouseEnter={(e) => !isDeleting && (e.target.style.backgroundColor = '#c82333')}
								onMouseLeave={(e) => !isDeleting && (e.target.style.backgroundColor = '#dc3545')}>
								{isDeleting ? (
									<>
										<svg className="animate-spin" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('editprofile.deleting')}
									</>
								) : (
									t('editprofile.deleteAccountConfirm')
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default ChangePassword
