/**
 * Password Validation Service
 * 
 * Implements password security requirements validation following SOLID principles.
 * Single Responsibility: This service is solely responsible for password validation logic.
 */

/**
 * Password security requirements:
 * - At least 8 characters long
 * - Contains at least one lowercase letter
 * - Contains at least one uppercase letter
 * - Contains at least one digit
 * - Contains at least one special character (non-alphanumeric)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

/**
 * Validates if a password meets security requirements
 * 
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password meets all requirements, false otherwise
 */
const isValidPassword = (password) => {
	if (!password || typeof password !== 'string') {
		return false
	}
	
	return PASSWORD_REGEX.test(password)
}

/**
 * Gets a user-friendly error message for invalid passwords
 * 
 * @param {string} language - Language code ('pl' or 'en'), defaults to 'pl'
 * @returns {string} - Error message in the specified language
 */
const getPasswordErrorMessage = (language = 'pl') => {
	const messages = {
		pl: 'Hasło nie spełnia wymagań bezpieczeństwa. Hasło musi zawierać co najmniej 8 znaków, w tym małą literę, wielką literę, cyfrę i znak specjalny.',
		en: 'Password does not meet security requirements. Password must contain at least 8 characters, including a lowercase letter, uppercase letter, digit, and special character.'
	}
	
	return messages[language] || messages.pl
}

/**
 * Validates password and returns validation result with error message if invalid
 * 
 * @param {string} password - The password to validate
 * @param {string} language - Language code for error messages ('pl' or 'en')
 * @returns {{ isValid: boolean, errorMessage?: string }} - Validation result
 */
const validatePassword = (password, language = 'pl') => {
	if (!isValidPassword(password)) {
		return {
			isValid: false,
			errorMessage: getPasswordErrorMessage(language)
		}
	}
	
	return {
		isValid: true
	}
}

module.exports = {
	isValidPassword,
	getPasswordErrorMessage,
	validatePassword,
	PASSWORD_REGEX
}
