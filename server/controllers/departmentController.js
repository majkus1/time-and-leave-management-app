// controllers/departmentController.js
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb);
const Department = require('../models/Department')(firmDb);

exports.getDepartments = async (req, res) => {
	try {
		// Pobierz teamId z query params (dla super admina) lub z req.user
		let teamId = req.query.teamId || req.user.teamId;
		
		// Jeśli nadal nie ma teamId, pobierz z użytkownika z bazy danych
		if (!teamId) {
			const user = await User.findById(req.user.userId);
			if (user) {
				teamId = user.teamId;
			}
		}
		
		if (!teamId) {
			return res.status(400).json({ message: 'teamId jest wymagane' });
		}
		
		let departments = await Department.find({ teamId, isActive: true }).select('name');
		
		if (departments.length === 0) {
			// Dla wielu działów - pobierz wszystkie unikalne działy z tablicy department użytkowników
			const users = await User.find({ 
				teamId, 
				department: { $ne: null, $ne: [], $exists: true } 
			}).select('department');
			
			// Zbierz wszystkie unikalne działy z tablic
			const allDepartments = new Set();
			users.forEach(user => {
				if (Array.isArray(user.department)) {
					user.department.forEach(dept => {
						if (dept && dept.trim() !== '') {
							allDepartments.add(dept);
						}
					});
				} else if (user.department && user.department.trim() !== '') {
					allDepartments.add(user.department);
				}
			});
			
			departments = Array.from(allDepartments).map(name => ({ name }));
		}
		
		const departmentNames = departments.map(dept => dept.name);
		
		res.json(departmentNames);
	} catch (error) {
		console.error('Error in getDepartments:', error);
		res.status(500).json({ message: 'Błąd pobierania departmentów' });
	}
};

exports.createDepartment = async (req, res) => {
	try {
		const { name, teamId: bodyTeamId } = req.body;
		
		// Pobierz użytkownika z bazy danych
		const user = await User.findById(req.user.userId);
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
		}
		
		// Sprawdź czy to super admin
		const isSuperAdmin = user.username === 'michalipka1@gmail.com';
		
		// Pobierz teamId z request body (dla super admina) lub z req.user lub z użytkownika
		let teamId = bodyTeamId || req.user.teamId || user.teamId;
		
		// Dla super admina, teamId MUSI być w body
		if (isSuperAdmin && !bodyTeamId) {
			return res.status(400).json({ message: 'Dla super admina teamId jest wymagane w body requestu' });
		}

		if (!name || !teamId) {
			return res.status(400).json({ message: 'Nazwa działu i teamId są wymagane' });
		}

		const existingDepartment = await Department.findOne({ name, teamId });
		if (existingDepartment) {
			return res.status(400).json({ message: 'Dział o takiej nazwie już istnieje w tym zespole' });
		}

		const newDepartment = new Department({ name, teamId });
		await newDepartment.save();

		res.status(201).json({ message: 'Dział został utworzony', department: newDepartment });
	} catch (error) {
		console.error('Error in createDepartment:', error);
		res.status(500).json({ message: 'Błąd tworzenia działu', error: error.message });
	}
};

exports.deleteDepartment = async (req, res) => {
	try {
		const { name } = req.params;
		const { teamId: bodyTeamId } = req.query; // teamId z query params
		
		// Pobierz użytkownika z bazy danych
		const user = await User.findById(req.user.userId);
		if (!user) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
		}
		
		// Sprawdź czy to super admin
		const isSuperAdmin = user.username === 'michalipka1@gmail.com';
		
		// Pobierz teamId z query params (dla super admina) lub z req.user lub z użytkownika
		let teamId = bodyTeamId || req.user.teamId || user.teamId;
		
		// Dla super admina, teamId MUSI być w query params
		if (isSuperAdmin && !bodyTeamId) {
			return res.status(400).json({ message: 'Dla super admina teamId jest wymagane w query params' });
		}

		if (!name || !teamId) {
			return res.status(400).json({ message: 'Nazwa działu i teamId są wymagane' });
		}

		// Usuń dział z kolekcji Department (ustaw isActive na false)
		const department = await Department.findOne({ name, teamId });
		if (department) {
			department.isActive = false;
			await department.save();
		}

		// Usuń dział z wszystkich użytkowników w zespole
		const users = await User.find({ teamId });
		for (const user of users) {
			if (Array.isArray(user.department)) {
				user.department = user.department.filter(dept => dept !== name);
			} else if (user.department === name) {
				user.department = [];
			}
			await user.save();
		}

		res.status(200).json({ message: 'Dział został usunięty' });
	} catch (error) {
		console.error('Error in deleteDepartment:', error);
		res.status(500).json({ message: 'Błąd usuwania działu' });
	}
};
