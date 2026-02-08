const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const staffController = require('../controllers/staff.controller');
const { verifyToken, isStaff } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(isStaff);

// Dashboard
router.get('/dashboard/stats', staffController.getDashboardStats);

// Students (only assigned to this staff)
router.get('/students', staffController.getAssignedStudents);

// Attendance
router.post('/attendance', [
  body('date').notEmpty().withMessage('Date is required'),
  body('period').isInt({ min: 1, max: 8 }).withMessage('Period must be between 1 and 8'),
  body('attendanceData').isArray().withMessage('Attendance data must be an array'),
  body('subject').optional().trim()
], staffController.markAttendance);

router.get('/attendance', staffController.getAttendance);
router.get('/attendance/date/:date', staffController.getAttendanceByDate);

module.exports = router;
