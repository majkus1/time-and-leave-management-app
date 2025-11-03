const { firmDb } = require('../db/db')
const jwt = require('jsonwebtoken')
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)
const { sendEmail, escapeHtml, getEmailTemplate } = require('../services/emailService')
const { createLog } = require('../services/logService')
const bcrypt = require('bcryptjs')

const { appUrl } = require('../config')


exports.register = async (req, res) => {
	try {
		const { username, firstName, lastName, roles, department } = req.body
		const teamId = req.user.teamId
		const t = req.t

		
		if (!req.user.roles.includes('Admin')) {
			return res.status(403).json({ 
				success: false, 
				message: 'Brak uprawnień do dodawania użytkowników' 
			})
		}

		
		const team = await Team.findById(teamId)
		if (!team) {
			return res.status(404).json({ 
				success: false, 
				message: 'Zespół nie został znaleziony' 
			})
		}

		if (team.currentUserCount >= team.maxUsers) {
			return res.status(400).json({ 
				success: false, 
				message: `Osiągnięto limit użytkowników (${team.maxUsers}). Nie można dodać więcej użytkowników.` 
			})
		}

		
		const existingUser = await User.findOne({ username, teamId })
		if (existingUser) {
			return res.status(400).json({ 
				success: false, 
				code: 'USER_EXISTS',
				message: 'Użytkownik o tym emailu już istnieje w tym zespole' 
			})
		}

		
		const newUser = new User({
			username,
			firstName,
			lastName,
			teamId,
			roles,
			department
		})

		await newUser.save()

	
		team.currentUserCount += 1
		await team.save()

		
		const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
			expiresIn: '24h',
		})

		
		const link = `${appUrl}/set-password/${token}`

		
		const subject = 'Witamy w Planopia - Ustaw swoje hasło'
		const content = `
			<p style="margin: 0 0 16px 0;">Witaj <strong>${escapeHtml(firstName)}</strong>!</p>
			<p style="margin: 0 0 16px 0;">Zostałeś dodany do zespołu <strong>${escapeHtml(team.name)}</strong> w aplikacji Planopia. Cieszymy się, że dołączasz do naszego systemu zarządzania czasem pracy i urlopami.</p>
			<p style="margin: 0 0 24px 0;">Aby ustawić swoje hasło i rozpocząć pracę, kliknij przycisk poniżej:</p>
			<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">Link jest aktywny przez <strong>24 godziny</strong>. Jeśli nie ustawisz hasła w tym czasie, skontaktuj się z administratorem zespołu.</p>
		`
		const body = getEmailTemplate(
			'Witamy w Planopia',
			content,
			'Ustaw hasło',
			link
		)

		await sendEmail(username, link, subject, body)

		
		await createLog(req.user.userId, 'USER_CREATED', `User ${username} created in team ${team.name}`)

		res.status(201).json({
			success: true,
			message: 'Użytkownik został utworzony pomyślnie. Email z linkiem do ustawienia hasła został wysłany.',
			user: {
				id: newUser._id,
				username: newUser.username,
				firstName: newUser.firstName,
				lastName: newUser.lastName,
				roles: newUser.roles,
				department: newUser.department
			},
			teamInfo: {
				currentUserCount: team.currentUserCount,
				maxUsers: team.maxUsers,
				remainingSlots: team.maxUsers - team.currentUserCount
			}
		})

	} catch (error) {
		console.error('User registration error:', error)
		res.status(500).json({ 
			success: false, 
			message: 'Błąd serwera podczas tworzenia użytkownika' 
		})
	}
}

exports.setPassword = async (req, res) => {
	const { password, position } = req.body
	const { token } = req.params
	if (!password || !token) {
		return res.status(400).send('Missing password or token')
	}

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
	if (!passwordRegex.test(password)) {
		return res.status(400).send('Hasło nie spełnia wymagań bezpieczeństwa.')
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await User.findById(decoded.userId)

		if (!user) return res.status(404).send('User not found')

		user.password = await bcrypt.hash(password, 12)
		user.position = position
		await user.save()

		await createLog(user._id, 'SET_PASSWORD', 'Password and position updated successfully')

		res.send('Password and position updated successfully')
	} catch (error) {
		console.error('Error setting password and position:', error)
		res.status(500).send('Failed to set password and position')
	}
}


