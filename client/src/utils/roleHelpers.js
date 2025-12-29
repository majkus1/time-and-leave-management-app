// src/utils/roleHelpers.js

export const isAdmin = roles =>
  roles.includes('Admin');

export const isHR = roles =>
  roles.includes('Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)');

export const isDepartmentSupervisor = roles =>
  roles.includes('Może zatwierdzać urlopy swojego działu (Approve Leaves Department)');

export const isDepartmentViewer = roles =>
  roles.includes('Może widzieć ewidencję czasu pracy i ustalać grafik swojego działu (View Timesheets Department)');

export const isWorker = roles =>
  roles.includes('Pracownik (Worker)');
