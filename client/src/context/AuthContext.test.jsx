import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import { AuthProvider, useAuth } from './AuthContext'
import { API_URL } from '../config.js'

vi.mock('axios', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
	},
}))

const TestProbe = () => {
	const { loggedIn, isCheckingAuth, username } = useAuth()
	return (
		<div>
			<div data-testid="logged-in">{String(loggedIn)}</div>
			<div data-testid="checking-auth">{String(isCheckingAuth)}</div>
			<div data-testid="username">{username || ''}</div>
		</div>
	)
}

const renderWithProvider = () =>
	render(
		<AuthProvider>
			<TestProbe />
		</AuthProvider>
	)

describe('AuthContext session bootstrap', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		window.history.pushState({}, '', '/login')
	})

	it('checks existing session even on /login route and restores auth state', async () => {
		axios.post.mockResolvedValueOnce({ data: { message: 'Token refreshed' } })
		axios.get.mockResolvedValueOnce({
			data: {
				_id: 'user-1',
				roles: ['Admin'],
				username: 'test@example.com',
				teamId: 'team-1',
				isTeamAdmin: true,
			},
		})

		renderWithProvider()

		await waitFor(() => {
			expect(screen.getByTestId('checking-auth')).toHaveTextContent('false')
			expect(screen.getByTestId('logged-in')).toHaveTextContent('true')
			expect(screen.getByTestId('username')).toHaveTextContent('test@example.com')
		})

		expect(axios.post).toHaveBeenCalledWith(
			`${API_URL}/api/users/refresh-token`,
			{},
			expect.objectContaining({
				withCredentials: true,
				skipAuthRefresh: true,
			})
		)
		expect(axios.get).toHaveBeenCalledWith(
			`${API_URL}/api/users/me`,
			expect.objectContaining({
				withCredentials: true,
				skipAuthRefresh: true,
			})
		)
	})

	it('keeps user logged in when refresh token is missing but access token is still valid', async () => {
		axios.post.mockRejectedValueOnce({ response: { status: 401 } })
		axios.get.mockResolvedValueOnce({
			data: {
				_id: 'user-2',
				roles: ['Pracownik (Worker)'],
				username: 'worker@example.com',
				teamId: 'team-2',
				isTeamAdmin: false,
			},
		})

		renderWithProvider()

		await waitFor(() => {
			expect(screen.getByTestId('checking-auth')).toHaveTextContent('false')
			expect(screen.getByTestId('logged-in')).toHaveTextContent('true')
			expect(screen.getByTestId('username')).toHaveTextContent('worker@example.com')
		})
	})

	it('falls back to logged out state when both refresh and /me fail', async () => {
		axios.post.mockRejectedValueOnce({ response: { status: 401 } })
		axios.get.mockRejectedValueOnce({ response: { status: 401 } })

		renderWithProvider()

		await waitFor(() => {
			expect(screen.getByTestId('checking-auth')).toHaveTextContent('false')
			expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
			expect(screen.getByTestId('username')).toHaveTextContent('')
		})
	})
})
