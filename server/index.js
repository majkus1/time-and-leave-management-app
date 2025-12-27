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
const i18next = require('i18next')
const Backend = require('i18next-fs-backend')
const i18nextMiddleware = require('i18next-http-middleware')
const csurf = require('csurf')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const helmet = require('helmet')
const { firmDb, centralTicketConnection } = require('./db/db')

const app = express()

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
app.use(mongoSanitize())
app.use(helmet())
app.use(i18nextMiddleware.handle(i18next))


app.use('/api/public', publicRoutes)
app.use('/api/teams', teamRoutes) // nowe trasy dla zespołów


const csrfProtection = csurf({ cookie: true })
app.get('/api/csrf-token', csrfProtection, (req, res) => {
	res.json({ csrfToken: req.csrfToken() })
})
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
app.use('/uploads', express.static('uploads'))

app.listen(process.env.PORT || 3000, () => {})
