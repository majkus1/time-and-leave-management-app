// src/utils/roleHelpers.js

const hasRole = (roles, name) => Array.isArray(roles) && roles.includes(name)

export const isAdmin = roles => hasRole(roles, 'Admin')

export const isHR = roles => hasRole(roles, 'HR')

export const isSupervisor = roles => hasRole(roles, 'Przełożony (Supervisor)')

// Zachowaj kompatybilność wsteczną - aliasy dla starych nazw
export const isDepartmentSupervisor = roles => hasRole(roles, 'Przełożony (Supervisor)')

export const isDepartmentViewer = roles => hasRole(roles, 'Przełożony (Supervisor)')

export const isWorker = roles => hasRole(roles, 'Pracownik (Worker)')
