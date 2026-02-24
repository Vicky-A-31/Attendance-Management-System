import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
  Mail, ArrowLeft, AlertCircle, CheckCircle,
  Key, Lock, Eye, EyeOff, RefreshCw, ShieldCheck
} from 'lucide-react';

export default function ForgotPasswordPage() {
  // step: 1 = Enter Email, 2 = Verify OTP, 3 = Set New Password
  const [step, setStep] = useState(1);

  const [email, setEmail]           = useState('');
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '', general: '' });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });

  // Resend OTP cooldown (60 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const otpRefs = useRef([]);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── Validations ────────────────────────────────────────────────────────────
  const validateEmail = (v) => {
    if (!v) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address';
    return '';
  };
  const validateOtp = (digits) => {
    const val = digits.join('');
    if (!val || val.length < 6) return 'Please enter the complete 6-digit OTP';
    return '';
  };
  const validateNewPassword = (v) => {
    if (!v) return 'New password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    return '';
  };
  const validateConfirmPassword = (v) => {
    if (!v) return 'Please confirm your password';
    if (v !== newPassword) return 'Passwords do not match';
    return '';
  };

  // ─── OTP input handlers ─────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const updated = [...otp];
    updated[index] = value.slice(-1); // keep only last digit
    setOtp(updated);
    setErrors(prev => ({ ...prev, otp: '', general: '' }));
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = [...otp];
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    setOtp(updated);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ─── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setErrors(prev => ({ ...prev, email: emailErr })); return; }

    setLoading(true);
    setErrors({ email: '', otp: '', newPassword: '', confirmPassword: '', general: '' });
    try {
      const response = await authAPI.forgotPassword(email);
      if (response.data.success) {
        setStep(2);
        startCooldown();
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error.response?.data?.error || 'Failed to send OTP. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setErrors({ email: '', otp: '', newPassword: '', confirmPassword: '', general: '' });
    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      if (response.data.success) {
        startCooldown();
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error.response?.data?.error || 'Failed to resend OTP. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpErr = validateOtp(otp);
    if (otpErr) { setErrors(prev => ({ ...prev, otp: otpErr })); return; }

    setLoading(true);
    setErrors({ email: '', otp: '', newPassword: '', confirmPassword: '', general: '' });
    try {
      const response = await authAPI.verifyOTP({ email, otp: otp.join('') });
      if (response.data.success) {
        setStep(3);
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error.response?.data?.error || 'Invalid or expired OTP. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Reset Password ─────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const passErr    = validateNewPassword(newPassword);
    const confirmErr = validateConfirmPassword(confirmPassword);
    if (passErr || confirmErr) {
      setErrors(prev => ({ ...prev, newPassword: passErr, confirmPassword: confirmErr }));
      return;
    }

    setLoading(true);
    setErrors({ email: '', otp: '', newPassword: '', confirmPassword: '', general: '' });
    try {
      const response = await authAPI.resetPassword({
        email,
        resetToken: otp.join(''),
        newPassword
      });
      if (response.data.success) {
        setSuccess(true);
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error.response?.data?.error || 'Failed to reset password. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern p-4">
        <div className="w-full max-w-md">
          <div className="card text-center animate-fade-in">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-success-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Reset Successful!</h2>
            <p className="text-slate-600 mb-8">
              Your password has been reset successfully.<br />
              You can now log in with your new password.
            </p>
            <Link to="/" className="btn-primary inline-block px-8 py-3">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step labels ─────────────────────────────────────────────────────────────
  const steps = [
    { num: 1, label: 'Email' },
    { num: 2, label: 'Verify OTP' },
    { num: 3, label: 'New Password' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-pattern p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Key className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Forgot Password</h1>
          <p className="text-slate-600 text-base">
            {step === 1 && 'Enter your registered email to receive an OTP'}
            {step === 2 && `OTP sent to ${email}`}
            {step === 3 && 'OTP verified! Set your new password'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center ${step >= s.num ? 'text-primary-600' : 'text-slate-400'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step > s.num
                    ? 'bg-success-500 text-white'
                    : step === s.num
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className="ml-2 text-xs font-semibold hidden sm:inline">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-10 sm:w-14 h-1 mx-2 rounded transition-all duration-500 ${step > s.num ? 'bg-success-500' : step === s.num ? 'bg-primary-300' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="card animate-slide-in">

          {/* ── STEP 1: Enter Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '', general: '' })); }}
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter your registered email"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p className="error-message flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" /> {errors.email}
                  </p>
                )}
              </div>

              {errors.general && (
                <div className="alert-danger animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{errors.general}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="spinner border-white"></div> Sending OTP...</>
                ) : (
                  <><Mail className="w-5 h-5" /> Send OTP to Email</>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: Verify OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6" noValidate>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">OTP sent to your email!</p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    We sent a 6-digit OTP to <strong>{email}</strong>. Check your inbox (and spam folder).
                  </p>
                </div>
              </div>

              <div>
                <label className="label">Enter 6-Digit OTP</label>
                <div className="flex gap-2 justify-center mt-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all duration-200
                        ${errors.otp
                          ? 'border-red-400 bg-red-50 focus:border-red-500'
                          : digit
                          ? 'border-primary-500 bg-primary-50 focus:border-primary-600'
                          : 'border-slate-300 bg-white focus:border-primary-500'
                        }`}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="error-message flex items-center gap-1 mt-2 justify-center">
                    <AlertCircle className="w-4 h-4" /> {errors.otp}
                  </p>
                )}
              </div>

              {errors.general && (
                <div className="alert-danger animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{errors.general}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join('').length < 6}
                className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="spinner border-white"></div> Verifying...</>
                ) : (
                  <><ShieldCheck className="w-5 h-5" /> Verify OTP</>
                )}
              </button>

              {/* Resend + Back */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(['','','','','','']); }}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4" /> Change email
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || loading}
                  className={`text-sm flex items-center gap-1 transition-colors font-medium ${
                    resendCooldown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-primary-600 hover:text-primary-800'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Set New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-green-800">OTP verified! Now set your new password.</p>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrors(prev => ({ ...prev, newPassword: '', general: '' })); }}
                    className={`input pl-10 pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                    placeholder="Enter new password (min 8 chars)"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword ? (
                  <p className="error-message flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" /> {errors.newPassword}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '', general: '' })); }}
                    className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="error-message flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {errors.general && (
                <div className="alert-danger animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{errors.general}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="spinner border-white"></div> Resetting...</>
                ) : (
                  <><Lock className="w-5 h-5" /> Reset Password</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Info note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📌 Important:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• OTP is valid for <strong>15 minutes</strong></li>
            <li>• Check your <strong>inbox and spam/junk</strong> folder</li>
            <li>• Do not share OTP with anyone</li>
            <li>• Contact administrator if you don't receive the OTP</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
