const express = require('express')
const router = express.Router()
const superAdminActivityController = require('../controllers/superAdminActivityController')

router.get('/overview', superAdminActivityController.getOverview)

module.exports = router
