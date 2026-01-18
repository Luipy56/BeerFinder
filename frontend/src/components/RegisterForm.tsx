import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './RegisterForm.css';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = (): boolean => {
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          setError(errorData);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          // Handle field-specific errors
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]: [string, any]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('\n');
          setError(errorMessages || 'Registration failed. Please check your input.');
        }
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form" aria-label="Registration form">
      <h2 className="form-title">Register</h2>
      {error && (
        <div className="form-error-message" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      <div className="form-group">
        <label htmlFor="username" className="form-label required">
          Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          className={`form-input ${error ? 'error' : ''}`}
          value={formData.username}
          onChange={handleChange}
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>
      <div className="form-group">
        <label htmlFor="email" className="form-label required">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-input ${error ? 'error' : ''}`}
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>
      <div className="form-group">
        <label htmlFor="first_name" className="form-label">
          First Name
        </label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          className="form-input"
          value={formData.first_name}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="last_name" className="form-label">
          Last Name
        </label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          className="form-input"
          value={formData.last_name}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password" className="form-label required">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className={`form-input ${error ? 'error' : ''}`}
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
          minLength={8}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
        />
        <span className="form-help">Must be at least 8 characters long</span>
      </div>
      <div className="form-group">
        <label htmlFor="password_confirm" className="form-label required">
          Confirm Password
        </label>
        <input
          type="password"
          id="password_confirm"
          name="password_confirm"
          className={`form-input ${error ? 'error' : ''}`}
          value={formData.password_confirm}
          onChange={handleChange}
          required
          disabled={isLoading}
          minLength={8}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`btn btn-primary ${isLoading ? 'btn-loading' : ''}`}
        aria-label={isLoading ? 'Registering...' : 'Register'}
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;
