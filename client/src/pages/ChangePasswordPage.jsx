import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  });
  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Validation functions
  const validateCurrentPassword = (password) => {
    if (!password) {
      return 'Current password is required';
    }
    return '';
  };

  const validateNewPassword = (password) => {
    if (!password) {
      return 'New password is required';
    }
    if (password.length < 8) {
      return 'New password must be at least 8 characters';
    }
    if (password === formData.currentPassword) {
      return 'New password must be different from current password';
    }
    return '';
  };

  const validateConfirmPassword = (password) => {
    if (!password) {
      return 'Please confirm your new password';
    }
    if (password !== formData.newPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    setErrors(prev => ({ ...prev, general: '', [name]: '' }));
    setSuccess(false);

    // Validate on change if field was touched
    if (touched[name]) {
      let error = '';
      if (name === 'currentPassword') {
        error = validateCurrentPassword(value);
      } else if (name === 'newPassword') {
        error = validateNewPassword(value);
        // Re-validate confirm password if it's been touched
        if (touched.confirmPassword && formData.confirmPassword) {
          const confirmError = value !== formData.confirmPassword 
            ? 'Passwords do not match' 
            : '';
          setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
      } else if (name === 'confirmPassword') {
        error = validateConfirmPassword(value);
      }
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    let error = '';
    if (name === 'currentPassword') {
      error = validateCurrentPassword(value);
    } else if (name === 'newPassword') {
      error = validateNewPassword(value);
    } else if (name === 'confirmPassword') {
      error = validateConfirmPassword(value);
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true
    });

    // Validate all fields
    const currentPasswordError = validateCurrentPassword(formData.currentPassword);
    const newPasswordError = validateNewPassword(formData.newPassword);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword);

    setErrors({
      currentPassword: currentPasswordError,
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError,
      general: ''
    });

    // Stop if there are validation errors
    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTouched({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false
        });

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate(-1); // Go back to previous page
        }, 2000);
      }
    } catch (error) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      setErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Change Password</h1>
          <p className="text-slate-600 mt-2">
            Update your password to keep your account secure
          </p>
        </div>

        {/* Change Password Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="label">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`input pl-10 pr-10 ${errors.currentPassword && touched.currentPassword ? 'input-error' : ''}`}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.currentPassword && touched.currentPassword && (
                <p className="error-message flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="label">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`input pl-10 pr-10 ${errors.newPassword && touched.newPassword ? 'input-error' : ''}`}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && touched.newPassword && (
                <p className="error-message flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.newPassword}
                </p>
              )}
              {!errors.newPassword && (
                <p className="text-xs text-slate-500 mt-1">
                  Must be at least 8 characters and different from current password
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`input pl-10 pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="error-message flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Success Message */}
            {success && (
              <div className="alert-success animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    Password changed successfully! Redirecting...
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors.general && (
              <div className="alert-danger animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="spinner border-white"></div>
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Okay
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
