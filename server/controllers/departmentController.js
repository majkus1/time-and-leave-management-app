// controllers/departmentController.js
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb);
const Department = require('../models/Department')(firmDb);

exports.getDepartments = async (req, res) => {
	try {
		const teamId = req.user.teamId;
		
		let departments = await Department.find({ teamId, isActive: true }).select('name');
		
		if (departments.length === 0) {
			const userDepartments = await User.distinct('department', { 
				teamId, 
				department: { $ne: null, $ne: '' } 
			});
			departments = userDepartments.map(name => ({ name }));
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
		const { name } = req.body;
		const teamId = req.user.teamId;

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
		res.status(500).json({ message: 'Błąd tworzenia działu' });
	}
};
