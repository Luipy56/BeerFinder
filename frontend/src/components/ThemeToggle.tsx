import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <button
        type="button"
        className="theme-toggle-button"
        onClick={toggleTheme}
        aria-pressed={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        <span className="theme-toggle-label">
          {isDark ? 'Dark mode' : 'Light mode'}
        </span>
        <span className="theme-toggle-track" aria-hidden="true">
          <span className={`theme-toggle-thumb ${isDark ? 'dark' : ''}`} />
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;
