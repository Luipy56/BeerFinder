import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './RegisterForm.css';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
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
      setError(t('components.registerForm.passwordsDoNotMatch'));
      return false;
    }
    if (formData.password.length < 8) {
      setError(t('components.registerForm.passwordMinLength'));
      return false;
    }
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError(t('components.registerForm.validEmail'));
        return false;
      }
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
          setError(errorMessages || t('components.registerForm.registrationFailed'));
        }
      } else {
        setError(t('components.registerForm.genericError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form" aria-label={t('components.registerForm.title')}>
      <h2 className="form-title">{t('components.registerForm.title')}</h2>
      {error && (
        <div className="form-error-message" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      <div className="form-group">
        <label htmlFor="username" className="form-label required">
          {t('components.registerForm.username')}
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
        <label htmlFor="email" className="form-label">
          {t('components.registerForm.email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-input ${error ? 'error' : ''}`}
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password" className="form-label required">
          {t('components.registerForm.password')}
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
        <span className="form-help">{t('components.registerForm.passwordMinLength')}</span>
      </div>
      <div className="form-group">
        <label htmlFor="password_confirm" className="form-label required">
          {t('components.registerForm.confirmPassword')}
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
        aria-label={isLoading ? t('common.creating') : t('components.registerForm.submit')}
      >
        {isLoading ? t('common.creating') : t('components.registerForm.submit')}
      </button>
    </form>
  );
};

export default RegisterForm;
