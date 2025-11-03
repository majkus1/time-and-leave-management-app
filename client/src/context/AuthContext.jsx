// context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { API_URL } from '../config.js'
import { useLocation } from 'react-router-dom'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
	const [loggedIn, setLoggedIn] = useState(null)
	const [role, setRole] = useState([])
	const [username, setUsername] = useState(null)
	const [teamId, setTeamId] = useState(null)
	const [isTeamAdmin, setIsTeamAdmin] = useState(false)

	const location = useLocation()

	const publicPaths = [ '/reset-password', '/new-password', '/set-password' ]

	useEffect(() => {
		if (publicPaths.includes(location.pathname)) {
			return
		}

		axios
			.get(`${API_URL}/api/users/me`, { withCredentials: true })
			.then(res => {
				setLoggedIn(true)
				setRole(res.data.roles)
				setUsername(res.data.username)
				setTeamId(res.data.teamId)
				setIsTeamAdmin(res.data.isTeamAdmin)
			})
			.catch(() => {
				setLoggedIn(false)
				setRole([])
				setUsername(null)
				setTeamId(null)
				setIsTeamAdmin(false)
			})
	}, [])

	const logout = async () => {
		try {
			await axios.post(`${API_URL}/api/users/logout`, {}, { withCredentials: true })
			setLoggedIn(false)
			setRole([])
			setUsername(null)
			setTeamId(null)
			setIsTeamAdmin(false)
		} catch (err) {
			console.error('Błąd wylogowania:', err)
		}
	}

	const refreshUserData = async () => {
		try {
			const res = await axios.get(`${API_URL}/api/users/me`, { withCredentials: true })
			setLoggedIn(true)
			setRole(res.data.roles)
			setUsername(res.data.username)
			setTeamId(res.data.teamId)
			setIsTeamAdmin(res.data.isTeamAdmin)
		} catch (error) {
			console.error('Błąd odświeżania danych użytkownika:', error)
		}
	}

	return (
		<AuthContext.Provider
			value={{
				loggedIn,
				role,
				username,
				teamId,
				isTeamAdmin,
				setLoggedIn,
				setRole,
				setUsername,
				setTeamId,
				setIsTeamAdmin,
				logout,
				refreshUserData,
			}}>
			{children}
		</AuthContext.Provider>
	)
}
export const useAuth = () => useContext(AuthContext)

