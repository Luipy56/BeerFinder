import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './LoginForm.css';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username, password });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const data = err.response?.data;
      const detail = typeof data?.detail === 'string' ? data.detail : data?.detail?.[0];
      const message =
        detail ||
        data?.non_field_errors?.[0] ||
        (err.response?.status === 401 ? t('components.loginForm.invalidCredentials') : null) ||
        (err.response ? t('components.loginForm.loginError') : t('components.loginForm.connectionError'));
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form" aria-label="Login form">
      <h2 className="form-title">Login</h2>
      {error && (
        <div className="form-error-message" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      <div className="form-group">
        <label htmlFor="username" className="form-label required">
          {t('components.loginForm.username')}
        </label>
        <input
          type="text"
          id="username"
          className={`form-input ${error ? 'error' : ''}`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'username-error' : undefined}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password" className="form-label required">
          Password
        </label>
        <input
          type="password"
          id="password"
          className={`form-input ${error ? 'error' : ''}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'password-error' : undefined}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`btn btn-primary ${isLoading ? 'btn-loading' : ''}`}
        aria-label={isLoading ? t('common.saving') : t('components.loginForm.submit')}
      >
        {isLoading ? t('common.saving') : t('components.loginForm.submit')}
      </button>
    </form>
  );
};

export default LoginForm;
