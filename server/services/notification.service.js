const Notification = require('../models/Notification.model');

const COLLEGE_NAME = process.env.COLLEGE_SHORT_NAME || 'Queens College';

/**
 * Format phone number for WhatsApp (91XXXXXXXXXX)
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
const formatWhatsAppNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Format phone number for Fast2SMS (XXXXXXXXXX)
 * @param {string} phone - Phone number
 * @returns {string} 10-digit number
 */
const formatSMSNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
};

/**
 * Send SMS notification via Fast2SMS
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @param {Object} metadata - Optional metadata
 */
const sendSMS = async (to, message, metadata = {}) => {
  try {
    const mobile = formatSMSNumber(to);
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      console.log('📱 [SMS - TEST MODE] Fast2SMS key missing');
      await Notification.create({
        to: mobile,
        message,
        type: 'sms',
        status: 'test',
        metadata: { ...metadata, testMode: true }
      });
      return { success: true, mode: 'test', to: mobile };
    }

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: mobile
      })
    });

    const result = await response.json();

    if (result.return === true) {
      await Notification.create({
        to: mobile,
        message,
        type: 'sms',
        status: 'sent',
        metadata: { ...metadata, requestId: result.request_id }
      });
      console.log(`✅ SMS sent successfully to ${mobile}`);
      return { success: true, requestId: result.request_id };
    } else {
      throw new Error(result.message || 'Fast2SMS failed');
    }
  } catch (error) {
    console.error(`❌ SMS Error:`, error.message);
    await Notification.create({
      to,
      message,
      type: 'sms',
      status: 'failed',
      metadata: { ...metadata, error: error.message }
    });
    return { success: false, error: error.message };
  }
};

/**
 * Send WhatsApp notification via GREEN-API
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @param {Object} metadata - Optional metadata
 */
const sendWhatsApp = async (to, message, metadata = {}) => {
  try {
    const waNumber = formatWhatsAppNumber(to);
    const idInstance = process.env.GREEN_API_ID_INSTANCE;
    const apiToken = process.env.GREEN_API_TOKEN;

    if (!idInstance || !apiToken) {
      console.log('💬 [WhatsApp - TEST MODE] GreenAPI credentials missing');
      await Notification.create({
        to: waNumber,
        message,
        type: 'whatsapp',
        status: 'test',
        metadata: { ...metadata, testMode: true }
      });
      return { success: true, mode: 'test', to: waNumber };
    }

    const response = await fetch(`https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: `${waNumber}@c.us`,
        message: message
      })
    });

    const result = await response.json();

    if (result.idMessage) {
      await Notification.create({
        to: waNumber,
        message,
        type: 'whatsapp',
        status: 'sent',
        metadata: { ...metadata, messageId: result.idMessage }
      });
      console.log(`✅ WhatsApp sent successfully to ${waNumber}`);
      return { success: true, messageId: result.idMessage };
    } else {
      throw new Error(JSON.stringify(result));
    }
  } catch (error) {
    console.error(`❌ WhatsApp Error:`, error.message);
    await Notification.create({
      to,
      message,
      type: 'whatsapp',
      status: 'failed',
      metadata: { ...metadata, error: error.message }
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create absence notification message
 */
const createAbsenceMessage = (student, period, date) => {
  const dateStr = new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  return `Alert: ${student.name} (Roll: ${student.rollNo}) was ABSENT in Period ${period} on ${dateStr}. - ${COLLEGE_NAME}`;
};

/**
 * Send absence notifications to parents
 */
const sendAbsentNotifications = async (absentStudents, staff) => {
  const results = { sms: [], whatsapp: [], successful: 0, failed: 0 };

  for (const { student, period, date } of absentStudents) {
    const message = createAbsenceMessage(student, period, date);
    const metadata = { studentId: student._id, rollNo: student.rollNo, studentName: student.name };

    // Attempt Send
    const smsRes = await sendSMS(student.parentPhone, message, metadata);
    const waRes = await sendWhatsApp(student.parentPhone, message, metadata);

    results.sms.push(smsRes);
    results.whatsapp.push(waRes);

    if (smsRes.success || waRes.success) results.successful++;
    else results.failed++;
  }

  return results;
};

const sendCustomNotification = async (phone, message, type = 'sms') => {
  return type === 'whatsapp' ? await sendWhatsApp(phone, message) : await sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendWhatsApp,
  sendAbsentNotifications,
  sendCustomNotification,
  createAbsenceMessage
};