exports.resetPassword = async (req, res) => {
	const { token, newPassword } = req.body

	if (!token || !newPassword) {
		return res.status(400).send('Token i nowe hasło są wymagane')
	}

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
	if (!passwordRegex.test(newPassword)) {
		return res.status(400).send('Hasło nie spełnia wymagań bezpieczeństwa')
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await User.findById(decoded.userId)

		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		user.password = await bcrypt.hash(newPassword, 12)
		await user.save()

		await createLog(user._id, 'RESET_PASSWORD', 'Password reset successfully')

		res.send('Hasło zostało zresetowane pomyślnie')
	} catch (error) {
		if (error.name === 'JsonWebTokenError') {
			return res.status(400).send('Nieprawidłowy token')
		}
		if (error.name === 'TokenExpiredError') {
			return res.status(400).send('Token wygasł')
		}
		console.error('Error resetting password:', error)
		res.status(500).send('Błąd serwera podczas resetowania hasła')
	}
}


exports.resetPasswordRequest = async (req, res) => {
	const { email } = req.body
	const t = req.t

	try {
		const user = await User.findOne({ username: email })
		if (!user) {
			return res.status(404).send('No user with that email exists.')
		}

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: '1h',
		})

		const resetLink = `${appUrl}/new-password/${token}`
		
		const content = `
			<p style="margin: 0 0 16px 0;">Otrzymaliśmy prośbę o reset hasła do Twojego konta w systemie Planopia.</p>
			<p style="margin: 0 0 24px 0;">Jeśli to Ty wysłałeś tę prośbę, kliknij przycisk poniżej, aby ustawić nowe hasło:</p>
			<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">Link jest aktywny przez <strong>1 godzinę</strong>. Jeśli nie chcesz resetować hasła, zignoruj tę wiadomość.</p>
		`
		const body = getEmailTemplate(
			'Reset hasła - Planopia',
			content,
			'Resetuj hasło',
			resetLink
		)

		await sendEmail(
			email,
			resetLink,
			t('resetpass.subject'),
			body
		)

		await createLog(user._id, 'RESET_PASSWORD_REQUEST', 'Password reset link sent')

		res.send('If a user with that email is registered, a password reset link has been sent.')
	} catch (error) {
		console.error('Error sending password reset email:', error)
		res.status(500).send('Failed to send password reset link.')
	}
}


exports.updatePosition = async (req, res) => {
	const { position } = req.body
	try {
		const user = await User.findById(req.user.userId)
		if (!user) return res.status(404).send('User not found')

		user.position = position
		await user.save()

		res.status(200).send('Stanowisko zostało zaktualizowane')
	} catch (error) {
		console.error('Błąd podczas aktualizacji stanowiska:', error)
		res.status(500).send('Błąd podczas aktualizacji stanowiska')
	}
}


exports.getUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId)
		if (!user) {
			return res.status(404).send('User not found')
		}
		res.json({
			_id: user._id,
			firstName: user.firstName,
			lastName: user.lastName,
			position: user.position,
			role: user.role,
		})
	} catch (error) {
		console.error('Error retrieving user profile:', error)
		res.status(500).send('Error retrieving user profile')
	}
}

exports.getAllUsers = async (req, res) => {
	try {
		const allowedRoles = ['Admin']
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).send('Access denied')
		}

		const users = await User.find().select('username firstName lastName role')
		res.json(users)
	} catch (error) {
		console.error('Error retrieving users:', error)
		res.status(500).send('Failed to retrieve users.')
	}
}



exports.getAllVisibleUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.userId);
        if (!currentUser) return res.status(404).send('Użytkownik nie znaleziony');

        
        const teamFilter = { teamId: currentUser.teamId };

        // Każda rola w zespole widzi wszystkich użytkowników ze swojego zespołu
        // (z wyjątkiem szczególnie wrażliwych informacji)
        const users = await User.find(teamFilter).select('username firstName lastName roles position department teamId');
        return res.json(users);

    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).send('Błąd serwera podczas pobierania listy użytkowników')
    }
};


