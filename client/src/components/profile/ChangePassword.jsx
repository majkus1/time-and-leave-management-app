import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../dashboard/Sidebar'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'

function ChangePassword() {
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [position, setPosition] = useState('')
	const [isPasswordLoading, setIsPasswordLoading] = useState(false)
	const [isPositionLoading, setIsPositionLoading] = useState(false)
	const { t, i18n } = useTranslation()
	const { role } = useAuth()
	const [loading, setLoading] = useState(true)

	const isPasswordValid = newPassword => {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
		return regex.test(newPassword)
	}

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await axios.get(`${API_URL}/api/users/profile`)
				setPosition(response.data.position || '')
			} catch (error) {
				console.error('Błąd podczas pobierania danych użytkownika:', error)
			} finally {
				setLoading(false)
			}
		}
		fetchUserData()
	}, [])

	const handleSubmit = async e => {
		e.preventDefault()
		if (newPassword !== confirmPassword) {
			alert(t('editprofile.notsamepass'))
			return
		}
		if (!isPasswordValid(newPassword)) {
			alert(t('newpass.invalidPassword'))
			return
		}
		setIsPasswordLoading(true)
		try {
			await axios.post(`${API_URL}/api/users/change-password`, {
				currentPassword,
				newPassword,
			})
			alert(t('editprofile.successchangepass'))
		} catch (error) {
			alert(t('editprofile.failchangepass'))
			console.error(error)
		} finally {
			setIsPasswordLoading(false)
		}
	}

	const handlePositionUpdate = async () => {
		setIsPositionLoading(true)
		try {
			await axios.put(`${API_URL}/api/users/update-position`, { position })
			alert(t('editprofile.successchangepos'))
		} catch (error) {
			alert(t('editprofile.failchangepos'))
			console.error(error)
		} finally {
			setIsPositionLoading(false)
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
								<div className="card-body">
									<h4><img src="img/user-avatar.png" alt="ikonka w sidebar" />{t('editprofile.headertxt')}</h4>
									<hr />

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
											disabled={isPositionLoading}
											className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
											{isPositionLoading ? (
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
										<input type="text" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 form-control yourrolesinput" value={role} readOnly />
									</div>

									<form onSubmit={handleSubmit} className="max-w-md space-y-6 pt-10">
										<h4 className="text-xl font-semibold text-gray-800">{t('editprofile.changepassh4')}</h4>
										<hr className="mb-4" />

										<div>
											<label htmlFor="currentPassword" className="block text-gray-700 font-medium mb-1">
												{t('editprofile.currentpasslabel')}
											</label>
											<input
												type="password"
												id="currentPassword"
												value={currentPassword}
												onChange={e => setCurrentPassword(e.target.value)}
												required
												placeholder={t('editprofile.placeholder2')}
												className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>

										<div>
											<label htmlFor="newPassword" className="block text-gray-700 font-medium mb-1">
												{t('editprofile.newpasslabel')}
											</label>
											<input
												type="password"
												id="newPassword"
												value={newPassword}
												onChange={e => setNewPassword(e.target.value)}
												required
												placeholder={t('editprofile.placeholder3')}
												className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>

										<div>
											<label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">
												{t('editprofile.confirmnewpasslabel')}
											</label>
											<input
												type="password"
												id="confirmPassword"
												value={confirmPassword}
												onChange={e => setConfirmPassword(e.target.value)}
												required
												placeholder={t('editprofile.placeholder4')}
												className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>

										<button
											type="submit"
											disabled={isPasswordLoading}
											className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
											{isPasswordLoading ? (
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
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default ChangePassword
