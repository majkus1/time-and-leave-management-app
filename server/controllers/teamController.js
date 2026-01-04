const { firmDb } = require('../db/db');
const Team = require('../models/Team')(firmDb);
const User = require('../models/user')(firmDb);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createLog } = require('../services/logService');
const { createGeneralChannel } = require('./chatController');
const Workday = require('../models/Workday')(firmDb);
const LeaveRequest = require('../models/LeaveRequest')(firmDb);
const LeavePlan = require('../models/LeavePlan')(firmDb);
const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb);
const Log = require('../models/log')(firmDb);
const Message = require('../models/Message')(firmDb);
const Channel = require('../models/Channel')(firmDb);
const Board = require('../models/Board')(firmDb);
const Schedule = require('../models/Schedule')(firmDb);
const Department = require('../models/Department')(firmDb);
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb);

// Helper function to update maxUsers for special teams
const updateSpecialTeamLimit = async (team) => {
	const specialTeamNames = ['OficjalnyAdminowy', 'Halo Rental System']
	if (specialTeamNames.includes(team.name) && team.maxUsers !== 11) {
		team.maxUsers = 11
		await team.save()
	}
	return team
}

// Export the function so it can be used in other controllers
exports.updateSpecialTeamLimit = updateSpecialTeamLimit

exports.registerTeam = async (req, res) => {
	try {
		const {
			teamName,
			adminEmail,
			adminPassword,
			adminFirstName,
			adminLastName,
			position
		} = req.body;

		
		if (!teamName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
			return res.status(400).json({
				success: false,
				message: 'Wszystkie pola są wymagane'
			});
		}

		
		const existingTeam = await Team.findOne({ name: teamName });
		if (existingTeam) {
			return res.status(400).json({
				success: false,
				message: 'Zespół o takiej nazwie już istnieje'
			});
		}

		
		const existingUser = await User.findOne({ username: adminEmail });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: 'Użytkownik o tym emailu już istnieje'
			});
		}

		
		const hashedPassword = await bcrypt.hash(adminPassword, 12);

		// Determine maxUsers based on team name
		// Special teams get 11 users, others get default 6
		const specialTeamNames = ['OficjalnyAdminowy', 'Halo Rental System']
		const maxUsers = specialTeamNames.includes(teamName) ? 11 : 6

	
		const newTeam = new Team({
			name: teamName,
			adminEmail,
			adminPassword: hashedPassword,
			adminFirstName,
			adminLastName,
			currentUserCount: 1,
			maxUsers: maxUsers
		});

		await newTeam.save();

		
		const teamAdmin = new User({
			username: adminEmail,
			password: hashedPassword,
			firstName: adminFirstName,
			lastName: adminLastName,
			teamId: newTeam._id,
			roles: ['Admin'],
			isTeamAdmin: true,
			...(position ? { position } : {})
		});

		await teamAdmin.save();

		// Create general channel for the team
		try {
			await createGeneralChannel(newTeam._id);
		} catch (error) {
			console.error('Error creating general channel for team:', error);
			// Don't fail the request if channel creation fails
		}

		
		const accessToken = jwt.sign(
			{
				userId: teamAdmin._id,
				teamId: newTeam._id,
				roles: teamAdmin.roles,
				username: teamAdmin.username,
				isTeamAdmin: true
			},
			process.env.JWT_SECRET,
			{ expiresIn: '15m' }
		);

		const refreshToken = jwt.sign(
			{
				userId: teamAdmin._id,
				teamId: newTeam._id,
				roles: teamAdmin.roles,
				username: teamAdmin.username,
				isTeamAdmin: true
			},
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '7d' }
		);

		
		res.cookie('token', accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			maxAge: 15 * 60 * 1000,
		});

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		
		await createLog(teamAdmin._id, 'TEAM_CREATED', `Team ${teamName} created successfully`);

		res.status(201).json({
			success: true,
			message: 'Zespół został utworzony pomyślnie',
			team: {
				id: newTeam._id,
				name: newTeam.name,
				adminEmail: newTeam.adminEmail,
				maxUsers: newTeam.maxUsers,
				currentUserCount: newTeam.currentUserCount
			},
			user: {
				roles: teamAdmin.roles,
				username: teamAdmin.username,
				isTeamAdmin: true
			}
		});

	} catch (error) {
		console.error('Team registration error:', error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas tworzenia zespołu'
		});
	}
};


exports.getTeamInfo = async (req, res) => {
	try {
		const { teamId } = req.params;

		const team = await Team.findById(teamId).select('-adminPassword');
		if (!team) {
			return res.status(404).json({
				success: false,
				message: 'Zespół nie został znaleziony'
			});
		}

		// Update maxUsers for special teams if needed
		await updateSpecialTeamLimit(team)

		res.json({
			success: true,
			team: {
				id: team._id,
				name: team.name,
				maxUsers: team.maxUsers,
				currentUserCount: team.currentUserCount,
				isActive: team.isActive,
				subscriptionType: team.subscriptionType
			}
		});

	} catch (error) {
		console.error('Get team info error:', error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas pobierania informacji o zespole'
		});
	}
};


