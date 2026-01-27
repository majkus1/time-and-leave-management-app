require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const userRoutes = require('./routes/userRoutes')
const logRoutes = require('./routes/logRoutes')
const workdayRoutes = require('./routes/workdayRoutes')
const calendarRoutes = require('./routes/calendarRoutes')
const leavePlanRoutes = require('./routes/leavePlanRoutes')
const leaveRequestRoutes = require('./routes/leaveRequestRoutes')
const leaveRoutes = require('./routes/leaveRoutes')
const vacationRoutes = require('./routes/vacationRoutes')
const ticketsRoutes = require('./routes/ticketsRoutes')
const publicRoutes = require('./routes/publicRoutes')
const teamRoutes = require('./routes/teamRoutes')
const supervisorRoutes = require('./routes/supervisorRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const leaveRequestTypeRoutes = require('./routes/leaveRequestTypeRoutes')
const legalRoutes = require('./routes/legalRoutes')
const pushRoutes = require('./routes/pushRoutes')
const qrRoutes = require('./routes/qrRoutes')
const timeEntryRoutes = require('./routes/timeEntryRoutes')
const i18next = require('i18next')
const Backend = require('i18next-fs-backend')
const i18nextMiddleware = require('i18next-http-middleware')
const csrf = require('csrf')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const helmet = require('helmet')
const { firmDb, centralTicketConnection } = require('./db/db')

const http = require('http')
const { Server } = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
	cors: {
		origin: process.env.NODE_ENV === 'production' ? 'https://app.planopia.pl' : 'http://localhost:3001',
		credentials: true
	}
})

i18next
	.use(Backend)
	.use(i18nextMiddleware.LanguageDetector)
	.init({
		fallbackLng: 'en',
		preload: ['en', 'pl'],
		backend: {
			loadPath: __dirname + '/locales/{{lng}}/translation.json',
		},
	})

firmDb.on('connected', async () => {
	// Automatically update special teams maxUsers limit on server start
	try {
		const Team = require('./models/Team')(firmDb)
		const specialTeamNames = ['OficjalnyAdminowy', 'Halo Rental System']
		const specialTeams = await Team.find({ name: { $in: specialTeamNames } })
		
		for (const team of specialTeams) {
			if (team.maxUsers !== 11) {
				// Safety check: only update if team exists and has valid data
				if (team._id && team.name) {
					const oldMaxUsers = team.maxUsers
					team.maxUsers = 11
					await team.save()
					console.log(`Updated team "${team.name}" maxUsers from ${oldMaxUsers} to 11`)
				}
			}
		}

		// Create or update general channels for all teams
		try {
			const Channel = require('./models/Channel')(firmDb)
			const { createGeneralChannel } = require('./controllers/chatController')
			const allTeams = await Team.find({ isActive: true })
			for (const team of allTeams) {
				try {
					// This will create if doesn't exist, or update if exists
					await createGeneralChannel(team._id)
					console.log(`Synced general channel for team "${team.name}"`)
				} catch (error) {
					console.error(`Error syncing general channel for team "${team.name}":`, error)
				}
			}
		} catch (error) {
			console.error('Error syncing general channels on startup:', error)
		}

		// Create or update team boards and department boards for all teams
		try {
			const Board = require('./models/Board')(firmDb)
			const Department = require('./models/Department')(firmDb)
			const { createTeamBoard, createBoardForDepartment } = require('./controllers/boardController')
			const allTeams = await Team.find({ isActive: true })
			
			for (const team of allTeams) {
				try {
					// Create team board
					await createTeamBoard(team._id)
					console.log(`Synced team board for team "${team.name}"`)
					
					// Get departments for this team
					const departments = await Department.find({ teamId: team._id, isActive: true }).select('name')
					
					// If no departments in Department model, get from users
					if (departments.length === 0) {
						const User = require('./models/user')(firmDb)
						const users = await User.find({ 
							teamId: team._id, 
							department: { $ne: null, $ne: [], $exists: true } 
						}).select('department')
						
						const allDepartments = new Set()
						users.forEach(user => {
							if (Array.isArray(user.department)) {
								user.department.forEach(dept => {
									if (dept && dept.trim() !== '') {
										allDepartments.add(dept.trim())
									}
								})
							} else if (user.department && user.department.trim() !== '') {
								allDepartments.add(user.department.trim())
							}
						})
						
						// Create boards for departments from users
						for (const deptName of allDepartments) {
							try {
								await createBoardForDepartment(team._id, deptName)
								console.log(`Synced department board "${deptName}" for team "${team.name}"`)
							} catch (error) {
								console.error(`Error syncing department board "${deptName}" for team "${team.name}":`, error)
							}
						}
					} else {
						// Create boards for departments from Department model
						for (const dept of departments) {
							try {
								await createBoardForDepartment(team._id, dept.name)
								console.log(`Synced department board "${dept.name}" for team "${team.name}"`)
							} catch (error) {
								console.error(`Error syncing department board "${dept.name}" for team "${team.name}":`, error)
							}
						}
					}
				} catch (error) {
					console.error(`Error syncing boards for team "${team.name}":`, error)
				}
			}
		} catch (error) {
			console.error('Error syncing boards on startup:', error)
		}

		// Create or update team schedules and department schedules for all teams
		try {
			const Schedule = require('./models/Schedule')(firmDb)
			const Department = require('./models/Department')(firmDb)
			const { createTeamSchedule, createScheduleForDepartment } = require('./controllers/scheduleController')
			const allTeams = await Team.find({ isActive: true })
			
			for (const team of allTeams) {
				try {
					// Create team schedule
					await createTeamSchedule(team._id)
					console.log(`Synced team schedule for team "${team.name}"`)
					
					// Get departments for this team
					const departments = await Department.find({ teamId: team._id, isActive: true }).select('name')
					
					// If no departments in Department model, get from users
					if (departments.length === 0) {
						const User = require('./models/user')(firmDb)
						const users = await User.find({ 
							teamId: team._id, 
							department: { $ne: null, $ne: [], $exists: true } 
						}).select('department')
						
						const allDepartments = new Set()
						users.forEach(user => {
							if (Array.isArray(user.department)) {
								user.department.forEach(dept => {
									if (dept && dept.trim() !== '') {
										allDepartments.add(dept.trim())
									}
								})
							} else if (user.department && user.department.trim() !== '') {
								allDepartments.add(user.department.trim())
							}
						})
						
						// Create schedules for departments from users
						for (const deptName of allDepartments) {
							try {
								await createScheduleForDepartment(team._id, deptName)
								console.log(`Synced department schedule "${deptName}" for team "${team.name}"`)
							} catch (error) {
								console.error(`Error syncing department schedule "${deptName}" for team "${team.name}":`, error)
							}
						}
					} else {
						// Create schedules for departments from Department model
						for (const dept of departments) {
							try {
								await createScheduleForDepartment(team._id, dept.name)
								console.log(`Synced department schedule "${dept.name}" for team "${team.name}"`)
							} catch (error) {
								console.error(`Error syncing department schedule "${dept.name}" for team "${team.name}":`, error)
							}
						}
					}
				} catch (error) {
					console.error(`Error syncing schedules for team "${team.name}":`, error)
				}
			}
		} catch (error) {
			console.error('Error syncing schedules on startup:', error)
		}
	} catch (error) {
		console.error('Error updating special teams limit:', error)
		// Don't crash server if update fails
	}
})
firmDb.on('error', err => console.error('Firm DB error:', err))
centralTicketConnection.on('connected', () => {})
centralTicketConnection.on('error', err => console.error('Central tickets DB error:', err))

