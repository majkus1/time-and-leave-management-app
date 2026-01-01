// src/utils/roleHelpers.js

export const isAdmin = roles =>
  roles.includes('Admin');

export const isHR = roles =>
  roles.includes('HR');

export const isSupervisor = roles =>
  roles.includes('Przełożony (Supervisor)');

// Zachowaj kompatybilność wsteczną - aliasy dla starych nazw
export const isDepartmentSupervisor = roles =>
  roles.includes('Przełożony (Supervisor)');

export const isDepartmentViewer = roles =>
  roles.includes('Przełożony (Supervisor)');

export const isWorker = roles =>
  roles.includes('Pracownik (Worker)');
