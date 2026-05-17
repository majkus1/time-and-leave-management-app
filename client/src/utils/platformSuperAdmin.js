export const PLATFORM_SUPER_ADMIN_EMAIL = 'michalipka1@gmail.com'

export function isPlatformSuperAdmin(username) {
	if (!username || typeof username !== 'string') return false
	return username.trim().toLowerCase() === PLATFORM_SUPER_ADMIN_EMAIL.toLowerCase()
}