// mongoose
// 	.connect(process.env.DB_URI, {
// 		useNewUrlParser: true,
// 		useUnifiedTopology: true,
// 	})
// 	.then(() => console.log('MongoDB connected successfully.'))
// 	.catch(err => console.log('Failed to connect to MongoDB:', err))

const corsOptions = {
	origin: process.env.NODE_ENV === 'production' ? 'https://app.planopia.pl' : 'http://localhost:3001',
	credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())
app.use(xss())
// mongoSanitize usuwa kropki z kluczy (np. 'leaveform.option1' -> 'leaveform_option1')
// Dla leaveTypeDays musimy zachować oryginalne klucze z kropkami
app.use((req, res, next) => {
	if (req.body && req.body.leaveTypeDays) {
		// Przechowaj oryginalne leaveTypeDays przed sanitizacją
		req._originalLeaveTypeDays = JSON.parse(JSON.stringify(req.body.leaveTypeDays))
	}
	next()
})
app.use(mongoSanitize())
app.use((req, res, next) => {
	if (req.body && req._originalLeaveTypeDays) {
		// Przywróć oryginalne leaveTypeDays po sanitizacji
		req.body.leaveTypeDays = req._originalLeaveTypeDays
	}
	next()
})
app.use(helmet())
app.use(i18nextMiddleware.handle(i18next))


app.use('/api/public', publicRoutes)
app.use('/api/teams', teamRoutes) // nowe trasy dla zespołów
app.use('/api/legal', legalRoutes) // dokumenty prawne - częściowo publiczne

// CSRF Protection using csrf package (replacement for deprecated csurf)
const tokens = csrf()
const CSRF_COOKIE_NAME = '_csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'

// Middleware to get or create CSRF secret
const getCsrfSecret = (req, res, next) => {
	let secret = req.cookies[CSRF_COOKIE_NAME]
	
	if (!secret) {
		secret = tokens.secretSync()
		const isProduction = process.env.NODE_ENV === 'production'
		res.cookie(CSRF_COOKIE_NAME, secret, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? 'None' : 'Lax',
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		})
	}
	
	req.csrfSecret = secret
	next()
}

