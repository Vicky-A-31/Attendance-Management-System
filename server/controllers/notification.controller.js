const { validationResult } = require('express-validator');
const notificationService = require('../services/notification.service');
const Notification = require('../models/Notification.model');

// @desc    Get all notifications (logs)
// @route   GET /api/notifications
// @access  Private/Admin
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const notifications = await Notification.find()
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Notification.countDocuments();

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching notification logs'
    });
  }
};

// @desc    Send SMS notification
// @route   POST /api/notifications/send-sms
// @access  Private/Admin/Staff
exports.sendSMS = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone, message } = req.body;

    const result = await notificationService.sendSMS(phone, message);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send SMS',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending SMS'
    });
  }
};

// @desc    Send WhatsApp notification
// @route   POST /api/notifications/send-whatsapp
// @access  Private/Admin/Staff
exports.sendWhatsApp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone, message } = req.body;

    const result = await notificationService.sendWhatsApp(phone, message);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'WhatsApp message sent successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send WhatsApp message',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending WhatsApp message'
    });
  }
};

// @desc    Test notification
// @route   POST /api/notifications/test
// @access  Private/Admin/Staff
exports.testNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone } = req.body;
    const testMessage = 'This is a test message from College Attendance Management System.';

    const smsResult = await notificationService.sendSMS(phone, testMessage);
    const whatsappResult = await notificationService.sendWhatsApp(phone, testMessage);

    res.status(200).json({
      success: true,
      message: 'Test notifications sent',
      data: {
        sms: smsResult,
        whatsapp: whatsappResult
      }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending test notifications'
    });
  }
};
