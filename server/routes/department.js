// routes/department.js
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, departmentController.getDepartments);
router.post('/', authenticateToken, departmentController.createDepartment);
router.get('/:name/users', authenticateToken, departmentController.getDepartmentUsers);
router.delete('/:name', authenticateToken, departmentController.deleteDepartment);

module.exports = router;
