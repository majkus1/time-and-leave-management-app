const { firmDb } = require('../db/db');
const User = require('../models/user')(firmDb);
const { updateSpecialTeamLimit } = require('../controllers/teamController');


const checkTeamAccess = async (req, res, next) => {
	try {
		const { userId } = req.params;
		const currentUserTeamId = req.user.teamId;

		if (!userId || !currentUserTeamId) {
			return res.status(400).json({
				success: false,
				message: 'Brak wymaganych danych'
			});
		}

		
		const targetUser = await User.findById(userId);
		if (!targetUser) {
			return res.status(404).json({
				success: false,
				message: 'Użytkownik nie został znaleziony'
			});
		}

		if (targetUser.teamId.toString() !== currentUserTeamId.toString()) {
			return res.status(403).json({
				success: false,
				message: 'Brak dostępu do danych użytkownika z innego zespołu'
			});
		}

	
		req.targetUser = targetUser;
		next();

	} catch (error) {
		console.error('Error in team access check:', error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas sprawdzania dostępu'
		});
	}
};


const checkTeamAdmin = (req, res, next) => {
	if (!req.user.isTeamAdmin && !req.user.roles.includes('Admin')) {
		return res.status(403).json({
			success: false,
			message: 'Brak uprawnień administratora zespołu'
		});
	}
	next();
};


const checkUserLimit = async (req, res, next) => {
	try {
		const { firmDb } = require('../db/db');
		const Team = require('../models/Team')(firmDb);
		const User = require('../models/user')(firmDb);

		const team = await Team.findById(req.user.teamId);
		if (!team) {
			return res.status(404).json({
				success: false,
				message: 'Zespół nie został znaleziony'
			});
		}

		// Update maxUsers for special teams if needed
		await updateSpecialTeamLimit(team)

		// Policz rzeczywistą liczbę użytkowników w zespole
		const actualUserCount = await User.countDocuments({ teamId: req.user.teamId });
		
		// Zaktualizuj currentUserCount jeśli jest nieaktualne
		if (team.currentUserCount !== actualUserCount) {
			team.currentUserCount = actualUserCount;
			await team.save();
		}

		if (actualUserCount >= team.maxUsers) {
			return res.status(400).json({
				success: false,
				message: `Osiągnięto limit użytkowników (${team.maxUsers}). Nie można dodać więcej użytkowników.`
			});
		}

		next();

	} catch (error) {
		console.error('Error checking user limit:', error);
		res.status(500).json({
			success: false,
			message: 'Błąd serwera podczas sprawdzania limitu użytkowników'
		});
	}
};

module.exports = {
	checkTeamAccess,
	checkTeamAdmin,
	checkUserLimit
};