// exports.getAllUserPlans = async (req, res) => {
// 	try {
// 		const currentUser = await User.findById(req.user.userId)
// 		if (!currentUser) return res.status(404).send('Użytkownik nie znaleziony')

// 		const rolesVisibleTo = {
// 			'Kierownik IT': [''],
// 			'Kierownik BOK': [''],
// 			'Kierownik Bukmacher': [''],
// 			'Kierownik Marketing': [''],
// 			'Urlopy czas pracy': [],
// 			Marketing: [],
// 			Bukmacher: [],
// 			IT: [],
// 			BOK: [],
// 			Zarząd: [],
// 			Admin: [],
// 		}

// 		let filter = {}
// 		if (
// 			currentUser.roles.includes('Admin') ||
// 			currentUser.roles.includes('Zarząd') ||
// 			currentUser.roles.includes('IT') ||
// 			currentUser.roles.includes('Marketing') ||
// 			currentUser.roles.includes('Bukmacher') ||
// 			currentUser.roles.includes('BOK') ||
// 			currentUser.roles.includes('Kierownik Marketing') ||
// 			currentUser.roles.includes('Kierownik Bukmacher') ||
// 			currentUser.roles.includes('Kierownik BOK') ||
// 			currentUser.roles.includes('Kierownik IT') ||
// 			currentUser.roles.includes('Urlopy czas pracy')
// 		) {
// 			filter = {}
// 		} else {
// 			const visibleRoles = currentUser.roles.flatMap(role => rolesVisibleTo[role] || [])
// 			filter = { roles: { $in: visibleRoles } }
// 		}

// 		const users = await User.find(filter).select('username firstName lastName roles position')
// 		res.json(users)
// 	} catch (error) {
// 		console.error('Error fetching users:', error)
// 		res.status(500).send('Błąd serwera podczas pobierania listy użytkowników')
// 	}
// }
exports.getAllUserPlans = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user.userId);
		if (!currentUser) return res.status(404).send('Użytkownik nie znaleziony');

		
		const users = await User.find({ teamId: currentUser.teamId }).select('username firstName lastName roles position department teamId')
		res.json(users)
	} catch (error) {
		console.error('Error fetching users:', error)
		res.status(500).send('Błąd serwera podczas pobierania listy użytkowników')
	}
}

exports.getUserById = async (req, res) => {
	try {
		const { userId } = req.params
		const requestingUser = await User.findById(req.user.userId)

		if (!requestingUser) {
			return res.status(403).send('Brak uprawnień')
		}

		
		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)')

		
		const isSelf = requestingUser._id.toString() === userId

		
		const userToView = await User.findById(userId)
		const isSupervisorOfDepartment =
			requestingUser.roles.includes('Może zatwierdzać urlopy swojego działu (Approve Leaves Department)') &&
			requestingUser.roles.includes('Może widzieć ewidencję czasu pracy swojego działu (View Timesheets Department)') &&
			userToView &&
			requestingUser.department === userToView.department

		if (!(isAdmin || isHR || isSelf || isSupervisorOfDepartment)) {
			return res.status(403).send('Access denied')
		}

		const user = await User.findById(userId).select('firstName lastName username roles position department')
		if (!user) {
			return res.status(404).send('User not found')
		}

		res.json(user)
	} catch (error) {
		console.error('Error fetching user details:', error)
		res.status(500).send('Failed to fetch user details.')
	}
}


exports.updateUserRoles = async (req, res) => {
	const { userId } = req.params;
	const { roles, department } = req.body;

	const allowedRoles = ['Admin'];
	if (!allowedRoles.some(role => req.user.roles.includes(role))) {
		return res.status(403).send('Access denied');
	}

	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony');
		}

		user.roles = roles;
		if (department !== undefined) user.department = department; // DODANE
		await user.save();

		await createLog(req.user.userId, 'UPDATE_ROLES', `Updated roles for user ${user.username}`, req.user.userId);

		res.status(200).json({ message: 'Role/dział użytkownika zostały zaktualizowane', user });
	} catch (error) {
		console.error('Błąd podczas aktualizacji ról/działu użytkownika:', error);
		res.status(500).send('Nie udało się zaktualizować ról/działu użytkownika');
	}
};


