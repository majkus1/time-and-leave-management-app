const express = require('express');
const router = express.Router();
const legalController = require('../controllers/legalController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes (for landing page) - no authentication required
router.get('/current', legalController.getCurrentDocuments);
router.get('/:type', legalController.getDocumentByType);

// Authenticated routes
router.post('/accept', authenticateToken, legalController.acceptDocuments);
router.get('/acceptance/status', authenticateToken, legalController.getAcceptanceStatus);
router.get('/user-acceptances', authenticateToken, legalController.getUserAcceptances);

module.exports = router;

