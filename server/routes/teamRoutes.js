const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { teamRegistrationLimiter } = require('../utils/rateLimiters');

router.post('/register', teamRegistrationLimiter, teamController.registerTeam);


router.get('/:teamId', authenticateToken, teamController.getTeamInfo);
router.get('/:teamId/users', authenticateToken, teamController.getTeamUsers);
router.post('/:teamId/check-limit', authenticateToken, teamController.checkUserLimit);
router.delete('/:teamId', authenticateToken, teamController.deleteTeam);

module.exports = router;
