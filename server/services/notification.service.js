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
 * Create SMS absence message (Bilingual: Tamil + English)
 */
const createAbsenceSMSMessage = (student, period, date, classTeacherPhone, classTeacherName) => {
  const dateStr = new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  let msg = `${COLLEGE_NAME}
வருகை இல்லாத அறிவிப்பு | Absence Alert:
மாணவர்: ${student.name} (சேர்க்கை எண்: ${student.rollNo})
இன்று (${dateStr}) Period ${period}-ல் வகுப்பில் கலந்துகொள்ளவில்லை.
Student: ${student.name} (Roll: ${student.rollNo}) was ABSENT in Period ${period} on ${dateStr}.`;

  if (classTeacherName && classTeacherPhone) {
    msg += `\nClass Teacher: ${classTeacherName} | Contact: ${classTeacherPhone}`;
  } else if (classTeacherPhone) {
    msg += `\nContact Class Teacher: ${classTeacherPhone}`;
  }
  return msg;
};

/**
 * Create WhatsApp absence message (Bilingual: Tamil + English)
 */
const createAbsenceWhatsAppMessage = (student, period, date, classTeacherPhone, classTeacherName) => {
  const dateStr = new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const dayStr = new Date(date).toLocaleDateString('en-IN', { weekday: 'long' });

  let msg = `🏫 *${COLLEGE_NAME}*
━━━━━━━━━━━━━━━━━━━━
⚠️ *வருகை இல்லாத அறிவிப்பு | Absence Alert*
━━━━━━━━━━━━━━━━━━━━

அன்பான பெற்றோர் / Dear Parent,

உங்கள் மகன்/மகள் இன்று வகுப்பில் கலந்துகொள்ளவில்லை என தெரிவிக்கப்படுகிறது.
Your ward was marked *ABSENT* today.

👤 *மாணவர் பெயர் | Student:* ${student.name}
🔢 *சேர்க்கை எண் | Roll No:* ${student.rollNo}
🏛️ *துறை | Department:* ${student.department}
📅 *வகுப்பு ஆண்டு | Year:* ${student.year}
📆 *தேதி | Date:* ${dayStr}, ${dateStr}
🕐 *பீரியட் | Period:* ${period}`;

  if (classTeacherName && classTeacherPhone) {
    msg += `\n👩‍🏫 *வகுப்பு ஆசிரியர் | Class Teacher:* ${classTeacherName}\n📞 *தொடர்பு | Contact:* ${classTeacherPhone}`;
  } else if (classTeacherPhone) {
    msg += `\n📞 *Class Teacher Contact:* ${classTeacherPhone}`;
  }

  msg += `\n\n━━━━━━━━━━━━━━━━━━━━
📞 *தயவுசெய்து உடனடியாக கல்லூரியை தொடர்பு கொள்ளுங்கள்.*
Please contact the college immediately if this is unexpected.

_This is an automated message from ${COLLEGE_NAME} Attendance System._`;

  return msg;
};

/**
 * Create absence notification message (kept for backward compatibility)
 */
const createAbsenceMessage = (student, period, date) => {
  return createAbsenceSMSMessage(student, period, date);
};

/**
 * Send absence notifications to parents
 */
const sendAbsentNotifications = async (absentStudents, staff) => {
  const results = { sms: [], whatsapp: [], successful: 0, failed: 0 };

  for (const { student, period, date, classTeacherPhone, classTeacherName } of absentStudents) {
    const smsMessage = createAbsenceSMSMessage(student, period, date, classTeacherPhone, classTeacherName);
    const whatsappMessage = createAbsenceWhatsAppMessage(student, period, date, classTeacherPhone, classTeacherName);
    const metadata = { studentId: student._id, rollNo: student.rollNo, studentName: student.name };

    // Attempt Send — SMS gets short English, WhatsApp gets bilingual Tamil+English
    const smsRes = await sendSMS(student.parentPhone, smsMessage, metadata);
    const waRes = await sendWhatsApp(student.parentPhone, whatsappMessage, metadata);

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
  createAbsenceMessage,
  createAbsenceSMSMessage,
  createAbsenceWhatsAppMessage
};
