const { firmDb } = require('../db/db')
const jwt = require('jsonwebtoken')
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)
const Board = require('../models/Board')(firmDb)
const { sendEmail, escapeHtml, getEmailTemplate } = require('../services/emailService')
const { createLog } = require('../services/logService')
const bcrypt = require('bcryptjs')
const { updateSpecialTeamLimit } = require('./teamController')
const { createChannelForDepartment, createGeneralChannel, syncGeneralChannelMembers } = require('./chatController')
const { createBoardForDepartment, createTeamBoard } = require('./boardController')
const { createScheduleForDepartment } = require('./scheduleController')

const { appUrl } = require('../config')

// Funkcja walidująca role - sprawdza wzajemnie wykluczające się kombinacje ról
// Przyjmuje opcjonalną funkcję tłumaczeń t() dla komunikatów błędów
const validateMutuallyExclusiveRoles = (roles, t = null) => {
	const supervisorRole = 'Przełożony (Supervisor)'
	const hrRole = 'HR'
	
	const hasSupervisor = roles.includes(supervisorRole)
	const hasHR = roles.includes(hrRole)
	
	// Nie można mieć HR z rolą Przełożony (opcjonalnie - można to zmienić jeśli potrzebne)
	// Na razie pozwalamy na obie role jednocześnie, ale można to zmienić
	// if (hasHR && hasSupervisor) {
	// 	const message = t ? t('newuser.errorRolesConflict') : 'Nie można mieć jednocześnie roli HR i Przełożony.'
	// 	return {
	// 		valid: false,
	// 		message,
	// 		code: 'ROLES_CONFLICT_HR_SUPERVISOR'
	// 	}
	// }
	
	return { valid: true }
}


