import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../dashboard/Sidebar'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

const availableRoles = [
    'Admin',
    'Pracownik (Worker)',
    'Może zatwierdzać urlopy swojego działu (Approve Leaves Department)',
    'Może widzieć ewidencję czasu pracy swojego działu (View Timesheets Department)',
    'Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)'
];

function CreateUser() {
    const [username, setUsername] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [selectedRoles, setSelectedRoles] = useState([])
    const [department, setDepartment] = useState('')
    const [departments, setDepartments] = useState([])
    const [departmentMode, setDepartmentMode] = useState('choose')
    const [teamInfo, setTeamInfo] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const { t } = useTranslation()
    const { teamId } = useAuth()

    useEffect(() => {
        if (teamId) {
            fetchDepartments()
            fetchTeamInfo()
        }
    }, [teamId])

    const fetchDepartments = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/departments`, { withCredentials: true })
            setDepartments(response.data)
        } catch (error) {
            console.error('CreateUser: Błąd pobierania departmentów:', error)
            console.error('CreateUser: Error response:', error.response?.data);
            setDepartments([])
        }
    }

    const fetchTeamInfo = async () => {
        if (!teamId) return // Super admin może nie mieć teamId, więc nie sprawdzamy limitu
        
        try {
            const response = await axios.post(`${API_URL}/api/teams/${teamId}/check-limit`, {}, {
                withCredentials: true
            })
            setTeamInfo(response.data)
        } catch (error) {
            console.error('Error fetching team info:', error)
        }
    }

    const handleRoleClick = role => {
        setSelectedRoles(prev => prev.includes(role)
            ? prev.filter(r => r !== role)
            : [...prev, role]
        )
    }

    const handleDepartmentSelect = (e) => {
        setDepartment(e.target.value)
    }

    const handleDepartmentInput = (e) => {
        setDepartment(e.target.value)
    }

    const handleUsernameChange = e => {
		const value = e.target.value.toLowerCase()
		setUsername(value)
	}

    const handleSubmit = async e => {
        e.preventDefault()
        
        if (teamInfo && !teamInfo.canAddUser) {
            alert(t('newuser.errorUserLimit', { maxUsers: teamInfo.maxUsers }))
            return
        }

        setIsLoading(true)
        try {
            if (departmentMode === 'new' && department && !departments.includes(department)) {
                await axios.post(`${API_URL}/api/departments`, { name: department }, { withCredentials: true })
                await fetchDepartments()
            }

            const newUser = { username, firstName, lastName, roles: selectedRoles, department }
            const response = await axios.post(`${API_URL}/api/users/register`, newUser, {
                withCredentials: true
            })
            
            if (response.data.success) {
                alert(t('newuser.successMessage', { email: username }))
                
                setUsername('')
                setFirstName('')
                setLastName('')
                setSelectedRoles([])
                setDepartment('')
                
                fetchTeamInfo()
            }
        } catch (error) {
            const code = error.response?.data?.code
            if (code === 'USER_EXISTS') {
                alert(t('newuser.error_user_exists'))
            } else {
                alert(error.response?.data?.message || t('newuser.errorGeneric'))
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Sidebar />
            <div className="container my-5 d-flex justify-content-center align-items-center">
                <div className="row justify-content-start">
                    <div className="col-md-8">
                        <div>
                            <div className="card-body">
                                <h4><img src="img/add-group.png" alt="ikonka w sidebar" /> {t('newuser.h4')}</h4>
                                
                                {teamInfo && (
                                    <div className={`mb-4 p-3 rounded-md mt-4 ${teamInfo.canAddUser ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                        <h6 className="font-semibold mb-2">{t('newuser.teamInfoTitle')}</h6>
                                        <p className="text-sm mb-1">
                                            <strong>{t('newuser.userLimit')}</strong> {teamInfo.currentCount} / {teamInfo.maxUsers}
                                        </p>
                                        <p className="text-sm mb-1">
                                            <strong>{t('newuser.remainingSlots')}</strong> {teamInfo.remainingSlots}
                                        </p>
                                        {!teamInfo.canAddUser && (
                                            <p className="text-sm text-red-600 font-semibold">
                                                {t('newuser.limitReached')}
                                            </p>
                                        )}
                                    </div>
                                )}
                                
                                <hr />
                                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6" id="addusers">
                                    
                                    <div>
										<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
											{t('newuser.email')}
										</label>
										<br></br>
										<input
											type="email"
                                            placeholder={t('newuser.placeholder1')}
											id="username"
											value={username}
											onChange={handleUsernameChange}
											required
											className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
											{t('newuser.firstn')}
										</label>
										<br></br>
										<input
											type="text"
											id="firstName"
                                            placeholder={t('newuser.placeholder2')}
											value={firstName}
											onChange={e => setFirstName(e.target.value)}
											required
											className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
											{t('newuser.lastn')}
										</label>
										<br></br>
										<input
											type="text"
											id="lastName"
                                            placeholder={t('newuser.placeholder3')}
											value={lastName}
											onChange={e => setLastName(e.target.value)}
											required
											className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>

                                    <div className="mt-8">
                                        <label className="block text-sm font-medium text-gray-700 mb-4 mr-3">{t('newuser.department')}</label>
                                        {departments.length > 0 && departmentMode === 'choose' ? (
                                            <>
                                                <div>
                                                    {departments.map(dep => (
                                                        <label key={dep} className="me-3">
                                                            <input
                                                                type="radio"
                                                                name="department"
                                                                value={dep}
                                                                checked={department === dep}
                                                                onChange={handleDepartmentSelect}
                                                            />{' '}
                                                            {dep}
                                                        </label>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-2 ms-2 to-left-max"
                                                    onClick={() => { setDepartment(''); setDepartmentMode('new') }}
                                                >{t('newuser.department2')}</button>
                                            </>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder={t('newuser.department4')}
                                                    value={department}
                                                    onChange={handleDepartmentInput}
                                                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                                                />
                                                {departments.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-link p-2 ms-2 to-left-max"
                                                        onClick={() => setDepartmentMode('choose')}
                                                    >{t('newuser.department3')}</button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-8">
                                        <label className="block text-sm font-medium text-gray-700 mb-4">{t('newuser.giverole')}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableRoles.map(role => (
                                                <div
                                                    key={role}
                                                    className={`border px-3 py-1 rounded-md cursor-pointer text-sm ${selectedRoles.includes(role) ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-800'}`}
                                                    onClick={() => handleRoleClick(role)}
                                                >{role}</div>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isLoading || (teamInfo && !teamInfo.canAddUser)}
                                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition mb-5 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isLoading ? 'Tworzenie użytkownika...' : t('newuser.register')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
export default CreateUser
