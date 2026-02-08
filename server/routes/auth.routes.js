const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Validation middleware
const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

// @route   POST /api/auth/login-admin
// @desc    Admin login
// @access  Public
router.post('/login-admin', loginValidation, authController.loginAdmin);

// @route   POST /api/auth/login-staff
// @desc    Staff login
// @access  Public
router.post('/login-staff', loginValidation, authController.loginStaff);

// @route   POST /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.post('/verify', verifyToken, authController.verifyToken);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', verifyToken, authController.logout);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
    verifyToken,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], authController.changePassword);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset token
// @access  Public
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], authController.resetPassword);

module.exports = router;
