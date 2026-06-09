import { isAdmin, isHR } from './roleHelpers'
import { freemiumSeatRecoveryPath, isFreemiumSeatEscapePath } from './freemiumSeatEscape'

export const CSRF_ERROR_CODES = ['CSRF_SECRET_MISSING', 'CSRF_TOKEN_MISSING', 'CSRF_TOKEN_INVALID']

export const handleAuthError = async ({ err, axiosInstance, apiUrl, loggedIn, logout, role = [] }) => {
	const originalRequest = err?.config || {}

	const code = err?.response?.data?.code
	if (err?.response?.status === 403 && typeof window !== 'undefined') {
		if (code === 'TRIAL_LAPSED') {
			const path = window.location.pathname || ''
			if (!path.startsWith('/team-access-notice')) {
				window.location.assign('/team-access-notice?reason=billing')
			}
			throw err
		}
		if (code === 'FREEMIUM_SEAT_OVER_CAPACITY') {
			const path = window.location.pathname || ''
			if (!isFreemiumSeatEscapePath(path, role)) {
				window.location.assign(freemiumSeatRecoveryPath(role))
			}
			throw err
		}
		if (code === 'FREEMIUM_MODULE_DISABLED') {
			const path = window.location.pathname || ''
			if (path !== '/dashboard' && !path.startsWith('/packages')) {
				window.location.assign('/dashboard')
			}
			throw err
		}
		if (code === 'BILLING_ROLE_REQUIRED') {
			const path = window.location.pathname || ''
			if (!path.startsWith('/team-access-notice')) {
				window.location.assign('/team-access-notice?reason=billing')
			}
			throw err
		}
	}

	// Skip error handling for expected 403/404 flows
	if (originalRequest.skipErrorLog && (err?.response?.status === 403 || err?.response?.status === 404)) {
		throw err
	}

	// Retry once when CSRF token/secret is stale or missing
	if (
		err?.response?.status === 403 &&
		CSRF_ERROR_CODES.includes(err?.response?.data?.code) &&
		!originalRequest._csrfRetry
	) {
		originalRequest._csrfRetry = true
		try {
			const csrfRes = await axiosInstance.get(`${apiUrl}/api/csrf-token`, {
				withCredentials: true,
				skipAuthRefresh: true,
				timeout: 10000,
			})
			const csrfToken = csrfRes?.data?.csrfToken
			if (csrfToken) {
				originalRequest.headers = originalRequest.headers || {}
				originalRequest.headers['X-CSRF-Token'] = csrfToken
				return axiosInstance(originalRequest)
			}
		} catch (csrfRefreshError) {
			throw csrfRefreshError
		}
	}

	// Access token expired/invalid -> try refresh once
	if (
		err?.response?.status === 401 &&
		originalRequest.url !== `${apiUrl}/api/users/refresh-token` &&
		!originalRequest._retry &&
		!originalRequest.skipAuthRefresh
	) {
		originalRequest._retry = true
		try {
			await axiosInstance.post(`${apiUrl}/api/users/refresh-token`, {}, {
				withCredentials: true,
				timeout: 10000,
			})
			return axiosInstance(originalRequest)
		} catch (refreshError) {
			if ((refreshError?.response?.status === 401 || refreshError?.response?.status === 403) && loggedIn) {
				await logout?.()
			}
			throw refreshError
		}
	}

	throw err
}