exports.getTeamUsers = async (req, res) => {
	try {
		const { teamId } = req.params;

		const users = await User.find({ teamId }).select('-password');

		res.json({
			success: true,
			users: users.map(user => ({
				id: user._id,
				username: user.username,
				firstName: user.firstName,
				lastName: user.lastName,
				roles: user.roles,
				department: user.department,
				isTeamAdmin: user.isTeamAdmin
			}))
		});

	} catch (error) {
		console.error('Get team users error:', error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas pobierania użytkowników zespołu'
		});
	}
};


exports.checkUserLimit = async (req, res) => {
	try {
		const { teamId } = req.params;

		const team = await Team.findById(teamId);
		if (!team) {
			return res.status(404).json({
				success: false,
				message: 'Zespół nie został znaleziony'
			});
		}

		// Update maxUsers for special teams if needed
		await updateSpecialTeamLimit(team)

		// Policz rzeczywistą liczbę użytkowników w zespole
		const actualUserCount = await User.countDocuments({ teamId });
		
		// Zaktualizuj currentUserCount jeśli jest nieaktualne
		if (team.currentUserCount !== actualUserCount) {
			team.currentUserCount = actualUserCount;
			await team.save();
		}

		const canAddUser = actualUserCount < team.maxUsers;

		res.json({
			success: true,
			canAddUser,
			currentCount: actualUserCount,
			maxUsers: team.maxUsers,
			remainingSlots: Math.max(0, team.maxUsers - actualUserCount)
		});

	} catch (error) {
		console.error('Check user limit error:', error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas sprawdzania limitu użytkowników'
		});
	}
};

exports.deleteTeam = async (req, res) => {
	try {
		const { teamId } = req.params;
		const currentUser = await User.findById(req.user.userId);

		// Sprawdź czy użytkownik jest adminem
		if (!currentUser || !currentUser.roles.includes('Admin')) {
			return res.status(403).json({
				success: false,
				message: 'Brak uprawnień do usunięcia zespołu'
			});
		}

		// Sprawdź czy zespół istnieje
		const team = await Team.findById(teamId);
		if (!team) {
			return res.status(404).json({
				success: false,
				message: 'Zespół nie został znaleziony'
			});
		}

		// Sprawdź czy użytkownik należy do tego zespołu (lub jest super adminem)
		const isSuperAdmin = currentUser.username === 'michalipka1@gmail.com';
		if (!isSuperAdmin && currentUser.teamId.toString() !== teamId) {
			return res.status(403).json({
				success: false,
				message: 'Brak uprawnień do usunięcia tego zespołu'
			});
		}

		// Pobierz wszystkich użytkowników zespołu
		const teamUsers = await User.find({ teamId });
		const userIds = teamUsers.map(user => user._id);

		// Usuń wszystkie powiązane dane użytkowników
		await Promise.all([
			Workday.deleteMany({ userId: { $in: userIds } }),
			LeaveRequest.deleteMany({ userId: { $in: userIds } }),
			LeavePlan.deleteMany({ userId: { $in: userIds } }),
			CalendarConfirmation.deleteMany({ userId: { $in: userIds } }),
			Log.deleteMany({ user: { $in: userIds } }),
			Message.deleteMany({ userId: { $in: userIds } })
		]);

		// Usuń wszystkie kanały zespołu (to usunie też wszystkie wiadomości w tych kanałach)
		const teamChannels = await Channel.find({ teamId });
		const channelIds = teamChannels.map(channel => channel._id);
		await Message.deleteMany({ channelId: { $in: channelIds } });
		await Channel.deleteMany({ teamId });

		// Usuń wszystkie tablice zespołu
		await Board.deleteMany({ teamId });

		// Usuń wszystkie grafiki zespołu
		await Schedule.deleteMany({ teamId });

		// Usuń wszystkie działy zespołu
		await Department.deleteMany({ teamId });

		// Usuń wszystkie konfiguracje przełożonych zespołu
		await SupervisorConfig.deleteMany({ teamId });

		// Usuń wszystkich użytkowników zespołu
		await User.deleteMany({ teamId });

		// Usuń zespół
		await Team.findByIdAndDelete(teamId);

		res.json({
			success: true,
			message: 'Zespół i wszystkie powiązane dane zostały usunięte pomyślnie'
		});

	} catch (error) {
		console.error('Delete team error:', error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas usuwania zespołu'
		});
	}
};