exports.deleteUser = async (req, res) => {
	const { userId } = req.params
	const isSelfDeletion = req.user.userId === userId

	try {
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		// Jeśli usuwasz założyciela zespołu - przekaż administrację innemu adminowi
		if (user.isTeamAdmin) {
			// Znajdź innego administratora w zespole
			const otherAdmins = await User.find({ 
				teamId: user.teamId, 
				roles: { $in: ['Admin'] },
				isTeamAdmin: false,
				_id: { $ne: userId }
			})
			
			if (otherAdmins.length === 0) {
				return res.status(400).json({ 
					message: 'Nie można usunąć założyciela zespołu. Najpierw dodaj innego administratora i przekaż mu administrację.' 
				})
			}
			
			// Przekaż administrację pierwszemu znalezionemu adminowi
			const newTeamAdmin = otherAdmins[0]
			newTeamAdmin.isTeamAdmin = true
			await newTeamAdmin.save()
			
			// Zaktualizuj dane zespołu
			const team = await Team.findById(user.teamId)
			if (team) {
				team.adminEmail = newTeamAdmin.username
				team.adminFirstName = newTeamAdmin.firstName
				team.adminLastName = newTeamAdmin.lastName
				await team.save()
			}
			
			// Log transferu administracji
			await createLog(req.user.userId, 'TRANSFER_TEAM_ADMIN', `Przekazano administrację zespołu użytkownikowi ${newTeamAdmin.username}`, req.user.userId)
		}

		// Sprawdź czy użytkownik jest w tym samym zespole (jeśli nie usuwasz siebie)
		if (!isSelfDeletion && user.teamId.toString() !== req.user.teamId.toString()) {
			return res.status(403).json({ message: 'Nie można usunąć użytkownika z innego zespołu' })
		}

		// Jeśli usuwasz siebie - zawsze dozwolone (jeśli nie jest założycielem)
		if (isSelfDeletion) {
			// Sprawdź czy nie jest ostatnim adminem w zespole (nie licząc założyciela)
			if (user.roles && user.roles.includes('Admin')) {
				const teamAdmins = await User.find({ 
					teamId: user.teamId, 
					roles: { $in: ['Admin'] },
					isTeamAdmin: false 
				})
				
				if (teamAdmins.length === 1 && teamAdmins[0]._id.toString() === userId) {
					return res.status(400).json({ 
						message: 'Nie można usunąć konta - jesteś ostatnim administratorem w zespole. Najpierw dodaj innego administratora.' 
					})
				}
			}
		} else {
			// Jeśli usuwasz innego użytkownika - tylko Admin może
			const allowedRoles = ['Admin']
			if (!allowedRoles.some(role => req.user.roles.includes(role))) {
				return res.status(403).json({ message: 'Brak uprawnień - tylko administrator może usuwać innych użytkowników' })
			}

			// Sprawdź czy nie usuwasz ostatniego admina w zespole (nie licząc założyciela)
			if (user.roles && user.roles.includes('Admin')) {
				const teamAdmins = await User.find({ 
					teamId: user.teamId, 
					roles: { $in: ['Admin'] },
					isTeamAdmin: false 
				})
				
				if (teamAdmins.length === 1 && teamAdmins[0]._id.toString() === userId) {
					return res.status(400).json({ 
						message: 'Nie można usunąć ostatniego administratora w zespole. Najpierw dodaj innego administratora.' 
					})
				}
			}
		}

		// Usuń użytkownika
		await User.deleteOne({ _id: userId })

		// Zmniejsz licznik użytkowników w zespole
		const team = await Team.findById(user.teamId)
		if (team && team.currentUserCount > 0) {
			team.currentUserCount -= 1
			await team.save()
		}

		// Log tylko jeśli admin usuwa innego użytkownika (nie samego siebie)
		if (!isSelfDeletion) {
			await createLog(req.user.userId, 'DELETE_USER', `Usunięto użytkownika ${user.username}`, req.user.userId)
		}

		res.status(200).json({ 
			message: 'Użytkownik został usunięty pomyślnie',
			selfDeleted: isSelfDeletion 
		})
	} catch (error) {
		console.error('Błąd podczas usuwania użytkownika:', error)
		res.status(500).json({ message: 'Nie udało się usunąć użytkownika' })
	}
}


