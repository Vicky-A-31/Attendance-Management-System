import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Key, Lock, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: Token & New Password
  const [formData, setFormData] = useState({
    email: '',
    resetToken: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    resetToken: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetTokenFromServer, setResetTokenFromServer] = useState('');
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validateResetToken = (token) => {
    if (!token) return 'Reset token is required';
    if (token.length !== 6) return 'Reset token must be 6 digits';
    return '';
  };

  const validateNewPassword = (password) => {
    if (!password) return 'New password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateConfirmPassword = (password) => {
    if (!password) return 'Please confirm your password';
    if (password !== formData.newPassword) return 'Passwords do not match';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '', general: '' }));
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      return;
    }

    setLoading(true);
    setErrors({ email: '', resetToken: '', newPassword: '', confirmPassword: '', general: '' });

    try {
      const response = await authAPI.forgotPassword(formData.email);
      
      if (response.data.success) {
        // In development, token is returned in response
        if (response.data.resetToken) {
          setResetTokenFromServer(response.data.resetToken);
        }
        setStep(2);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrors(prev => ({
        ...prev,
        general: error.response?.data?.error || 'Failed to request password reset'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const tokenError = validateResetToken(formData.resetToken);
    const passwordError = validateNewPassword(formData.newPassword);
    const confirmError = validateConfirmPassword(formData.confirmPassword);

    if (tokenError || passwordError || confirmError) {
      setErrors({
        ...errors,
        resetToken: tokenError,
        newPassword: passwordError,
        confirmPassword: confirmError
      });
      return;
    }

    setLoading(true);
    setErrors({ email: '', resetToken: '', newPassword: '', confirmPassword: '', general: '' });

    try {
      const response = await authAPI.resetPassword({
        email: formData.email,
        resetToken: formData.resetToken,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors(prev => ({
        ...prev,
        general: error.response?.data?.error || 'Failed to reset password'
      }));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern p-4">
        <div className="w-full max-w-md">
          <div className="card text-center animate-fade-in">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Reset Successful!</h2>
            <p className="text-slate-600 mb-6">
              Your password has been reset successfully. You can now login with your new password.
            </p>
            <Link to="/" className="btn-primary inline-block">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Forgot Password
          </h1>
          <p className="text-slate-600 text-lg">
            {step === 1 ? 'Enter your email to reset your password' : 'Enter reset token and new password'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-200'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Email</span>
          </div>
          <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-slate-200'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Reset</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="card animate-slide-in">
          {step === 1 ? (
            // Step 1: Email Form
            <form onSubmit={handleRequestReset} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="error-message flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
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
                  <>
                    <div className="spinner border-white"></div>
                    Requesting...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Request Reset Token
                  </>
                )}
              </button>
            </form>
          ) : (
            // Step 2: Reset Token & New Password Form
            <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
              {resetTokenFromServer && (
                <div className="alert-info animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Your Reset Token:</p>
                      <p className="text-lg font-mono font-bold">{resetTokenFromServer}</p>
                      <p className="text-xs mt-1">Valid for 15 minutes</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="resetToken" className="label">
                  Reset Token (6 digits)
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    id="resetToken"
                    name="resetToken"
                    value={formData.resetToken}
                    onChange={handleChange}
                    className={`input pl-10 ${errors.resetToken ? 'input-error' : ''}`}
                    placeholder="Enter 6-digit token"
                    maxLength={6}
                  />
                </div>
                {errors.resetToken && (
                  <p className="error-message flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.resetToken}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="label">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`input pl-10 pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword.new ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="error-message flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.newPassword}
                  </p>
                )}
                {!errors.newPassword && (
                  <p className="text-xs text-slate-500 mt-1">
                    Must be at least 8 characters
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword.confirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="error-message flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="spinner border-white"></div>
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📌 Important:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Reset token is valid for 15 minutes</li>
            <li>• Check your server console for the token (development mode)</li>
            <li>• In production, token would be sent via email</li>
            <li>• Contact administrator if you don't receive the token</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
