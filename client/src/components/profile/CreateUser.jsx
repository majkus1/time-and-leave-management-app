import React, { useState, useEffect } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import { useDepartments, useCreateDepartment } from '../../hooks/useDepartments'
import { useTeamInfo } from '../../hooks/useTeam'
import { useCreateUser } from '../../hooks/useUsers'

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
    const [selectedDepartments, setSelectedDepartments] = useState([]) // Tablica wybranych działów
    const [newDepartmentName, setNewDepartmentName] = useState('') // Nowy dział do dodania
    const [departmentMode, setDepartmentMode] = useState('choose')
    const { t } = useTranslation()
    const { teamId } = useAuth()
    const { showAlert } = useAlert()

    // TanStack Query hooks
    const { data: departments = [], refetch: refetchDepartments } = useDepartments(teamId)
    const { data: teamInfo } = useTeamInfo(teamId)
    const createDepartmentMutation = useCreateDepartment()
    const createUserMutation = useCreateUser()

    const handleRoleClick = role => {
        setSelectedRoles(prev => prev.includes(role)
            ? prev.filter(r => r !== role)
            : [...prev, role]
        )
    }

    const handleDepartmentToggle = (dept) => {
        setSelectedDepartments(prev => 
            prev.includes(dept) 
                ? prev.filter(d => d !== dept) // Usuń jeśli już jest
                : [...prev, dept] // Dodaj jeśli nie ma
        )
    }

    const handleAddDepartment = async () => {
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
        
        if (value && !selectedDepartments.includes(value)) {
            // Utwórz nowy dział jeśli nie istnieje
            if (!departments.includes(value)) {
                try {
                    await createDepartmentMutation.mutateAsync({ name: value, teamId })
                    // Odśwież listę działów
                    await refetchDepartments()
                } catch (error) {
                    console.error('Error creating department:', error)
                    const errorMessage = error.response?.data?.message || 'Błąd podczas tworzenia działu'
                    await showAlert(errorMessage)
                    return
                }
            }
            // Dodaj do wybranych i przełącz na tryb wyboru
            setSelectedDepartments([...selectedDepartments, value])
            setNewDepartmentName('')
            setDepartmentMode('choose')
        }
    }

    const handleUsernameChange = e => {
		const value = e.target.value.toLowerCase()
		setUsername(value)
	}

    const handleSubmit = async e => {
        e.preventDefault()
        
        if (teamInfo && !teamInfo.canAddUser) {
            await showAlert(t('newuser.errorUserLimit', { maxUsers: teamInfo.maxUsers }))
            return
        }

        try {
            // Jeśli użytkownik dodał nowy dział, utwórz go
            if (departmentMode === 'new' && newDepartmentName && !departments.includes(newDepartmentName)) {
                const trimmedName = newDepartmentName.trim()
                
                // Walidacja długości
                if (trimmedName.length < 2) {
                    await showAlert('Nazwa działu musi mieć minimum 2 znaki')
                    return
                }
                if (trimmedName.length > 100) {
                    await showAlert('Nazwa działu może mieć maksimum 100 znaków')
                    return
                }
                
                try {
                    await createDepartmentMutation.mutateAsync({ name: trimmedName, teamId })
                    // Dodaj nowy dział do wybranych
                    if (!selectedDepartments.includes(trimmedName)) {
                        setSelectedDepartments([...selectedDepartments, trimmedName])
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Błąd podczas tworzenia działu'
                    await showAlert(errorMessage)
                    return
                }
            }

            const newUser = { 
                username, 
                firstName, 
                lastName, 
                roles: selectedRoles, 
                department: selectedDepartments // Wyślij tablicę działów
            }
            const response = await createUserMutation.mutateAsync(newUser)
            
            if (response?.success) {
                await showAlert(t('newuser.successMessage', { email: username }))
                
                setUsername('')
                setFirstName('')
                setLastName('')
                setSelectedRoles([])
                setSelectedDepartments([])
                setNewDepartmentName('')
                setDepartmentMode('choose')
            }
        } catch (error) {
            const code = error.response?.data?.code
            if (code === 'USER_EXISTS') {
                await showAlert(t('newuser.error_user_exists'))
            } else {
                await showAlert(error.response?.data?.message || t('newuser.errorGeneric'))
            }
        }
    }

    return (
        <>
            <Sidebar />
            <div className="container my-5 d-flex justify-content-center align-items-center newboxuser">
                <div className="row justify-content-start">
                    <div className="col-md-8">
                        <div>
                            <div className="card-body">
                                <h4><img src="img/add-group.png" alt="ikonka w sidebar" /> {t('newuser.h4')}</h4>
                                
                                {teamInfo && (
                                    <div className={`mb-4 p-3 rounded-md mt-4 ${teamInfo.canAddUser ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} padds`} style={{ padding: '10px' }}>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-4 mr-3">
                                            {t('newuser.department')} 
                                            {selectedDepartments.length > 0 && ` (${selectedDepartments.length} ${selectedDepartments.length === 1 ? t('newuser.departmentSelected') : t('newuser.departmentSelectedPlural')})`}
                                        </label>
                                        {departments.length > 0 && departmentMode === 'choose' ? (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                                                    {departments.map(dep => (
                                                        <label key={dep} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDepartments.includes(dep)}
                                                                onChange={() => handleDepartmentToggle(dep)}
                                                                style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                            <span>{dep}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-2 ms-2 to-left-max"
                                                    onClick={() => { setNewDepartmentName(''); setDepartmentMode('new') }}
                                                >{t('newuser.department2')}</button>
                                            </>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder={t('newuser.department4')}
                                                    value={newDepartmentName}
                                                    onChange={(e) => setNewDepartmentName(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            await handleAddDepartment()
                                                        }
                                                    }}
                                                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddDepartment}
                                                    disabled={!newDepartmentName.trim()}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    style={{ marginBottom: '10px', marginRight: '10px', marginTop: '10px' }}
                                                >
                                                    {t('newuser.departmentAddButton')}
                                                </button>
                                                {departments.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-link p-2 ms-2 to-left-max"
                                                        onClick={() => { setNewDepartmentName(''); setDepartmentMode('choose') }}
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
                                        disabled={createUserMutation.isLoading || (teamInfo && !teamInfo.canAddUser)}
                                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition mb-5 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {createUserMutation.isLoading ? 'Tworzenie użytkownika...' : t('newuser.register')}
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