exports.getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select('firstName lastName username roles teamId isTeamAdmin')
		if (!user) return res.status(404).json({ message: 'Użytkownik nie został znaleziony' })
		
		return res.status(200).json({
			roles: user.roles,
			username: user.username,
			teamId: user.teamId,
			isTeamAdmin: user.isTeamAdmin
		})
	} catch (error) {
		// console.error('Błąd w /me:', error)
		return res.status(500).json({ message: 'Błąd serwera' })
	}
}


exports.logout = (req, res) => {
	res.clearCookie('token', {
		httpOnly: true,
		secure: true,
		sameSite: 'None',
	})

	res.clearCookie('refreshToken', {
		httpOnly: true,
		secure: true,
		sameSite: 'None',
	})

	res.status(200).json({ message: 'Wylogowano pomyślnie' })
}


exports.changePassword = async (req, res) => {
	const { currentPassword, newPassword } = req.body

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
	if (!passwordRegex.test(newPassword)) {
		return res.status(400).send('Hasło nie spełnia wymagań bezpieczeństwa.')
	}

	try {
		const user = await User.findById(req.user.userId)
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		const passwordIsValid = await bcrypt.compare(currentPassword, user.password)
		if (!passwordIsValid) {
			return res.status(400).send('Obecne hasło jest nieprawidłowe')
		}

		user.password = await bcrypt.hash(newPassword, 12)
		await user.save()

		await createLog(user._id, 'CHANGE_PASSWORD', 'Password changed successfully')

		res.send('Hasło zostało zmienione pomyślnie')
	} catch (error) {
		console.error('Error changing password:', error)
		res.status(500).send('Nie udało się zmienić hasła.')
	}
}


exports.login = async (req, res) => {
	const { username, password } = req.body
	try {
		const user = await User.findOne({ username })
		if (!user) return res.status(401).send('Nieprawidłowe dane logowania')

		const passwordIsValid = await bcrypt.compare(password, user.password)
		if (!passwordIsValid) return res.status(401).send('Nieprawidłowe hasło')

		const accessToken = jwt.sign(
			{ 
				userId: user._id, 
				teamId: user.teamId,
				roles: user.roles, 
				username: user.username,
				isTeamAdmin: user.isTeamAdmin
			},
			process.env.JWT_SECRET,
			{ expiresIn: '15m' }
		)

		const refreshToken = jwt.sign(
			{ 
				userId: user._id, 
				teamId: user.teamId,
				roles: user.roles, 
				username: user.username,
				isTeamAdmin: user.isTeamAdmin
			},
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '7d' }
		)

		res.cookie('token', accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			maxAge: 15 * 60 * 1000,
		})

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		})

		res.status(200).json({
			message: 'Logged in successfully',
			roles: user.roles,
			username: user.username,
			teamId: user.teamId,
			isTeamAdmin: user.isTeamAdmin
		})

		await createLog(user._id, 'LOGIN', 'Login successfully')
	} catch (error) {
		console.error('Login error:', error)
		res.status(500).send('Błąd serwera podczas logowania')
	}
}


exports.refreshToken = (req, res) => {
	const refreshToken = req.cookies.refreshToken
	if (!refreshToken) return res.status(401).json({ message: 'Brak refresh tokena' })

	jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
		if (err) return res.status(403).json({ message: 'Nieprawidłowy refresh token' })

		const newAccessToken = jwt.sign(
			{ 
				userId: decoded.userId, 
				teamId: decoded.teamId,
				roles: decoded.roles, 
				username: decoded.username,
				isTeamAdmin: decoded.isTeamAdmin
			},
			process.env.JWT_SECRET,
			{ expiresIn: '15m' }
		)

		const newRefreshToken = jwt.sign(
			{ 
				userId: decoded.userId, 
				teamId: decoded.teamId,
				roles: decoded.roles, 
				username: decoded.username,
				isTeamAdmin: decoded.isTeamAdmin
			},
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '7d' }
		)

		res.cookie('token', newAccessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			maxAge: 15 * 60 * 1000,
		})

		res.cookie('refreshToken', newRefreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		})

		res.json({ message: 'Token refreshed' })
	})
}
