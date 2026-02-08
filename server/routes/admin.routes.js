const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(isAdmin);

// Dashboard routes
router.get('/dashboard/stats', adminController.getDashboardStats);

// Student routes
router.get('/students', adminController.getAllStudents);
router.get('/students/:id', adminController.getStudentById);
router.post('/students', [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('rollNo').notEmpty().trim().withMessage('Roll number is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('year').notEmpty().withMessage('Year is required'),
    body('address').notEmpty().trim().withMessage('Address is required'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
    body('parentPhone').notEmpty().trim().withMessage('Parent phone is required'),
    // Optional fields
    body('phone').optional().trim(),
    body('batch').optional().matches(/^(\d{4}-\d{4})?$/).withMessage('Batch format should be YYYY-YYYY'),
    body('semester').optional(),
    body('bloodGroup').optional()
], adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/students/bulk-import', upload.single('file'), adminController.bulkImportStudents);

// Staff routes
router.get('/staff', adminController.getAllStaff);
router.get('/staff/:id', adminController.getStaffById);
router.post('/staff', [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('address').notEmpty().trim().withMessage('Address is required'),
    body('assignments').optional().isArray({ min: 1 }).withMessage('At least one assignment is required'),
    body('subjects').isArray({ min: 1 }).withMessage('At least one subject must be assigned')
], adminController.createStaff);
router.put('/staff/:id', adminController.updateStaff);
router.delete('/staff/:id', adminController.deleteStaff);
router.post('/staff/bulk-import', upload.single('file'), adminController.bulkImportStaff);

// Admin management routes
router.post('/admins', [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], adminController.createAdmin);

// Attendance overview
router.get('/attendance', adminController.getAttendanceOverview);
router.get('/attendance/records', adminController.getAllAttendanceRecords);
router.get('/attendance/student/:studentId', adminController.getStudentAttendance);

module.exports = router;
