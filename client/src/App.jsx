import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import CreateUser from './components/profile/CreateUser'
import Login from './components/profile/Login'
import TeamRegistration from './components/profile/TeamRegistration'
import Dashboard from './components/dashboard/Dashboard'
import WorkTimePage from './components/dashboard/WorkTimePage'
import ChangePassword from './components/profile/ChangePassword'
import SetPassword from './components/profile/SetPassword'
import ResetPassword from './components/profile/ResetPassword'
import ProtectedRoute from './components/route/ProtectedRoute'
import Logs from './components/profile/Logs'
import Settings from './components/profile/Settings'
import AdminUserList from './components/listusers/AdminUserList'
import UserCalendar from './components/workcalendars/UserCalendar'
import LeaveRequestForm from './components/leavework/LeaveRequestForm'
import AdminLeaveRequests from './components/leavework/AdminLeaveRequests'
import LeaveRequestPDFPreview from './components/leavework/LeaveRequestPDFPreview'
import LeavePlanner from './components/leavework/LeavePlanner'
import EmployeeListPlanner from './components/listusers/EmployeeListPlanner'
import EmployeeLeaveCalendar from './components/leavework/EmployeeLeaveCalendar'
import AdminAllLeaveCalendar from './components/leavework/AdminAllLeaveCalendar'
import VacationListUser from './components/listusers/VacationListUser'
import NewPassword from './components/profile/NewPassword'
import Chat from './components/chat/Chat'
import BoardList from './components/boards/BoardList'
import Board from './components/boards/Board'
import ScheduleList from './components/schedule/ScheduleList'
import Schedule from './components/schedule/Schedule'
import Announcements from './components/announcements/Announcements'
import { useSupervisorConfig } from './hooks/useSupervisor'
// import ProductPromotion from './components/ProductPromotion'
// import ENProductPromotion from './components/ENProductPromotion.jsx'
// import ENBlogOne from './components/ENBlogOne.jsx'
// import Blog from './components/Blog.jsx'
// import ENBlog from './components/ENBlog.jsx'
// import BlogOne from './components/BlogOne.jsx'
// import BlogThree from './components/BlogThree.jsx'
// import ENBlogThree from './components/ENBlogThree.jsx'
import HelpTicket from './components/tickets/HelpTicket.jsx'
import FreemiumRouteSync from './components/route/FreemiumRouteSync.jsx'
import TutorialAutoOpen from './components/tutorial/TutorialAutoOpen.jsx'
import HomeRedirect from './components/route/HomeRedirect.jsx'
import FreemiumDashboardGuard from './components/route/FreemiumDashboardGuard.jsx'
import TeamAccessNoticePage from './components/route/TeamAccessNoticePage.jsx'
import SettingsRouteGate from './components/route/SettingsRouteGate.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Loader from './components/Loader'
import Legal from './components/legal/Legal'
import PWANavigationBar from './components/PWANavigationBar'
import QRScan from './components/qr/QRScan'
import AIAssistant from './components/aiAssistant/AIAssistant'
import PackagesPage from './components/billing/PackagesPage'
import { isPlatformSuperAdmin } from './utils/platformSuperAdmin'
import { isAdmin, isHR, isSupervisor, isWorker } from './utils/roleHelpers'
import { handleAuthError } from './utils/authErrorHandler'
import { useFreemiumAccess } from './hooks/useFreemiumAccess'
import { API_URL } from './config.js'
import '../src/style.css'
import './theme.css'
import { useAuth } from './context/AuthContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AlertProvider } from './context/AlertContext'
import { TutorialProvider } from './context/TutorialContext'
import { SocketProvider } from './context/SocketContext'
import TimerChrome from './components/timer/TimerChrome'
import MarketingCookieConsent from './components/MarketingCookieConsent'

