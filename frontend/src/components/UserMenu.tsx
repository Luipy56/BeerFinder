import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import { APP_VERSION } from '../utils/constants';
import './UserMenu.css';

const UserMenu: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setIsOpen(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <button
        className="btn btn-primary"
        onClick={() => navigate('/auth')}
        aria-label={t('common.goToLogin')}
      >
        {t('pages.auth.login')}
      </button>
    );
  }

  const displayName = user.username;

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.userMenu')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="user-avatar" aria-hidden="true">
          {user.username.charAt(0).toUpperCase()}
        </span>
        <span className="user-name">{displayName}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`} aria-hidden="true">▼</span>
      </button>
      {isOpen && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-info">
            <div className="user-info-item">
              <strong>{t('components.userMenu.username')}</strong> {user.username}
            </div>
          </div>
          <div className="menu-divider"></div>
          <button
            className={`menu-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavClick('/')}
            role="menuitem"
            aria-label={t('common.viewMap')}
          >
            {t('common.navMap')}
          </button>
          <button
            className={`menu-item ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => handleNavClick('/profile')}
            role="menuitem"
            aria-label={t('common.viewProfile')}
          >
            {t('common.navProfile')}
          </button>
          <button
            className={`menu-item ${isActive('/item-requests') ? 'active' : ''}`}
            onClick={() => handleNavClick('/item-requests')}
            role="menuitem"
            aria-label={t('common.viewMyItemRequests')}
          >
            {t('common.navMyItemRequests')}
          </button>
          {user.is_admin && (
            <button
              className={`menu-item ${isActive('/item-requests/all') ? 'active' : ''}`}
              onClick={() => handleNavClick('/item-requests/all')}
              role="menuitem"
              aria-label={t('common.viewAllItemRequests')}
            >
              {t('common.navAllItemRequests')}
            </button>
          )}
          <button
            className={`menu-item ${isActive('/items') ? 'active' : ''}`}
            onClick={() => handleNavClick('/items')}
            role="menuitem"
            aria-label={t('common.viewItems')}
          >
            {t('common.navItems')}
          </button>
          <button
            className={`menu-item ${isActive('/pois') ? 'active' : ''}`}
            onClick={() => handleNavClick('/pois')}
            role="menuitem"
            aria-label={t('common.viewPOIs')}
          >
            {t('common.navPOIs')}
          </button>
          <div className="menu-divider"></div>
          <div className="menu-item menu-item-theme" role="none">
            <ThemeToggle />
          </div>
          <div className="menu-divider"></div>
          <div className="menu-item menu-item-version" role="none">
            {t('common.version')} {APP_VERSION}
          </div>
          <button
            className="menu-item"
            onClick={handleLogout}
            role="menuitem"
            aria-label={t('common.logout')}
          >
            {t('common.logout')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
