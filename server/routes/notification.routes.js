const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { verifyToken, isAdminOrStaff } = require('../middleware/auth.middleware');

// Apply authentication middleware
router.use(verifyToken);
router.use(isAdminOrStaff);

// Get notification logs (Admin only for full list, but here we allow staff for now or keep it simple)
router.get('/', notificationController.getNotifications);

// Send custom SMS
router.post('/send-sms', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('message').notEmpty().withMessage('Message is required')
], notificationController.sendSMS);

// Send custom WhatsApp
router.post('/send-whatsapp', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('message').notEmpty().withMessage('Message is required')
], notificationController.sendWhatsApp);

// Test notification
router.post('/test', [
  body('phone').notEmpty().withMessage('Phone number is required')
], notificationController.testNotification);

module.exports = router;
