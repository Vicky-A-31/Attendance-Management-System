const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, isAdminOrStaff } = require('../middleware/auth.middleware');

// Apply authentication middleware
router.use(verifyToken);
router.use(isAdminOrStaff);

// Student attendance report
router.get('/student/:studentId/pdf', reportController.generateStudentReport);

// Class attendance report
router.get('/class/pdf', reportController.generateClassReport);

// Date-wise attendance report
router.get('/date/:date/pdf', reportController.generateDateReport);

// Detailed filtered attendance report
router.get('/detailed/pdf', reportController.generateDetailedReport);

module.exports = router;
