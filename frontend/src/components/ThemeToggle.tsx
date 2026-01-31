import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="theme-toggle" role="group" aria-label={t('common.theme')}>
      <button
        type="button"
        className="theme-toggle-button"
        onClick={toggleTheme}
        aria-pressed={isDark}
        aria-label={isDark ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
        title={isDark ? t('common.lightMode') : t('common.darkMode')}
      >
        <span className="theme-toggle-label">
          {isDark ? t('common.darkMode') : t('common.lightMode')}
        </span>
        <span className="theme-toggle-track" aria-hidden="true">
          <span className={`theme-toggle-thumb ${isDark ? 'dark' : ''}`} />
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;
