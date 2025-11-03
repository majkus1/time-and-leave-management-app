const { firmDb } = require('../db/db');
const Team = require('../models/Team')(firmDb);
const User = require('../models/user')(firmDb);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createLog } = require('../services/logService');

exports.registerTeam = async (req, res) => {
	try {
		const {
			teamName,
			adminEmail,
			adminPassword,
			adminFirstName,
			adminLastName
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

	
		const newTeam = new Team({
			name: teamName,
			adminEmail,
			adminPassword: hashedPassword,
			adminFirstName,
			adminLastName,
			currentUserCount: 1
		});

		await newTeam.save();

		
		const teamAdmin = new User({
			username: adminEmail,
			password: hashedPassword,
			firstName: adminFirstName,
			lastName: adminLastName,
			teamId: newTeam._id,
			roles: ['Admin'],
			isTeamAdmin: true
		});

		await teamAdmin.save();

		
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