// Setup QueryClient z optymalnymi ustawieniami
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 2 * 60 * 1000, // 2 minuty domyślnie
			cacheTime: 5 * 60 * 1000, // 5 minut
			refetchOnWindowFocus: true, // Refetch przy powrocie do zakładki
			refetchOnReconnect: true, // Refetch po połączeniu z internetem
			retry: 1, // 1 retry przy błędzie
		},
	},
})

axios.defaults.withCredentials = true

function AppContent() {
	const location = useLocation()
	const { loggedIn, role, logout, isCheckingAuth, userId, username } = useAuth()
	
	// HIERARCHIA RÓL: Admin > HR > Przełożony
	// Sprawdź konfigurację przełożonego jeśli jest przełożonym (ale nie Admin ani HR)
	const isSupervisorRole = isSupervisor(role)
	const isAdminRole = isAdmin(role)
	const isHRRole = isHR(role)
	// Przy blokadzie miejsc (freemium > 5 kont) serwer odrzuca to zapytanie — nie ma po co go wysyłać.
	const { freemiumSeatBlocked } = useFreemiumAccess({ enabled: !!loggedIn })
	const { data: supervisorConfig } = useSupervisorConfig(
		userId,
		isSupervisorRole && !isAdminRole && !isHRRole && !freemiumSeatBlocked
	)

	// Sprawdź uprawnienia zgodnie z hierarchią ról
	// Admin i HR mają zawsze pełny dostęp, ignorujemy SupervisorConfig
	const canApproveLeaves = isAdminRole || isHRRole 
		? true // Admin i HR mają zawsze dostęp
		: (isSupervisorRole && (supervisorConfig?.permissions?.canApproveLeaves !== false)) // Przełożony - sprawdź konfigurację
	const canViewTimesheets = isAdminRole || isHRRole 
		? true // Admin i HR mają zawsze dostęp
		: (isSupervisorRole && (supervisorConfig?.permissions?.canViewTimesheets !== false)) // Przełożony - sprawdź konfigurację

	useEffect(() => {
		const interceptor = axios.interceptors.response.use(
			res => res,
			err => handleAuthError({ err, axiosInstance: axios, apiUrl: API_URL, loggedIn, logout, role })
		)
		return () => axios.interceptors.response.eject(interceptor)
	}, [loggedIn, logout, role])

	function ScrollToHashElement() {
		const { hash } = useLocation()

		useEffect(() => {
			if (hash) {
				const element = document.querySelector(hash)
				if (element) {
					setTimeout(() => {
						element.scrollIntoView({ behavior: 'smooth' })
					}, 100)
				}
			}
		}, [hash])

		return null
	}

	return (
		<>
			<TimerChrome />
			<MarketingCookieConsent />

		<div>
			<ScrollToHashElement />
			<ScrollToTop />
			<FreemiumRouteSync />
			<TutorialAutoOpen />
			<PWANavigationBar />
			{isCheckingAuth ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
				<Routes>
					<Route path="/login" element={loggedIn ? <HomeRedirect /> : <Login />} />
					<Route path="/team-registration" element={loggedIn ? <HomeRedirect /> : <TeamRegistration />} />
					<Route path="/" element={loggedIn ? <HomeRedirect /> : <Login />} />
					{/* <Route path="/en" element={<ENProductPromotion />} />
					<Route path="/blog" element={<Blog />} />
					<Route path="/en/blog" element={<ENBlog />} />
					<Route path="/blog/ewidencja-czasu-pracy-online" element={<BlogOne />} />
					<Route path="/en/blog/time-tracking-online" element={<ENBlogOne />} />
					<Route path="/blog/planowanie-urlopow" element={<BlogThree />} />
					<Route path="/en/blog/leave-planning" element={<ENBlogThree />} /> */}
					<Route path="/set-password/:token" element={<SetPassword />} />
					<Route path="/reset-password" element={<ResetPassword />} />
					<Route path="/new-password/:token" element={<NewPassword />} />
					<Route path="/qr-scan/:code" element={<QRScan />} />
					<Route element={<ProtectedRoute isLoggedIn={loggedIn} handleLogout={logout} />}>
					<Route path="/dashboard" element={<FreemiumDashboardGuard><Dashboard /></FreemiumDashboardGuard>} />
					<Route path="/work-time" element={<WorkTimePage />} />
					<Route path="/boards" element={<BoardList />} />
					<Route path="/boards/:boardId" element={<Board />} />
					<Route path="/schedule" element={<ScheduleList />} />
					<Route path="/schedule/:scheduleId" element={<Schedule />} />
					<Route path="/chat" element={<Chat />} />
					<Route path="/ai-assistant" element={<AIAssistant />} />
					<Route path="/announcements" element={<Announcements />} />
					<Route path="/create-user" element={isAdminRole || isHRRole || isSupervisorRole ? <CreateUser /> : <Navigate to="/" />} />
						<Route path="/leave-request" element={<LeaveRequestForm />} />
					<Route
						path="/calendars-list"
						element={
							isAdminRole || isHRRole || (isSupervisorRole && canViewTimesheets) ? (
								<AdminUserList />
							) : (
								<Navigate to="/" />
							)
						}
					/>
					<Route
						path="/leave-list"
						element={
							isAdminRole || isHRRole || (isSupervisorRole && canApproveLeaves) ? (
								<VacationListUser />
							) : (
								<Navigate to="/" />
							)
						}
					/>
					<Route
						path="/leave-requests/:userId"
						element={
							isAdminRole || isHRRole || (isSupervisorRole && canApproveLeaves) ? (
								<AdminLeaveRequests />
							) : (
								<Navigate to="/" />
							)
						}
					/>
						<Route path="/leave-request-pdf-preview" element={<LeaveRequestPDFPreview />} />
						<Route path="/edit-profile" element={<ChangePassword />} />
						<Route path="/documents" element={isAdmin(role) ? <Legal /> : <Navigate to="/" />} />
						<Route path="/team-management" element={(isAdmin(role) || isPlatformSuperAdmin(username)) ? <Logs /> : <Navigate to="/" />} />
						<Route path="/settings" element={<SettingsRouteGate />} />
						<Route path="/team-access-notice" element={<TeamAccessNoticePage />} />
					<Route
						path="/work-calendars/:userId"
						element={
							isAdminRole || isHRRole || (isSupervisorRole && canViewTimesheets) ? (
								<UserCalendar />
							) : (
								<Navigate to="/" />
							)
						}
					/>
						<Route path="/leave-planner" element={<LeavePlanner />} />
						<Route
							path="/leave-planning-list"
							element={
								isAdmin(role) || isHR(role) || isSupervisor(role) ? (
									<EmployeeListPlanner />
								) : (
									<Navigate to="/" />
								)
							}
						/>
						<Route
							path="/helpcenter"
							element={isAdminRole ? <HelpTicket /> : <Navigate to="/dashboard" replace />}
						/>
						<Route
							path="/packages"
							element={
								isAdminRole || isHRRole ? (
									<PackagesPage />
								) : (
									<Navigate to="/team-access-notice?reason=billing" replace />
								)
							}
						/>
						<Route path="/leave-plans/:userId" element={<EmployeeLeaveCalendar />} />
						<Route path="/all-leave-plans" element={<AdminAllLeaveCalendar />} />
					</Route>
				</Routes>
			)}
			</div>
		</>
	)
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<Router
				future={{
					v7_startTransition: true,
					v7_relativeSplatPath: true,
				}}
			>
				<ThemeProvider>
				<AlertProvider>
					<AuthProvider>
						<TutorialProvider>
							<SocketProvider>
								<AppContent />
							</SocketProvider>
						</TutorialProvider>
					</AuthProvider>
				</AlertProvider>
				</ThemeProvider>
			</Router>
		</QueryClientProvider>
	)
}

export default App
