const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const Staff = require("../models/Staff.model");
const sendEmail = require("../services/email.service");

// Generate JWT token
const generateToken = (id, role, email) => {
  return jwt.sign({ id, role, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// @desc    Admin login
// @route   POST /api/auth/login-admin
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account is inactive. Please contact system administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(admin._id, admin.role, admin.email);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          profileImage: admin.profileImage,
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
};

// @desc    Staff login
// @route   POST /api/auth/login-staff
// @access  Public
exports.loginStaff = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check if staff exists
    const staff = await Staff.findOne({ email }).select("+password");

    if (!staff) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check if staff is active
    if (!staff.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account is inactive. Please contact administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await staff.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(staff._id, staff.role, staff.email);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          department: staff.department,
          yearTaught: staff.yearTaught,
          assignments: staff.assignments,
          subjects: staff.subjects,
          profileImage: staff.profileImage,
        },
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
};

// @desc    Verify JWT token
// @route   POST /api/auth/verify
// @access  Private
exports.verifyToken = async (req, res) => {
  try {
    const { role, id } = req.user;

    let user;
    if (role === "admin") {
      user = await Admin.findById(id);
    } else if (role === "staff") {
      user = await Staff.findById(id);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "User not found or inactive",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          ...(role === "staff" && {
            department: user.department,
            yearTaught: user.yearTaught,
            assignments: user.assignments,
            subjects: user.subjects,
          }),
          profileImage: user.profileImage,
        },
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during token verification",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // In JWT, logout is handled client-side by removing the token
    // This endpoint is mainly for logging purposes
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during logout",
    });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;

    // Get user based on role
    let user;
    if (role === "admin") {
      user = await Admin.findById(id).select("+password");
    } else if (role === "staff") {
      user = await Staff.findById(id).select("+password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: "New password must be different from current password",
      });
    }

    // Update password
    user.password = newPassword;
    user.markModified("password"); // Explicitly mark as modified

    console.log("Password change - User:", user.email, "Role:", role);
    console.log("Password marked as modified:", user.isModified("password"));

    await user.save();

    console.log("Password saved successfully for:", user.email);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during password change",
    });
  }
};

// @desc    Forgot password - Generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Check in both Admin and Staff collections
    let user = await Admin.findOne({ email });
    let userType = "admin";

    if (!user) {
      user = await Staff.findOne({ email });
      userType = "staff";
    }

    if (!user) {
      // Don't reveal if email exists (security)
      return res.status(200).json({
        success: true,
        message:
          "If the email exists, a reset token has been generated. Please contact your administrator.",
      });
    }

    // Generate reset token (6-digit code)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash token before saving
    const crypto = require("crypto");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiry (15 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send Email
    const message =
      `You are receiving this email because you (or someone else) has requested the reset of a password.\n\n` +
      `Your OTP (One-Time Password) for password reset is: ${resetToken}\n\n` +
      `Please enter this OTP on the password reset page within 15 minutes.\n\n` +
      `If you did not request this, please ignore this email and your password will remain unchanged.\n`;

    const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">🔐 Password Reset OTP</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>You requested a password reset for your account on <strong>${process.env.COLLEGE_NAME || "Attendance Management System"}</strong>.</p>
            <div style="background-color: #f3f4f6; padding: 24px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px dashed #4f46e5;">
              <p style="margin-bottom: 10px; font-size: 14px; color: #6b7280; margin: 0 0 12px 0;">Your 6-digit OTP is:</p>
              <h1 style="letter-spacing: 10px; color: #4f46e5; margin: 0; font-size: 40px;">${resetToken}</h1>
              <p style="font-size: 12px; color: #ef4444; margin: 12px 0 0 0;">⏱ This OTP expires in 15 minutes</p>
            </div>
            <p>Please enter this OTP in the application to proceed with resetting your password.</p>
            <p style="font-size: 13px; color: #6b7280; background-color: #fef9c3; padding: 10px; border-radius: 6px;">⚠️ Do not share this OTP with anyone. The ${process.env.COLLEGE_NAME || "Attendance System"} team will never ask for your OTP.</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
        `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
        html,
      });

      res.status(200).json({
        success: true,
        message: "Password reset token sent to email",
      });
    } catch (err) {
      console.error("Error sending reset email:", err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        error: "Email could not be sent. Please contact administrator.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during password reset request",
    });
  }
};

// @desc    Verify OTP (step 2 - just validates OTP without resetting password)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP are required",
      });
    }

    // Hash the provided OTP to compare
    const crypto = require("crypto");
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    // Find user with matching token and not expired
    let user = await Admin.findOne({
      email,
      resetPasswordToken: hashedOTP,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      user = await Staff.findOne({
        email,
        resetPasswordToken: hashedOTP,
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // OTP is valid — do NOT clear it yet, it will be cleared when password is actually reset
    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now set your new password.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during OTP verification",
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Email, reset token, and new password are required",
      });
    }

    // Hash the provided token to compare
    const crypto = require("crypto");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Find user with matching token and not expired
    let user = await Admin.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      user = await Staff.findOne({
        email,
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      }).select("+password");
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    user.markModified("password");

    await user.save();

    console.log(`Password reset successful for: ${email}`);

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during password reset",
    });
  }
};