exports.register = async (req, res) => {
	try {
		const { username, firstName, lastName, roles, department, vacationDays } = req.body
		const teamId = req.user.teamId

		// Get translation function - use req.t if available, otherwise create instance with default 'pl'
		let t = req.t
		if (!t) {
			const i18next = require('i18next')
			const Backend = require('i18next-fs-backend')
			const i18nInstance = i18next.createInstance()
			await i18nInstance.use(Backend).init({
				lng: 'pl', // Default to Polish
				fallbackLng: 'pl',
				backend: {
					loadPath: __dirname + '/../locales/{{lng}}/translation.json',
				},
			})
			t = i18nInstance.t.bind(i18nInstance)
		}

		
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

		// Update maxUsers for special teams if needed
		await updateSpecialTeamLimit(team)

		// Policz rzeczywistą liczbę aktywnych użytkowników w zespole (bez soft-deleted)
		const actualUserCount = await User.countDocuments({ 
			teamId, 
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		
		if (actualUserCount >= team.maxUsers) {
			// Zaktualizuj currentUserCount aby było zgodne z rzeczywistością
			team.currentUserCount = actualUserCount
			await team.save()
			
			return res.status(400).json({ 
				success: false, 
				message: `Osiągnięto limit użytkowników (${team.maxUsers}). Nie można dodać więcej użytkowników.` 
			})
		}

		
		const existingUser = await User.findOne({ 
			username, 
			teamId, 
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		if (existingUser) {
			return res.status(400).json({ 
				success: false, 
				code: 'USER_EXISTS',
				message: 'Użytkownik o tym emailu już istnieje w tym zespole' 
			})
		}

		// Walidacja wzajemnie wykluczających się ról
		const roleValidation = validateMutuallyExclusiveRoles(roles, t)
		if (!roleValidation.valid) {
			return res.status(400).json({
				success: false,
				message: roleValidation.message,
				code: roleValidation.code
			})
		}

		
		const newUser = new User({
			username,
			firstName,
			lastName,
			teamId,
			roles,
			department,
			...(vacationDays !== undefined && vacationDays !== null && vacationDays !== '' ? { vacationDays: Number(vacationDays) } : {})
		})

		await newUser.save()

		// Create channels, boards, and schedules for user's departments if they don't exist
		if (department && Array.isArray(department) && department.length > 0) {
			for (const deptName of department) {
				try {
					await createChannelForDepartment(teamId, deptName)
				} catch (error) {
					console.error(`Error creating channel for department ${deptName}:`, error)
					// Don't fail the request if channel creation fails
				}
				try {
					await createBoardForDepartment(teamId, deptName)
				} catch (error) {
					console.error(`Error creating board for department ${deptName}:`, error)
				}
				try {
					await createScheduleForDepartment(teamId, deptName)
				} catch (error) {
					console.error(`Error creating schedule for department ${deptName}:`, error)
				}
			}
		} else if (department && typeof department === 'string') {
			try {
				await createChannelForDepartment(teamId, department)
			} catch (error) {
				console.error(`Error creating channel for department ${department}:`, error)
			}
			try {
				await createBoardForDepartment(teamId, department)
			} catch (error) {
				console.error(`Error creating board for department ${department}:`, error)
			}
			try {
				await createScheduleForDepartment(teamId, department)
			} catch (error) {
				console.error(`Error creating schedule for department ${department}:`, error)
			}
		}

		// Sync general channel members to include the new user
		try {
			await syncGeneralChannelMembers(teamId)
		} catch (error) {
			console.error('Error syncing general channel members:', error)
			// Don't fail the request if sync fails
		}

		// Sync team board members to include the new user
		try {
			await createTeamBoard(teamId)
		} catch (error) {
			console.error('Error syncing team board members:', error)
			// Don't fail the request if sync fails
		}

		// Policz rzeczywistą liczbę użytkowników i zaktualizuj currentUserCount
		const updatedUserCount = await User.countDocuments({ 
			teamId, 
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		team.currentUserCount = updatedUserCount
		await team.save()

		// Automatyczna akceptacja DPA dla teamAdmin przy dodaniu pierwszego pracownika (poza adminem)
		// Jeśli to jest pierwszy użytkownik (poza adminem), automatycznie zaakceptuj DPA dla teamAdmin
		if (updatedUserCount === 2) { // Admin + pierwszy nowy użytkownik
			try {
				const LegalDocument = require('../models/LegalDocument')(firmDb);
				const LegalAcceptance = require('../models/LegalAcceptance')(firmDb);

				// Znajdź teamAdmin (użytkownik z rolą Admin w tym zespole)
				const teamAdmin = await User.findOne({ 
					teamId, 
					roles: { $in: ['Admin'] },
					$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
				});

				if (teamAdmin) {
					// Sprawdź czy teamAdmin już zaakceptował DPA dla aktualnej wersji
					const currentDPA = await LegalDocument.findOne({ type: 'DPA', isCurrent: true });

					if (currentDPA) {
						const existingAcceptance = await LegalAcceptance.findOne({
							userId: teamAdmin._id,
							teamId: teamId,
							documentType: 'DPA',
							documentVersion: currentDPA.version
						});

						// Jeśli nie ma akceptacji dla aktualnej wersji DPA, utwórz ją
						if (!existingAcceptance) {
							const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
							const userAgent = req.headers['user-agent'] || '';

							await LegalAcceptance.create({
								userId: teamAdmin._id,
								teamId: teamId,
								documentType: 'DPA',
								documentVersion: currentDPA.version,
								documentId: currentDPA._id,
								acceptedAt: new Date(),
								ipAddress,
								userAgent
							});

							console.log(`Automatic DPA acceptance created for teamAdmin ${teamAdmin.username} when first employee was added`);
						}
					}
				}
			} catch (error) {
				console.error('Error automatically accepting DPA for teamAdmin:', error);
				// Nie przerywamy procesu tworzenia użytkownika w przypadku błędu akceptacji DPA
			}
		}

		
		const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
			expiresIn: '24h',
		})

		
		const link = `${appUrl}/set-password/${token}`

		const subject = t('email.welcome.subject')
		const content = `
			<p style="margin: 0 0 16px 0;">${t('email.welcome.greeting', { firstName: escapeHtml(firstName) })}</p>
			<p style="margin: 0 0 16px 0;">${t('email.welcome.teamAdded', { teamName: escapeHtml(team.name) })}</p>
			<p style="margin: 0 0 24px 0;">${t('email.welcome.setPassword')}</p>
			<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.welcome.linkExpires')}</p>
		`
		const body = getEmailTemplate(
			t('email.welcome.title'),
			content,
			t('email.welcome.buttonText'),
			link,
			t
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
		const user = await User.findOne({ 
			username: email,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		if (!user) {
			return res.status(404).send('No user with that email exists.')
		}

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: '1h',
		})

		const resetLink = `${appUrl}/new-password/${token}`
		
		const content = `
			<p style="margin: 0 0 16px 0;">${t('resetpass.requestReceived')}</p>
			<p style="margin: 0 0 24px 0;">${t('resetpass.clickButton')}</p>
			<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('resetpass.linkExpires')}</p>
		`
		const body = getEmailTemplate(
			t('resetpass.title'),
			content,
			t('resetpass.buttonText'),
			resetLink,
			t
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

exports.updateName = async (req, res) => {
	const { firstName, lastName } = req.body
	try {
		const user = await User.findById(req.user.userId)
		if (!user) return res.status(404).send('User not found')

		if (firstName !== undefined) user.firstName = firstName
		if (lastName !== undefined) user.lastName = lastName
		await user.save()

		res.status(200).send('Imię i nazwisko zostały zaktualizowane')
	} catch (error) {
		console.error('Błąd podczas aktualizacji imienia i nazwiska:', error)
		res.status(500).send('Błąd podczas aktualizacji imienia i nazwiska')
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
			roles: user.roles, // Zwracamy roles (tablica) zamiast role
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

		const users = await User.find({
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('username firstName lastName role')
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

        // Sprawdź czy to super admin
        const isSuperAdmin = currentUser.username === 'michalipka1@gmail.com';

        if (isSuperAdmin) {
            // Super admin widzi wszystkich aktywnych użytkowników ze wszystkich zespołów (bez soft-deleted)
            const users = await User.find({
                $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
            }).select('username firstName lastName roles position department teamId password').lean();
            
            // Pobierz informacje o zespołach dla każdego użytkownika
            const usersWithTeams = await Promise.all(
                users.map(async (user) => {
                    const team = await Team.findById(user.teamId).select('name adminEmail').lean();
                    return {
                        ...user,
                        teamName: team ? team.name : 'Nieznany zespół',
                        teamAdminEmail: team ? team.adminEmail : null,
                        hasPassword: !!user.password // Dodaj informację czy użytkownik ma hasło
                    };
                })
            );
            
            return res.json(usersWithTeams);
        }

        // Zwykły użytkownik widzi tylko aktywnych użytkowników ze swojego zespołu (bez soft-deleted)
        const teamFilter = { 
            teamId: currentUser.teamId,
            $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
        };
        
        // HIERARCHIA RÓL: Admin > HR > Przełożony > Pracownik
        // Sprawdź najpierw Admin
        const isAdmin = currentUser.roles && currentUser.roles.includes('Admin');
        if (isAdmin) {
            const users = await User.find(teamFilter).select('username firstName lastName roles position department teamId password').lean();
            const usersWithPasswordInfo = users.map(user => ({
                ...user,
                hasPassword: !!user.password
            }));
            return res.json(usersWithPasswordInfo);
        }
        
        // Potem sprawdź HR
        const isHR = currentUser.roles && currentUser.roles.includes('HR');
        if (isHR) {
            const users = await User.find(teamFilter).select('username firstName lastName roles position department teamId password').lean();
            const usersWithPasswordInfo = users.map(user => ({
                ...user,
                hasPassword: !!user.password
            }));
            return res.json(usersWithPasswordInfo);
        }
        
        // Na końcu sprawdź Przełożony - tylko jeśli nie ma Admin ani HR
        const isSupervisor = currentUser.roles && currentUser.roles.includes('Przełożony (Supervisor)');
        if (isSupervisor) {
            const SupervisorConfig = require('../models/SupervisorConfig')(firmDb);
            const config = await SupervisorConfig.findOne({ supervisorId: currentUser._id });
            
            // Pobierz wszystkich aktywnych użytkowników ze swojego zespołu (bez soft-deleted)
            const allTeamUsers = await User.find(teamFilter).select('username firstName lastName roles position department teamId').lean();
            
            // Jeśli nie ma konfiguracji, domyślnie pokazuj użytkowników z działu
            if (!config) {
                // Brak konfiguracji - pokaż użytkowników z działu
                const supervisorDepts = Array.isArray(currentUser.department) ? currentUser.department : (currentUser.department ? [currentUser.department] : []);
                if (supervisorDepts.length > 0) {
                    const filteredUsers = allTeamUsers.filter(user => {
                        const userDepts = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : []);
                        return userDepts.some(dept => supervisorDepts.includes(dept));
                    });
                    return res.json(filteredUsers);
                } else {
                    return res.json([]);
                }
            }
            
            // Jeśli nie ma uprawnień do widzenia ewidencji, nie pokazuj nikogo
            if (!config.permissions.canViewTimesheets) {
                return res.json([]);
            }
            
            const { canSupervisorViewTimesheets } = require('../services/roleService');
            
            // Filtruj użytkowników na podstawie konfiguracji przełożonego
            const filteredUsers = [];
            for (const user of allTeamUsers) {
                // Konwertuj na pełny obiekt User dla helpera
                const userObj = await User.findById(user._id);
                if (userObj) {
                    const canView = await canSupervisorViewTimesheets(currentUser, userObj);
                    if (canView) {
                        filteredUsers.push(user);
                    }
                }
            }
            
            return res.json(filteredUsers);
        }
        
        // Zwykły użytkownik (nie admin) - bez informacji o haśle (tylko aktywni)
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

		
		const users = await User.find({ 
			teamId: currentUser.teamId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('username firstName lastName roles position department teamId')
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

		// Sprawdź czy to super admin
		const isSuperAdmin = requestingUser.username === 'michalipka1@gmail.com'
		
		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')
		const isSelf = requestingUser._id.toString() === userId

		
		const userToView = await User.findOne({
			_id: userId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		if (!userToView) {
			return res.status(404).send('User not found')
		}
		
		// Sprawdź czy użytkownicy są w tym samym zespole
		const isSameTeam = requestingUser.teamId.toString() === userToView.teamId.toString()
		
		// Sprawdź czy użytkownicy mają wspólny dział (dla wielu działów)
		const requestingDepts = Array.isArray(requestingUser.department) ? requestingUser.department : (requestingUser.department ? [requestingUser.department] : [])
		const userToViewDepts = Array.isArray(userToView.department) ? userToView.department : (userToView.department ? [userToView.department] : [])
		const hasCommonDepartment = requestingDepts.some(dept => userToViewDepts.includes(dept))
		
		// HIERARCHIA RÓL: Admin > HR > Przełożony
		// Sprawdź uprawnienia przełożonego (helper już uwzględnia Admin/HR)
		const { canSupervisorViewTimesheets } = require('../services/roleService')
		const isSupervisor = requestingUser.roles.includes('Przełożony (Supervisor)')
		const canViewAsSupervisor = isSupervisor && userToView ? await canSupervisorViewTimesheets(requestingUser, userToView) : false

		// Każdy użytkownik w zespole może widzieć innych użytkowników z tego samego zespołu
		// Super admin widzi wszystkich, admin/HR widzi wszystkich ze swojego zespołu
		if (!(isSuperAdmin || isSameTeam || isAdmin || isHR || isSelf || canViewAsSupervisor)) {
			return res.status(403).send('Access denied')
		}

		const user = await User.findOne({
			_id: userId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('firstName lastName username roles position department leaveTypeDays')
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

		// Walidacja wzajemnie wykluczających się ról
		const roleValidation = validateMutuallyExclusiveRoles(roles, req.t)
		if (!roleValidation.valid) {
			return res.status(400).json({
				success: false,
				message: roleValidation.message,
				code: roleValidation.code
			})
		}

		try {
			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).send('Użytkownik nie znaleziony');
			}

		const oldDepartment = user.department;
		user.roles = roles;
		// Dla wielu działów - upewnij się, że department to tablica
		if (department !== undefined) {
			user.department = Array.isArray(department) ? department : (department ? [department] : [])
		}
		await user.save();

		// Jeśli użytkownik jest przełożonym i zmieniono jego dział, zaktualizuj listę podwładnych
		if (user.roles.includes('Przełożony (Supervisor)') && department !== undefined) {
			const SupervisorConfig = require('../models/SupervisorConfig')(firmDb);
			const newDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : []);
			const oldDepartments = Array.isArray(oldDepartment) ? oldDepartment : (oldDepartment ? [oldDepartment] : []);
			
			// Sprawdź czy działy się zmieniły
			const departmentsChanged = JSON.stringify(newDepartments.sort()) !== JSON.stringify(oldDepartments.sort());
			
			if (departmentsChanged) {
				try {
					// Znajdź działy, które zostały dodane (nowe)
					const addedDepartments = newDepartments.filter(dept => !oldDepartments.includes(dept));
					// Znajdź działy, które zostały usunięte
					const removedDepartments = oldDepartments.filter(dept => !newDepartments.includes(dept));
					
					// Pobierz lub utwórz konfigurację przełożonego
					let config = await SupervisorConfig.findOne({ supervisorId: user._id });
					if (!config) {
						// Jeśli nie ma konfiguracji, utwórz nową z użytkownikami z wszystkich działów
						const allUsersInDepartments = await User.find({
							teamId: user.teamId,
							_id: { $ne: user._id }
						}).select('_id department').lean();

						const validSubordinates = allUsersInDepartments.filter(emp => {
							const empDepts = Array.isArray(emp.department) ? emp.department : (emp.department ? [emp.department] : []);
							return empDepts.some(dept => newDepartments.includes(dept));
						}).map(emp => emp._id);

						config = new SupervisorConfig({
							supervisorId: user._id,
							teamId: user.teamId,
							permissions: {
								canApproveLeaves: true,
								canApproveLeavesDepartment: true,
								canApproveLeavesSelectedEmployees: true,
								canViewTimesheets: true,
								canViewTimesheetsDepartment: true,
								canViewTimesheetsSelectedEmployees: true,
								canManageSchedule: true,
								canManageScheduleDepartment: true,
								canManageScheduleCustom: true
							},
							selectedEmployees: validSubordinates
						});
					} else {
						// Pobierz aktualną listę podwładnych
						const currentSubordinates = await User.find({
							_id: { $in: config.selectedEmployees },
							teamId: user.teamId
						}).select('_id department').lean();

						// Znajdź użytkowników z dodanych działów
						const usersToAdd = [];
						if (addedDepartments.length > 0) {
							const usersInAddedDepartments = await User.find({
								teamId: user.teamId,
								_id: { $ne: user._id }
							}).select('_id department').lean();

							const newUsers = usersInAddedDepartments.filter(emp => {
								const empDepts = Array.isArray(emp.department) ? emp.department : (emp.department ? [emp.department] : []);
								return empDepts.some(dept => addedDepartments.includes(dept));
							}).map(emp => emp._id);

							usersToAdd.push(...newUsers);
						}

						// Filtruj aktualnych podwładnych:
						// 1. Zachowaj użytkowników z działów, które nadal są przypisane do przełożonego
						// 2. Usuń użytkowników z działów, które zostały usunięte (jeśli nie są w innych działach przełożonego)
						// 3. Zachowaj użytkowników spoza działu (którzy nie są w żadnym dziale przełożonego)
						const subordinatesToKeep = currentSubordinates.filter(emp => {
							const empDepts = Array.isArray(emp.department) ? emp.department : (emp.department ? [emp.department] : []);
							
							// Jeśli użytkownik nie ma działu lub ma dział spoza działów przełożonego → zachowaj (dodany ręcznie)
							if (empDepts.length === 0 || !empDepts.some(dept => newDepartments.includes(dept) || oldDepartments.includes(dept))) {
								return true;
							}
							
							// Jeśli użytkownik jest w dziale, który został usunięty, ale nie jest w żadnym z nowych działów → usuń
							if (removedDepartments.length > 0 && empDepts.some(dept => removedDepartments.includes(dept))) {
								// Sprawdź czy użytkownik jest w którymkolwiek z nowych działów
								if (!empDepts.some(dept => newDepartments.includes(dept))) {
									return false; // Usuń - był tylko w usuniętym dziale
								}
							}
							
							// Zachowaj użytkowników z działów, które nadal są przypisane
							return empDepts.some(dept => newDepartments.includes(dept));
						}).map(emp => emp._id);

						// Połącz zachowanych podwładnych z nowymi użytkownikami z dodanych działów
						const allSubordinateIds = [...subordinatesToKeep, ...usersToAdd];
						// Usuń duplikaty
						const uniqueSubordinates = Array.from(new Set(allSubordinateIds.map(id => id.toString())));
						
						config.selectedEmployees = uniqueSubordinates;
					}
					
					await config.save();
					
					// Zaktualizuj relacje supervisors w User
					// Usuń stare relacje
					await User.updateMany(
						{ supervisors: user._id },
						{ $pull: { supervisors: user._id } }
					);
					
					// Dodaj nowe relacje
					if (config.selectedEmployees.length > 0) {
						await User.updateMany(
							{ _id: { $in: config.selectedEmployees }, teamId: user.teamId },
							{ $addToSet: { supervisors: user._id } }
						);
					}
				} catch (error) {
					console.error('Error updating supervisor subordinates after department change:', error);
					// Nie przerywaj procesu jeśli aktualizacja podwładnych nie powiedzie się
				}
			}
		}

		// Handle department boards - create for new departments, deactivate for removed departments
		if (department !== undefined && user.teamId) {
			const newDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : []);
			const oldDepartments = Array.isArray(oldDepartment) ? oldDepartment : (oldDepartment ? [oldDepartment] : []);
			
			// Find departments that are new (in newDepartments but not in oldDepartments)
			const departmentsToCreate = newDepartments.filter(dept => !oldDepartments.includes(dept));
			
			// Find departments that were removed (in oldDepartments but not in newDepartments)
			const departmentsToCheck = oldDepartments.filter(dept => !newDepartments.includes(dept));
			
			// Create boards and schedules for new departments
			for (const deptName of departmentsToCreate) {
				try {
					await createBoardForDepartment(user.teamId, deptName);
				} catch (error) {
					console.error(`Error creating board for department "${deptName}" when updating user:`, error);
					// Don't fail the request if board creation fails
				}
				try {
					await createScheduleForDepartment(user.teamId, deptName);
				} catch (error) {
					console.error(`Error creating schedule for department "${deptName}" when updating user:`, error);
					// Don't fail the request if schedule creation fails
				}
			}
			
			// Check if removed departments still have users, if not deactivate their boards
			for (const deptName of departmentsToCheck) {
				try {
					const userCount = await User.countDocuments({
						teamId: user.teamId,
						$or: [
							{ department: deptName },
							{ department: { $in: [deptName] } }
						]
					});
					
					if (userCount === 0) {
						const departmentBoard = await Board.findOne({ 
							teamId: user.teamId, 
							departmentName: deptName, 
							type: 'department' 
						});
						if (departmentBoard) {
							departmentBoard.isActive = false;
							await departmentBoard.save();
						}
					}
				} catch (error) {
					console.error(`Error checking/deactivating board for department "${deptName}":`, error);
				}
			}
		}

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
			// Znajdź innego administratora w zespole (tylko aktywnych)
			const otherAdmins = await User.find({ 
				teamId: user.teamId, 
				roles: { $in: ['Admin'] },
				isTeamAdmin: false,
				_id: { $ne: userId },
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
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

		// Self-deletion jest zablokowane - użytkownik nie może usunąć własnego konta
		if (isSelfDeletion) {
			return res.status(403).json({ 
				message: 'Nie można usunąć własnego konta. Skontaktuj się z administratorem zespołu.' 
			})
		} else {
			// Jeśli usuwasz innego użytkownika - tylko Admin może
			const allowedRoles = ['Admin']
			if (!allowedRoles.some(role => req.user.roles.includes(role))) {
				return res.status(403).json({ message: 'Brak uprawnień - tylko administrator może usuwać innych użytkowników' })
			}

			// Sprawdź czy nie usuwasz ostatniego admina w zespole (nie licząc założyciela) - tylko aktywnych
			if (user.roles && user.roles.includes('Admin')) {
				const teamAdmins = await User.find({ 
					teamId: user.teamId, 
					roles: { $in: ['Admin'] },
					isTeamAdmin: false,
					$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
				})
				
				if (teamAdmins.length === 1 && teamAdmins[0]._id.toString() === userId) {
					return res.status(400).json({ 
						message: 'Nie można usunąć ostatniego administratora w zespole. Najpierw dodaj innego administratora.' 
					})
				}
			}
		}

		// Soft delete użytkownika (tylko admin może usuwać użytkowników)
		// Self-deletion jest zablokowane (użytkownik nie może usunąć własnego konta)
		const deletedAt = new Date();
		await User.findByIdAndUpdate(userId, {
			isActive: false,
			deletedAt
		});

		// Zmniejsz licznik aktywnych użytkowników w zespole
		const team = await Team.findById(user.teamId);
		if (team) {
			const activeUserCount = await User.countDocuments({ 
				teamId: user.teamId, 
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			});
			team.currentUserCount = activeUserCount;
			await team.save();
		}

		// Log usunięcia użytkownika
		await createLog(req.user.userId, 'DELETE_USER', `Użytkownik ${user.username} został oznaczony jako usunięty`, req.user.userId);

		res.status(200).json({ 
			message: 'Użytkownik został oznaczony jako usunięty. Dane zostaną trwale usunięte po 30 dniach zgodnie z Regulaminem.',
			selfDeleted: false,
			teamId: user.teamId.toString(),
			currentUserCount: team?.currentUserCount || 0
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
			_id: user._id,
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
	const isProduction = process.env.NODE_ENV === 'production'
	res.clearCookie('token', {
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? 'None' : 'Lax',
	})

	res.clearCookie('refreshToken', {
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? 'None' : 'Lax',
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

		const isProduction = process.env.NODE_ENV === 'production'
		res.cookie('token', accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? 'None' : 'Lax',
			maxAge: 15 * 60 * 1000,
		})

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? 'None' : 'Lax',
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

		const isProduction = process.env.NODE_ENV === 'production'
		res.cookie('token', newAccessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? 'None' : 'Lax',
			maxAge: 15 * 60 * 1000,
		})

		res.cookie('refreshToken', newRefreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? 'None' : 'Lax',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		})

		res.json({ message: 'Token refreshed' })
	})
}

// Endpoint do regeneracji i wysłania linku ustawienia hasła dla użytkowników bez hasła
exports.resendPasswordLink = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user.userId)
		if (!currentUser) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		// Sprawdź czy to super admin lub admin zespołu
		const isSuperAdmin = currentUser.username === 'michalipka1@gmail.com'
		const isTeamAdmin = currentUser.roles && currentUser.roles.includes('Admin')
		
		if (!isSuperAdmin && !isTeamAdmin) {
			return res.status(403).json({ message: 'Brak uprawnień - tylko administrator może regenerować linki' })
		}

		const { userId } = req.params
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		// Jeśli to admin zespołu (nie super admin), sprawdź czy użytkownik jest w tym samym zespole
		if (!isSuperAdmin && isTeamAdmin) {
			if (user.teamId.toString() !== currentUser.teamId.toString()) {
				return res.status(403).json({ message: 'Brak uprawnień - możesz wysyłać linki tylko użytkownikom ze swojego zespołu' })
			}
		}

		// Jeśli użytkownik już ma hasło, nie można regenerować linku
		if (user.password) {
			return res.status(400).json({ message: 'Użytkownik już ma ustawione hasło' })
		}

		// Pobierz informacje o zespole
		const team = await Team.findById(user.teamId)
		if (!team) {
			return res.status(404).json({ message: 'Zespół nie znaleziony' })
		}

		// Generuj nowy token
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: '24h',
		})

		const link = `${appUrl}/set-password/${token}`

		// Get translation function - use req.t if available, otherwise create instance with default 'pl'
		let t = req.t
		if (!t) {
			const i18next = require('i18next')
			const Backend = require('i18next-fs-backend')
			const i18nInstance = i18next.createInstance()
			await i18nInstance.use(Backend).init({
				lng: 'pl', // Default to Polish
				fallbackLng: 'pl',
				backend: {
					loadPath: __dirname + '/../locales/{{lng}}/translation.json',
				},
			})
			t = i18nInstance.t.bind(i18nInstance)
		}

		// Przygotuj email
		const subject = t('email.welcome.subject')
		const content = `
			<p style="margin: 0 0 16px 0;">${t('email.welcome.greeting', { firstName: escapeHtml(user.firstName) })}</p>
			<p style="margin: 0 0 16px 0;">${t('email.welcome.teamAdded', { teamName: escapeHtml(team.name) })}</p>
			<p style="margin: 0 0 24px 0;">${t('email.welcome.setPassword')}</p>
			<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.welcome.linkExpires')}</p>
		`
		const body = getEmailTemplate(
			t('email.welcome.title'),
			content,
			t('email.welcome.buttonText'),
			link,
			t
		)

		// Wyślij email
		try {
			await sendEmail(user.username, link, subject, body)
			await createLog(req.user.userId, 'RESEND_PASSWORD_LINK', `Regenerated and sent password link to ${user.username}`)
			
			res.status(200).json({
				success: true,
				message: `Link do ustawienia hasła został wysłany na adres ${user.username}`
			})
		} catch (emailError) {
			console.error('Error sending email:', emailError)
			res.status(500).json({
				success: false,
				message: 'Użytkownik został utworzony, ale nie udało się wysłać emaila. Link: ' + link
			})
		}

	} catch (error) {
		console.error('Error resending password link:', error)
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas regeneracji linku'
		})
	}
}

// Endpoint do wysyłania specjalnego emaila informacyjnego (tylko dla super admina)
exports.sendApologyEmail = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user.userId)
		if (!currentUser) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		// Tylko super admin może wysyłać ten email
		const isSuperAdmin = currentUser.username === 'michalipka1@gmail.com'
		if (!isSuperAdmin) {
			return res.status(403).json({ message: 'Brak uprawnień - tylko super admin może wysyłać ten email' })
		}

		const { userId } = req.params
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		// Get translation function - use req.t if available, otherwise create instance with default 'pl'
		let t = req.t
		if (!t) {
			const i18next = require('i18next')
			const Backend = require('i18next-fs-backend')
			const i18nInstance = i18next.createInstance()
			await i18nInstance.use(Backend).init({
				lng: 'pl', // Default to Polish
				fallbackLng: 'pl',
				backend: {
					loadPath: __dirname + '/../locales/{{lng}}/translation.json',
				},
			})
			t = i18nInstance.t.bind(i18nInstance)
		}

		// Przygotuj email z przeprosinami (bez przycisku ustawienia hasła)
		const subject = t('email.apology.subject')
		const content = `
			<p style="margin: 0 0 16px 0;">${t('email.apology.greeting', { firstName: escapeHtml(user.firstName) })}</p>
			<p style="margin: 0 0 16px 0;">${t('email.apology.message')}</p>
			<p style="margin: 0 0 24px 0;">${t('email.apology.resolved')}</p>
		`
		const body = getEmailTemplate(
			t('email.apology.title'),
			content,
			null, // Brak przycisku
			null,  // Brak linku
			t
		)

		// Wyślij email
		try {
			await sendEmail(user.username, null, subject, body)
			await createLog(req.user.userId, 'SEND_APOLOGY_EMAIL', `Sent apology email to ${user.username}`)
			
			res.status(200).json({
				success: true,
				message: `Email informacyjny został wysłany na adres ${user.username}`
			})
		} catch (emailError) {
			console.error('Error sending email:', emailError)
			res.status(500).json({
				success: false,
				message: 'Nie udało się wysłać emaila'
			})
		}

	} catch (error) {
		console.error('Error sending apology email:', error)
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas wysyłania emaila'
		})
	}
}

// Pobierz soft-deleted użytkowników zespołu (tylko dla Admin)
exports.getDeletedUsers = async (req, res) => {
	try {
		const allowedRoles = ['Admin']
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).json({ message: 'Brak uprawnień - tylko administrator może przeglądać usuniętych użytkowników' })
		}

		const currentUser = await User.findById(req.user.userId)
		if (!currentUser) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		// Pobierz soft-deleted użytkowników zespołu
		const deletedUsers = await User.find({
			teamId: currentUser.teamId,
			isActive: false,
			deletedAt: { $ne: null }
		}).select('username firstName lastName roles position department deletedAt').sort({ deletedAt: -1 }).lean()

		res.json(deletedUsers)
	} catch (error) {
		console.error('Error fetching deleted users:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania usuniętych użytkowników' })
	}
}

