const nodemailer = require('nodemailer');

/**
 * Send email using nodemailer (Gmail SMTP)
 * @param {Object} options - Email options (email, subject, message, html)
 */
const sendEmail = async (options) => {
  // Validate environment variables
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-gmail@gmail.com') {
    throw new Error('SMTP_USER is not configured in .env file. Please set your Gmail address.');
  }
  if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'your-16-char-app-password') {
    throw new Error('SMTP_PASS is not configured in .env file. Please set your Gmail App Password.');
  }

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Define email options
  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Attendance System'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', options.email);
    console.log('   Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    if (error.code === 'EAUTH') {
      throw new Error('Gmail authentication failed. Check your SMTP_USER and SMTP_PASS (use Gmail App Password, not regular password).');
    }
    throw error;
  }
};

module.exports = sendEmail;