// Endpoint to get CSRF token
app.get('/api/csrf-token', getCsrfSecret, (req, res) => {
	try {
		const token = tokens.create(req.csrfSecret)
		res.json({ csrfToken: token })
	} catch (error) {
		console.error('Error generating CSRF token:', error)
		res.status(500).json({ error: 'Failed to generate CSRF token' })
	}
})

// CSRF validation middleware
const csrfProtection = (req, res, next) => {
	// Skip CSRF for GET, HEAD, OPTIONS
	if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
		return next()
	}

	// Get secret from req (set by getCsrfSecret middleware) or cookie as fallback
	const secret = req.csrfSecret || req.cookies[CSRF_COOKIE_NAME]
	if (!secret) {
		return res.status(403).json({ 
			error: 'CSRF token missing: no secret cookie found',
			code: 'CSRF_SECRET_MISSING'
		})
	}

	// Get token from header (case-insensitive)
	const token = req.headers[CSRF_HEADER_NAME] || req.headers['X-CSRF-Token'] || req.headers['x-csrf-token']
	if (!token) {
		return res.status(403).json({ 
			error: 'CSRF token missing: no token header found',
			code: 'CSRF_TOKEN_MISSING'
		})
	}

	// Verify token
	if (!tokens.verify(secret, token)) {
		return res.status(403).json({ 
			error: 'Invalid CSRF token',
			code: 'CSRF_TOKEN_INVALID'
		})
	}

	next()
}

// Apply CSRF protection to all routes after public routes
app.use(getCsrfSecret)
app.use(csrfProtection)


app.use('/api/users', userRoutes)
app.use('/api/userlogs', logRoutes)
app.use('/api/workdays', workdayRoutes)
app.use('/api/calendar', calendarRoutes)

app.use('/api/planlea', leavePlanRoutes)
app.use('/api/requlea', leaveRequestRoutes)
app.use('/api/leaveworks', leaveRoutes)
app.use('/api/vacations', vacationRoutes)
app.use('/api/tickets', ticketsRoutes)
app.use('/api/departments', require('./routes/department'))
app.use('/api/chat', require('./routes/chatRoutes'))
app.use('/api/boards', require('./routes/boardRoutes'))
app.use('/api/schedules', require('./routes/scheduleRoutes'))
app.use('/api/supervisors', supervisorRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/leave-request-types', leaveRequestTypeRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/qr', qrRoutes)
app.use('/api/time-entry', timeEntryRoutes)
app.use('/uploads', express.static('uploads'))

// Socket.io setup
const jwt = require('jsonwebtoken')
const User = require('./models/user')(firmDb)

io.use(async (socket, next) => {
	try {
		// Try to get token from auth object first (from client)
		let token = socket.handshake.auth?.token
		
		// If no token in auth, try to get from cookies (cookie name is 'token')
		// Note: httpOnly cookies are not accessible via document.cookie in browser,
		// but they ARE sent automatically with requests, so socket.io should receive them
		if (!token) {
			const cookies = socket.handshake.headers.cookie
			if (cookies) {
				// Try 'token' cookie (the actual cookie name used in the app)
				const tokenMatch = cookies.match(/token=([^;]+)/)
				if (tokenMatch) {
					token = decodeURIComponent(tokenMatch[1])
				}
			}
		}

		// Also try authorization header as fallback
		if (!token) {
			const authHeader = socket.handshake.headers.authorization
			if (authHeader && authHeader.startsWith('Bearer ')) {
				token = authHeader.substring(7)
			}
		}

		if (!token) {
			console.error('Socket auth: No token found in auth object, cookies, or authorization header')
			return next(new Error('Authentication error: No token provided'))
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await User.findById(decoded.userId)
		if (!user) {
			return next(new Error('User not found'))
		}

		socket.userId = decoded.userId
		socket.teamId = user.teamId
		next()
	} catch (error) {
		console.error('Socket authentication error:', error.message)
		// Don't expose JWT verification errors to client
		next(new Error('Authentication error'))
	}
})

io.on('connection', (socket) => {
	console.log(`User connected: ${socket.userId}`)

	// Join team room
	socket.join(`team:${socket.teamId}`)

	// Join channel room
	socket.on('join-channel', (channelId) => {
		socket.join(`channel:${channelId}`)
	})

	// Leave channel room
	socket.on('leave-channel', (channelId) => {
		socket.leave(`channel:${channelId}`)
	})

	// Handle new message
	socket.on('new-message', async (data) => {
		const { channelId, message } = data
		// Broadcast to all users in the channel
		io.to(`channel:${channelId}`).emit('message-received', message)
		// Also notify team members about new message
		io.to(`team:${socket.teamId}`).emit('new-message-notification', {
			channelId,
			message
		})
	})

	socket.on('disconnect', () => {
		console.log(`User disconnected: ${socket.userId}`)
	})
})

// Export io for use in controllers
app.io = io

server.listen(process.env.PORT || 3000, () => {
	console.log(`Server running on port ${process.env.PORT || 3000}`)
})