// Przywróć użytkownika (restore)
exports.restoreUser = async (req, res) => {
	try {
		const { userId } = req.params
		const allowedRoles = ['Admin']
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).json({ message: 'Brak uprawnień - tylko administrator może przywracać użytkowników' })
		}

		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		// Sprawdź czy użytkownik jest w tym samym zespole
		const currentUser = await User.findById(req.user.userId)
		if (user.teamId.toString() !== currentUser.teamId.toString()) {
			return res.status(403).json({ message: 'Nie można przywrócić użytkownika z innego zespołu' })
		}

		// Sprawdź czy użytkownik jest soft-deleted
		if (user.isActive !== false) {
			return res.status(400).json({ message: 'Użytkownik nie jest usunięty' })
		}

		// Pobierz zespół i sprawdź limit przed przywróceniem
		const team = await Team.findById(user.teamId)
		if (!team) {
			return res.status(404).json({ message: 'Zespół nie został znaleziony' })
		}

		// Update maxUsers for special teams if needed
		await updateSpecialTeamLimit(team)

		// Policz rzeczywistą liczbę aktywnych użytkowników (bez soft-deleted)
		const actualUserCount = await User.countDocuments({ 
			teamId: user.teamId, 
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})

		// Sprawdź czy przywrócenie nie przekroczy limitu
		if (actualUserCount >= team.maxUsers) {
			// Zaktualizuj currentUserCount aby było zgodne z rzeczywistością
			team.currentUserCount = actualUserCount
			await team.save()
			
			return res.status(400).json({ 
				success: false,
				message: `Nie można przywrócić użytkownika - osiągnięto limit użytkowników (${team.maxUsers}/${team.maxUsers}). Najpierw usuń innego użytkownika lub zwiększ limit.` 
			})
		}

		// Przywróć użytkownika
		await User.findByIdAndUpdate(userId, {
			isActive: true,
			deletedAt: null
		})

		// Zaktualizuj licznik aktywnych użytkowników w zespole
		const updatedUserCount = await User.countDocuments({ 
			teamId: user.teamId, 
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		team.currentUserCount = updatedUserCount
		await team.save()

		await createLog(req.user.userId, 'RESTORE_USER', `Przywrócono użytkownika ${user.username}`, req.user.userId)

		res.json({ 
			success: true,
			message: 'Użytkownik został przywrócony pomyślnie',
			teamId: user.teamId.toString(),
			userId: user._id.toString(),
			currentUserCount: team?.currentUserCount || 0
		})
	} catch (error) {
		console.error('Error restoring user:', error)
		res.status(500).json({ message: 'Błąd podczas przywracania użytkownika' })
	}
}

