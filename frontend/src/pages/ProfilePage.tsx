import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import authService from '../services/authService';
import ProtectedRoute from '../components/ProtectedRoute';
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
    first_name: '',
    last_name: '',
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
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    try {
      const updatedUser = await authService.updateProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
      showSuccess('Profile updated successfully!');
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
              fieldErrors[field] = messages;
            }
          });
          setErrors(fieldErrors);
        } else {
          showError(errorData || 'Failed to update profile. Please try again.');
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
        first_name: user.first_name || '',
        last_name: user.last_name || '',
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
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-header-left">
              <button
                className="btn-back"
                onClick={() => navigate('/')}
                aria-label="Back to map"
              >
                ← Back to map
              </button>
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
                  <label htmlFor="email" className="form-label required">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    aria-required="true"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <span id="email-error" className="form-error" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="first_name" className="form-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className={`form-input ${errors.first_name ? 'error' : ''}`}
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={isSaving}
                    aria-invalid={errors.first_name ? 'true' : 'false'}
                    aria-describedby={errors.first_name ? 'first_name-error' : undefined}
                  />
                  {errors.first_name && (
                    <span id="first_name-error" className="form-error" role="alert">
                      {errors.first_name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="last_name" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className={`form-input ${errors.last_name ? 'error' : ''}`}
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={isSaving}
                    aria-invalid={errors.last_name ? 'true' : 'false'}
                    aria-describedby={errors.last_name ? 'last_name-error' : undefined}
                  />
                  {errors.last_name && (
                    <span id="last_name-error" className="form-error" role="alert">
                      {errors.last_name}
                    </span>
                  )}
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
                <div className="profile-info-item">
                  <span className="profile-info-label">First Name</span>
                  <span className="profile-info-value">{user.first_name || 'Not provided'}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Last Name</span>
                  <span className="profile-info-value">{user.last_name || 'Not provided'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
