const { firmDb } = require('../db/db')
const Workday = require('../models/Workday')(firmDb)
const User = require('../models/user')(firmDb)

exports.addWorkday = async (req, res) => {
	const { date, hoursWorked, additionalWorked, realTimeDayWorked, absenceType } = req.body
	try {
		const workday = new Workday({
			userId: req.user.userId,
			date,
			hoursWorked,
			additionalWorked,
			realTimeDayWorked,
			absenceType,
		})
		await workday.save()
		res.status(201).send('Workday added successfully.')
	} catch (error) {
		console.error('Error adding workday:', error)
		res.status(500).send('Failed to add workday.')
	}
}

exports.getWorkdays = async (req, res) => {
	try {
		const workdays = await Workday.find({ userId: req.user.userId })
		res.json(workdays)
	} catch (error) {
		console.error('Error retrieving workdays:', error)
		res.status(500).send('Failed to retrieve workdays.')
	}
}

exports.deleteWorkday = async (req, res) => {
	try {
		const result = await Workday.deleteOne({ _id: req.params.id, userId: req.user.userId })
		if (result.deletedCount === 0) return res.status(404).send('Workday not found or unauthorized')
		res.send('Workday deleted successfully.')
	} catch (error) {
		console.error('Error deleting workday:', error)
		res.status(500).send('Failed to delete workday.')
	}
}

// exports.getUserWorkdays = async (req, res) => {
// 	console.log("req.user in workdays:", req.user);
// 	try {
// 		const { userId } = req.params

// 		const allowedRoles = [
// 			'Admin',
// 			'Zarząd',
// 			'Kierownik IT',
// 			'Kierownik BOK',
// 			'Kierownik Bukmacher',
// 			'Kierownik Marketing',
// 			'Urlopy czas pracy',
// 		]
// 		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
// 			return res.status(403).send('Access denied')
// 		}

// 		const workdays = await Workday.find({ userId })
// 		res.json(workdays)
// 	} catch (error) {
// 		console.error('Error fetching workdays for user:', error)
// 		res.status(500).send('Failed to fetch workdays.')
// 	}
// }
exports.getUserWorkdays = async (req, res) => {
	try {
		const { userId } = req.params;
		const requestingUser = await User.findById(req.user.userId);

		if (!requestingUser) {
			return res.status(403).send('Brak uprawnień');
		}

		
		const isAdmin = requestingUser.roles.includes('Admin');
		const isHR = requestingUser.roles.includes('Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)');

		
		const isSelf = requestingUser._id.toString() === userId;

		
		const userToView = await User.findById(userId);
		
		// Sprawdź czy użytkownicy mają wspólny dział (dla wielu działów)
		const requestingDepts = Array.isArray(requestingUser.department) ? requestingUser.department : (requestingUser.department ? [requestingUser.department] : [])
		const userToViewDepts = Array.isArray(userToView?.department) ? userToView.department : (userToView?.department ? [userToView.department] : [])
		const hasCommonDepartment = requestingDepts.some(dept => userToViewDepts.includes(dept))
		
		const isSupervisorOfDepartment =
			requestingUser.roles.includes('Może zatwierdzać urlopy swojego działu (Approve Leaves Department)') &&
			userToView &&
			hasCommonDepartment;

		if (!(isAdmin || isHR || isSelf || isSupervisorOfDepartment)) {
			return res.status(403).send('Access denied');
		}

		const workdays = await Workday.find({ userId });
		res.json(workdays);
	} catch (error) {
		console.error('Error fetching workdays for user:', error);
		res.status(500).send('Failed to fetch workdays.');
	}
}