// Hard delete użytkownika (permanent deletion)
exports.permanentlyDeleteUser = async (req, res) => {
	try {
		const { userId } = req.params
		const allowedRoles = ['Admin']
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).json({ message: 'Brak uprawnień - tylko administrator może trwale usuwać użytkowników' })
		}

		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}

		// Sprawdź czy użytkownik jest w tym samym zespole
		const currentUser = await User.findById(req.user.userId)
		if (user.teamId.toString() !== currentUser.teamId.toString()) {
			return res.status(403).json({ message: 'Nie można trwale usunąć użytkownika z innego zespołu' })
		}

		// Sprawdź czy użytkownik jest soft-deleted
		if (user.isActive !== false) {
			return res.status(400).json({ message: 'Nie można trwale usunąć aktywnego użytkownika. Najpierw usuń go normalnie.' })
		}

		// Hard delete - usuń wszystkie powiązane dane historyczne
		const Workday = require('../models/Workday')(firmDb)
		const LeaveRequest = require('../models/LeaveRequest')(firmDb)
		const LeavePlan = require('../models/LeavePlan')(firmDb)
		const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb)
		const Log = require('../models/log')(firmDb)
		const Message = require('../models/Message')(firmDb)

		await Promise.all([
			Workday.deleteMany({ userId }),
			LeaveRequest.deleteMany({ userId }),
			LeavePlan.deleteMany({ userId }),
			CalendarConfirmation.deleteMany({ userId }),
			Log.deleteMany({ user: userId }),
			Message.deleteMany({ userId })
		])

		// Usuń użytkownika z członków tablic i harmonogramów
		const Board = require('../models/Board')(firmDb)
		const Schedule = require('../models/Schedule')(firmDb)
		const Channel = require('../models/Channel')(firmDb)

		await Promise.all([
			Board.updateMany({ teamId: user.teamId }, { $pull: { members: userId } }),
			Schedule.updateMany({ teamId: user.teamId }, { $pull: { members: userId } }),
			Channel.updateMany({ teamId: user.teamId }, { $pull: { members: userId } })
		])

		// Trwale usuń użytkownika z bazy danych
		await User.findByIdAndDelete(userId)

		await createLog(req.user.userId, 'PERMANENTLY_DELETE_USER', `Trwale usunięto użytkownika ${user.username}`, req.user.userId)

		res.json({ 
			success: true,
			message: 'Użytkownik został trwale usunięty' 
		})
	} catch (error) {
		console.error('Error permanently deleting user:', error)
		res.status(500).json({ message: 'Błąd podczas trwałego usuwania użytkownika' })
	}
}
