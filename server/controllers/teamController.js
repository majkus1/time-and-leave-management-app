const { firmDb } = require('../db/db');
const Team = require('../models/Team')(firmDb);
const User = require('../models/user')(firmDb);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createLog } = require('../services/logService');
const { createGeneralChannel } = require('./chatController');
const { createTeamBoard } = require('./boardController');
const { createTeamSchedule } = require('./scheduleController');
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

		
		// Check for existing active team (ignore soft-deleted)
		const existingTeam = await Team.findOne({ name: teamName, isActive: true });
		if (existingTeam) {
			return res.status(400).json({
				success: false,
				message: 'Zespół o takiej nazwie już istnieje'
			});
		}

		// Check for soft-deleted team with same adminEmail
		const softDeletedTeam = await Team.findOne({ 
			adminEmail: adminEmail.toLowerCase(), 
			isActive: false 
		});
		if (softDeletedTeam) {
			const daysSinceDeletion = softDeletedTeam.deletedAt 
				? Math.ceil((Date.now() - new Date(softDeletedTeam.deletedAt).getTime()) / (1000 * 60 * 60 * 24))
				: 0;
			const remainingDays = Math.max(0, 30 - daysSinceDeletion);
			
			return res.status(400).json({
				success: false,
				message: 'Zespół z tym adresem email został usunięty',
				code: 'TEAM_SOFT_DELETED',
				retentionInfo: {
					remainingDays,
					totalDays: 30,
					canRestore: true
				}
			});
		}

		
		// Check for existing active user (ignore soft-deleted)
		const existingUser = await User.findOne({ 
			username: adminEmail,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		});
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

		// Record legal document acceptances (TERMS and PRIVACY) if provided
		// Note: DPA is automatically accepted when first employee is added
		const acceptedDocuments = req.body.acceptedDocuments || [];
		if (Array.isArray(acceptedDocuments) && acceptedDocuments.length > 0) {
			try {
				const LegalDocument = require('../models/LegalDocument')(firmDb);
				const LegalAcceptance = require('../models/LegalAcceptance')(firmDb);

				// Get current versions of accepted documents
				const currentDocs = await LegalDocument.find({
					type: { $in: acceptedDocuments },
					isCurrent: true
				});

				if (currentDocs.length > 0) {
					const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
					const userAgent = req.headers['user-agent'] || '';

					for (const doc of currentDocs) {
						try {
							const acceptance = new LegalAcceptance({
								userId: teamAdmin._id,
								teamId: newTeam._id,
								documentType: doc.type,
								documentVersion: doc.version,
								documentId: doc._id,
								ipAddress,
								userAgent
							});
							await acceptance.save();
						} catch (error) {
							// Ignore duplicate key errors (document already accepted)
							if (error.code !== 11000) {
								console.error(`Error recording legal acceptance for ${doc.type}:`, error);
							}
						}
					}
				}
			} catch (error) {
				console.error('Error recording legal document acceptances:', error);
				// Don't fail registration if acceptance recording fails
			}
		}

		// Create general channel for the team
		try {
			await createGeneralChannel(newTeam._id);
		} catch (error) {
			console.error('Error creating general channel for team:', error);
			// Don't fail the request if channel creation fails
		}

		// Create team schedule (grafik) for the team
		try {
			await createTeamSchedule(newTeam._id);
		} catch (error) {
			console.error('Error creating team schedule for team:', error);
			// Don't fail the request if schedule creation fails
		}

		// Create team board (tablica zadań) for the team
		try {
			await createTeamBoard(newTeam._id);
		} catch (error) {
			console.error('Error creating team board for team:', error);
			// Don't fail the request if board creation fails
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

		
		const isProduction = process.env.NODE_ENV === 'production'
		res.cookie('token', accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? 'None' : 'Lax',
			maxAge: 15 * 60 * 1000,
		});

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? 'None' : 'Lax',
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

		// Policz rzeczywistą liczbę aktywnych użytkowników (bez soft-deleted)
		const actualUserCount = await User.countDocuments({ 
			teamId, 
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		});

		// Zaktualizuj currentUserCount jeśli jest nieaktualne
		if (team.currentUserCount !== actualUserCount) {
			team.currentUserCount = actualUserCount;
			await team.save();
		}

		res.json({
			success: true,
			team: {
				id: team._id,
				name: team.name,
				maxUsers: team.maxUsers,
				currentUserCount: actualUserCount,
				remainingSlots: team.maxUsers - actualUserCount,
				canAddUser: actualUserCount < team.maxUsers,
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

		// Policz rzeczywistą liczbę aktywnych użytkowników w zespole (bez soft-deleted)
		const actualUserCount = await User.countDocuments({ 
			teamId, 
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		});
		
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

		// Soft delete wszystkich użytkowników zespołu
		const deletedAt = new Date();
		await User.updateMany(
			{ teamId, $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] },
			{ isActive: false, deletedAt }
		);

		// Soft delete zasobów zespołu (boards, schedules, departments, channels, supervisor configs)
		// Note: Workday, LeaveRequest, LeavePlan, CalendarConfirmation, Log, Message są historyczne
		// i pozostaną w bazie - zostaną usunięte przez cleanup job po 30 dniach
		await Promise.all([
			Board.updateMany({ teamId, isActive: { $ne: false } }, { isActive: false, deletedAt }),
			Schedule.updateMany({ teamId, isActive: { $ne: false } }, { isActive: false, deletedAt }),
			Department.updateMany({ teamId, isActive: { $ne: false } }, { isActive: false, deletedAt }),
			Channel.updateMany({ teamId, isActive: { $ne: false } }, { isActive: false, deletedAt }),
			SupervisorConfig.updateMany({ teamId }, { isActive: false, deletedAt })
		]);

		// Soft delete zespołu
		await Team.findByIdAndUpdate(teamId, {
			isActive: false,
			deletedAt
		});

		res.json({
			success: true,
			message: 'Zespół i wszyscy użytkownicy zostali oznaczeni jako usunięci. Dane zostaną trwale usunięte po 30 dniach zgodnie z Regulaminem.'
		});

	} catch (error) {
		console.error('Delete team error:', error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas usuwania zespołu'
		});
	}
};
