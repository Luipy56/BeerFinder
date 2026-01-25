import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './UserMenu.css';

const UserMenu: React.FC = () => {
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
        aria-label="Go to login page"
      >
        Login
      </button>
    );
  }

  const displayName = user.username;

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
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
              <strong>Username:</strong> {user.username}
            </div>
          </div>
          <div className="menu-divider"></div>
          <button
            className={`menu-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavClick('/')}
            role="menuitem"
            aria-label="View map"
          >
            Map
          </button>
          <button
            className={`menu-item ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => handleNavClick('/profile')}
            role="menuitem"
            aria-label="View profile"
          >
            Profile
          </button>
          <button
            className={`menu-item ${isActive('/item-requests') ? 'active' : ''}`}
            onClick={() => handleNavClick('/item-requests')}
            role="menuitem"
            aria-label="View my item requests"
          >
            My Item Requests
          </button>
          {user.is_admin && (
            <button
              className={`menu-item ${isActive('/item-requests/all') ? 'active' : ''}`}
              onClick={() => handleNavClick('/item-requests/all')}
              role="menuitem"
              aria-label="View all item requests"
            >
              All Item Requests
            </button>
          )}
          <button
            className={`menu-item ${isActive('/items') ? 'active' : ''}`}
            onClick={() => handleNavClick('/items')}
            role="menuitem"
            aria-label="View items"
          >
            Items
          </button>
          <button
            className={`menu-item ${isActive('/pois') ? 'active' : ''}`}
            onClick={() => handleNavClick('/pois')}
            role="menuitem"
            aria-label="View POIs"
          >
            POIs
          </button>
          <div className="menu-divider"></div>
          <button
            className="menu-item"
            onClick={handleLogout}
            role="menuitem"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
