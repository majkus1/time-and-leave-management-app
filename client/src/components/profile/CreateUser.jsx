import React, { useState, useEffect } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import { useDepartments, useCreateDepartment } from '../../hooks/useDepartments'
import { useTeamInfo } from '../../hooks/useTeam'
import { useCreateUser } from '../../hooks/useUsers'
import { useSettings } from '../../hooks/useSettings'
import { isAdmin, isHR, isSupervisor } from '../../utils/roleHelpers'
import Loader from '../Loader'

const availableRoles = [
    'Admin',
    'Pracownik (Worker)',
    'Przełożony (Supervisor)',
    'HR'
];

function CreateUser() {
    const [username, setUsername] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [position, setPosition] = useState('')
    const [selectedRoles, setSelectedRoles] = useState([])
    const [selectedDepartments, setSelectedDepartments] = useState([]) // Tablica wybranych działów
    const [newDepartmentName, setNewDepartmentName] = useState('') // Nowy dział do dodania
    const [departmentMode, setDepartmentMode] = useState('choose')
    const [managedOnly, setManagedOnly] = useState(false)
    const { t } = useTranslation()
    const { teamId, role } = useAuth()
    const { showAlert } = useAlert()
    const isAdminRole = isAdmin(role)
    const isHRRole = isHR(role)
    const isSupervisorRole = isSupervisor(role)

    // TanStack Query hooks
    const { data: departments = [], refetch: refetchDepartments } = useDepartments(teamId)
    const { data: teamInfo } = useTeamInfo(teamId)
    const { data: settings, isLoading: loadingSettings } = useSettings()
    const createDepartmentMutation = useCreateDepartment()
    const createUserMutation = useCreateUser()
    const managedUsersEnabled = settings?.allowManagedNoAccessUsers === true
    const forcedManagedMode = !isAdminRole && (isHRRole || isSupervisorRole)
    const effectiveManagedOnly = forcedManagedMode || managedOnly

    useEffect(() => {
        if (forcedManagedMode) {
            setManagedOnly(true)
            setSelectedRoles(['Pracownik (Worker)'])
        }
    }, [forcedManagedMode])

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
                ...(effectiveManagedOnly ? {} : { username }),
                firstName, 
                lastName, 
                roles: effectiveManagedOnly ? ['Pracownik (Worker)'] : selectedRoles,
                department: selectedDepartments, // Wyślij tablicę działów
                teamId, // Przekaż teamId dla invalidacji cache
                ...(effectiveManagedOnly && position.trim() ? { position: position.trim() } : {}),
                ...(effectiveManagedOnly ? { managedOnly: true, appAccessEnabled: false } : {})
            }
            const response = await createUserMutation.mutateAsync(newUser)
            
            if (response?.success) {
                await showAlert(response.message || (effectiveManagedOnly ? 'Pracownik został dodany.' : t('newuser.successMessage', { email: username })))
                
                setUsername('')
                setFirstName('')
                setLastName('')
                setPosition('')
                setSelectedRoles([])
                setSelectedDepartments([])
                setNewDepartmentName('')
                setDepartmentMode('choose')
                setManagedOnly(forcedManagedMode)
            }
        } catch (error) {
            const code = error.response?.data?.code
            if (code === 'USER_EXISTS') {
                await showAlert(t('newuser.error_user_exists'))
            } else if (code === 'ROLES_CONFLICT_HR' || code === 'ROLES_CONFLICT_ALL') {
                // Użyj tłumaczenia dla konfliktów ról
                const translationKey = code === 'ROLES_CONFLICT_HR' ? 'newuser.errorRolesConflict' : 'newuser.errorAllRolesConflict'
                await showAlert(t(translationKey))
            } else {
                // Jeśli serwer zwrócił przetłumaczony komunikat, użyj go, w przeciwnym razie użyj domyślnego
                await showAlert(error.response?.data?.message || t('newuser.errorGeneric'))
            }
        }
    }

    if (loadingSettings) return (
        <>
            <Sidebar />
            <div className="content-with-loader"><Loader /></div>
        </>
    )

    if (!isAdminRole && !managedUsersEnabled) {
        return (
            <>
                <Sidebar />
                <div className="container my-5 d-flex justify-content-center align-items-center newboxuser">
                    <div className="card-body editformbox" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', maxWidth: '720px' }}>
                        <h4>Dodawanie pracowników jest wyłączone</h4>
                        <p style={{ color: '#6c757d', margin: 0 }}>Administrator może włączyć dodawanie pracowników bez dostępu w ustawieniach zespołu.</p>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Sidebar />
            <div className="container my-5 d-flex justify-content-center align-items-center newboxuser">
                <div className="row justify-content-start">
                    <div className="col-md-8">
                        <div>
                            <h4><img src="img/add-group.png" alt="ikonka w sidebar" /> {t('newuser.h4')}</h4>
                            <hr />
                            <div className="card-body editformbox" style={{ 
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                padding: '15px',
                                marginBottom: '30px',
                                marginTop: '20px'
                            }}>
                                {teamInfo && (
                                    <div className={`mb-4 p-3 rounded-md ${teamInfo.canAddUser ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} padds`} style={{ padding: '10px' }}>
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
                                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6" id="addusers">
                                    
                                    {(isAdminRole || isHRRole) && managedUsersEnabled && (
                                        <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                                            <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', margin: 0 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={managedOnly}
                                                    onChange={(e) => {
                                                        setManagedOnly(e.target.checked)
                                                        if (e.target.checked) setSelectedRoles(['Pracownik (Worker)'])
                                                    }}
                                                    style={{ marginTop: '4px' }}
                                                />
												<span>
													<strong>{t('newuser.managedNoAccessTitle')}</strong>
													<span style={{ display: 'block', color: '#6c757d', fontSize: '13px' }}>
														{t('newuser.managedNoAccessDescription')}
													</span>
												</span>
                                            </label>
                                        </div>
                                    )}

                                    {!effectiveManagedOnly && (
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
											required={!effectiveManagedOnly}
											className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
                                    )}

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

									{effectiveManagedOnly && (
										<div>
											<label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
												{t('newuser.managedPositionLabel')} <span style={{ color: '#6c757d', fontSize: '12px' }}>({t('newuser.optional')})</span>
											</label>
                                            <br></br>
                                            <input
                                                type="text"
                                                id="position"
												placeholder={t('newuser.managedPositionPlaceholder')}
                                                value={position}
                                                onChange={e => setPosition(e.target.value)}
                                                maxLength={100}
                                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
											<span style={{ display: 'block', color: '#6c757d', fontSize: '13px', marginTop: '6px' }}>
												{t('newuser.managedPositionHint')}
											</span>
										</div>
									)}

                                    <div className="mt-8">
                                        <label className="block text-sm font-medium text-gray-700 mr-3">
                                            {t('newuser.department')} 
                                            {selectedDepartments.length > 0 && ` (${selectedDepartments.length} ${selectedDepartments.length === 1 ? t('newuser.departmentSelected') : t('newuser.departmentSelectedPlural')})`}
                                        </label>
                                        {departments.length > 0 && departmentMode === 'choose' ? (
                                            <>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {departments.map(dep => (
                                                        <div
                                                            key={dep}
                                                            role="button"
                                                            tabIndex={0}
                                                            className={`border px-3 py-1 rounded-md cursor-pointer text-sm select-none ${selectedDepartments.includes(dep) ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-800'}`}
                                                            onClick={() => handleDepartmentToggle(dep)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault()
                                                                    handleDepartmentToggle(dep)
                                                                }
                                                            }}
                                                        >
                                                            {dep}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-2 ms-2 to-left-max mt-2"
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
                                    {!effectiveManagedOnly && (
                                    <div className="mt-8">
                                        <label className="block text-sm font-medium text-gray-700">{t('newuser.giverole')}</label>
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
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={(createUserMutation.isPending || createUserMutation.isLoading) || (teamInfo && !teamInfo.canAddUser)}
                                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition mb-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
                                        {(createUserMutation.isPending || createUserMutation.isLoading) ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {t('newuser.creating')}
                                            </span>
                                        ) : (
                                            t('newuser.register')
                                        )}
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
