import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import authService from '../services/authService';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user: contextUser, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(contextUser);
  const [formData, setFormData] = useState({
    email: '',
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setFormData({
        email: userData.email || '',
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      showError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    const hasAnyPassword = !!(
      formData.current_password?.trim() ||
      formData.new_password?.trim() ||
      formData.new_password_confirm?.trim()
    );
    if (hasAnyPassword) {
      if (!formData.current_password?.trim()) {
        newErrors.current_password = 'Current password is required to change password';
      }
      if (!formData.new_password?.trim()) {
        newErrors.new_password = 'New password is required';
      } else if (formData.new_password.length < 8) {
        newErrors.new_password = 'New password must be at least 8 characters';
      }
      if (formData.new_password !== formData.new_password_confirm) {
        newErrors.new_password_confirm = "New passwords don't match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    setErrors({});
    try {
      const updatedUser = await authService.updateProfile({ email: formData.email });
      setUser(updatedUser);

      const hasPasswordChange = !!(
        formData.current_password?.trim() &&
        formData.new_password?.trim() &&
        formData.new_password_confirm?.trim()
      );
      if (hasPasswordChange) {
        await authService.changePassword(formData.current_password, formData.new_password);
      }

      setFormData((prev) => ({
        ...prev,
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      }));
      setIsEditing(false);
      showSuccess(hasPasswordChange ? 'Profile and password updated successfully!' : 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const fieldErrors: Record<string, string> = {};
          Object.entries(errorData).forEach(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              fieldErrors[field] = messages[0];
            } else {
              fieldErrors[field] = String(messages);
            }
          });
          setErrors(fieldErrors);
        } else {
          showError(String(errorData) || 'Failed to update profile. Please try again.');
        }
      } else {
        showError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        email: user.email || '',
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="profile-page">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="profile-page">
          <div className="profile-error">
            <p>Failed to load profile. Please try again.</p>
            <button className="btn btn-primary" onClick={loadProfile}>
              Retry
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="page-layout">
        <Header />
        <div className="profile-page">
          <div className="profile-container">
          <div className="profile-header">
            <div className="profile-header-left">
              <h1>Profile</h1>
            </div>
            {!isEditing && (
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
                aria-label="Edit profile"
              >
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form" aria-label="Edit profile form">
              <div className="profile-form-content">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    className="form-input"
                    value={user.username}
                    disabled
                    aria-label="Username (read-only)"
                  />
                  <span className="form-help">Username cannot be changed</span>
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSaving}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <span id="email-error" className="form-error" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="profile-form-password-section">
                  <h3 className="profile-form-password-heading">Change password</h3>
                  <div className="form-group">
                    <label htmlFor="current_password" className="form-label">
                      Current password
                    </label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      className={`form-input ${errors.current_password ? 'error' : ''}`}
                      value={formData.current_password}
                      onChange={handleChange}
                      disabled={isSaving}
                      autoComplete="current-password"
                      placeholder="Leave blank to keep current password"
                      aria-invalid={errors.current_password ? 'true' : 'false'}
                    />
                    {errors.current_password && (
                      <span className="form-error" role="alert">
                        {errors.current_password}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="new_password" className="form-label">
                      New password
                    </label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      className={`form-input ${errors.new_password ? 'error' : ''}`}
                      value={formData.new_password}
                      onChange={handleChange}
                      disabled={isSaving}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      aria-invalid={errors.new_password ? 'true' : 'false'}
                    />
                    {errors.new_password && (
                      <span className="form-error" role="alert">
                        {errors.new_password}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="new_password_confirm" className="form-label">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      id="new_password_confirm"
                      name="new_password_confirm"
                      className={`form-input ${errors.new_password_confirm ? 'error' : ''}`}
                      value={formData.new_password_confirm}
                      onChange={handleChange}
                      disabled={isSaving}
                      autoComplete="new-password"
                      aria-invalid={errors.new_password_confirm ? 'true' : 'false'}
                    />
                    {errors.new_password_confirm && (
                      <span className="form-error" role="alert">
                        {errors.new_password_confirm}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-form-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSaving ? 'btn-loading' : ''}`}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="profile-info">
                <div className="profile-info-item">
                  <span className="profile-info-label">Username</span>
                  <span className="profile-info-value">{user.username}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Email</span>
                  <span className="profile-info-value">{user.email || 'Not provided'}</span>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
