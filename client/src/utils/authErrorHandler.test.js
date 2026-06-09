import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleAuthError } from './authErrorHandler'

const API_URL = 'http://api.test'

const createAxiosMock = () => {
	const axiosInstance = vi.fn()
	axiosInstance.get = vi.fn()
	axiosInstance.post = vi.fn()
	return axiosInstance
}

describe('authErrorHandler', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('retries once on CSRF 403 by fetching new CSRF token', async () => {
		const axiosInstance = createAxiosMock()
		axiosInstance.get.mockResolvedValueOnce({ data: { csrfToken: 'new-csrf-token' } })
		axiosInstance.mockResolvedValueOnce({ data: { ok: true } })

		const err = {
			config: { url: '/api/workdays', headers: {} },
			response: { status: 403, data: { code: 'CSRF_TOKEN_INVALID' } },
		}

		const result = await handleAuthError({
			err,
			axiosInstance,
			apiUrl: API_URL,
			loggedIn: true,
			logout: vi.fn(),
		})

		expect(axiosInstance.get).toHaveBeenCalledWith(`${API_URL}/api/csrf-token`, expect.objectContaining({
			withCredentials: true,
			skipAuthRefresh: true,
		}))
		expect(axiosInstance).toHaveBeenCalledWith(expect.objectContaining({
			_csrfRetry: true,
			headers: expect.objectContaining({ 'X-CSRF-Token': 'new-csrf-token' }),
		}))
		expect(result).toEqual({ data: { ok: true } })
	})

	it('refreshes token and retries original request when access token is expired (401)', async () => {
		const axiosInstance = createAxiosMock()
		axiosInstance.post.mockResolvedValueOnce({ data: { message: 'Token refreshed' } })
		axiosInstance.mockResolvedValueOnce({ data: { ok: true } })

		const err = {
			config: { url: '/api/users/me' },
			response: { status: 401 },
		}

		const result = await handleAuthError({
			err,
			axiosInstance,
			apiUrl: API_URL,
			loggedIn: true,
			logout: vi.fn(),
		})

		expect(axiosInstance.post).toHaveBeenCalledWith(
			`${API_URL}/api/users/refresh-token`,
			{},
			expect.objectContaining({ withCredentials: true })
		)
		expect(axiosInstance).toHaveBeenCalledWith(expect.objectContaining({ _retry: true }))
		expect(result).toEqual({ data: { ok: true } })
	})

	it('logs out when refresh fails with 401 (simulates expired refresh after long inactivity)', async () => {
		const axiosInstance = createAxiosMock()
		const refreshError = { response: { status: 401 } }
		axiosInstance.post.mockRejectedValueOnce(refreshError)
		const logout = vi.fn().mockResolvedValue()

		const err = {
			config: { url: '/api/boards' },
			response: { status: 401 },
		}

		await expect(handleAuthError({
			err,
			axiosInstance,
			apiUrl: API_URL,
			loggedIn: true,
			logout,
		})).rejects.toEqual(refreshError)

		expect(logout).toHaveBeenCalledTimes(1)
	})

	it('redirects worker to notice on seat overcapacity', async () => {
		const assign = vi.fn()
		vi.stubGlobal('location', { pathname: '/dashboard', assign })

		const err = {
			config: { url: '/api/schedules' },
			response: { status: 403, data: { code: 'FREEMIUM_SEAT_OVER_CAPACITY' } },
		}

		await expect(handleAuthError({
			err,
			axiosInstance: createAxiosMock(),
			apiUrl: API_URL,
			loggedIn: true,
			logout: vi.fn(),
			role: ['Pracownik (Worker)'],
		})).rejects.toEqual(err)

		expect(assign).toHaveBeenCalledWith('/team-access-notice?reason=seats')
		vi.unstubAllGlobals()
	})

	it('sends admin to packages on seat overcapacity outside escape paths', async () => {
		const assign = vi.fn()
		vi.stubGlobal('location', { pathname: '/dashboard', assign })

		const err = {
			config: { url: '/api/schedules' },
			response: { status: 403, data: { code: 'FREEMIUM_SEAT_OVER_CAPACITY' } },
		}

		await expect(handleAuthError({
			err,
			axiosInstance: createAxiosMock(),
			apiUrl: API_URL,
			loggedIn: true,
			logout: vi.fn(),
			role: ['Admin'],
		})).rejects.toEqual(err)

		expect(assign).toHaveBeenCalledWith('/packages')
		vi.unstubAllGlobals()
	})

	it('does not redirect admin already on team management', async () => {
		const assign = vi.fn()
		vi.stubGlobal('location', { pathname: '/team-management', assign })

		const err = {
			config: { url: '/api/schedules' },
			response: { status: 403, data: { code: 'FREEMIUM_SEAT_OVER_CAPACITY' } },
		}

		await expect(handleAuthError({
			err,
			axiosInstance: createAxiosMock(),
			apiUrl: API_URL,
			loggedIn: true,
			logout: vi.fn(),
			role: ['Admin'],
		})).rejects.toEqual(err)

		expect(assign).not.toHaveBeenCalled()
		vi.unstubAllGlobals()
	})

	it('does not log out on regular 403 without CSRF error code', async () => {
		const axiosInstance = createAxiosMock()
		const logout = vi.fn()
		const err = {
			config: { url: '/api/restricted' },
			response: { status: 403, data: { message: 'Access denied' } },
		}

		await expect(handleAuthError({
			err,
			axiosInstance,
			apiUrl: API_URL,
			loggedIn: true,
			logout,
		})).rejects.toEqual(err)

		expect(logout).not.toHaveBeenCalled()
		expect(axiosInstance.get).not.toHaveBeenCalled()
		expect(axiosInstance.post).not.toHaveBeenCalled()
	})
})
