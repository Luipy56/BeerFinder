import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import './Header.css';

const Header: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand" onClick={() => navigate('/')}>
          <h1 className="header-title">BeerFinder</h1>
        </div>
        <button
          className="header-mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <nav className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`} ref={menuRef}>
          <div className="mobile-menu-header">
            <h2 className="mobile-menu-title">Menu</h2>
            <button
              className="mobile-menu-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="mobile-menu-content">
            {isAuthenticated && (
              <>
                <button
                  className={`header-nav-link ${isActive('/') ? 'active' : ''}`}
                  onClick={() => handleNavClick('/')}
                >
                  <span className="nav-link-icon">🗺️</span>
                  <span>Map</span>
                </button>
                <button
                  className={`header-nav-link ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => handleNavClick('/profile')}
                >
                  <span className="nav-link-icon">👤</span>
                  <span>Profile</span>
                </button>
                <button
                  className={`header-nav-link ${isActive('/item-requests') ? 'active' : ''}`}
                  onClick={() => handleNavClick('/item-requests')}
                >
                  <span className="nav-link-icon">📋</span>
                  <span>My Item Requests</span>
                </button>
                {user?.is_admin && (
                  <button
                    className={`header-nav-link ${isActive('/item-requests/all') ? 'active' : ''}`}
                    onClick={() => handleNavClick('/item-requests/all')}
                  >
                    <span className="nav-link-icon">📊</span>
                    <span>All Item Requests</span>
                  </button>
                )}
                <button
                  className={`header-nav-link ${isActive('/items') ? 'active' : ''}`}
                  onClick={() => handleNavClick('/items')}
                >
                  <span className="nav-link-icon">🍺</span>
                  <span>Items</span>
                </button>
                <button
                  className={`header-nav-link ${isActive('/pois') ? 'active' : ''}`}
                  onClick={() => handleNavClick('/pois')}
                >
                  <span className="nav-link-icon">📍</span>
                  <span>POIs</span>
                </button>
              </>
            )}
          </div>
        </nav>
        <div className="header-actions">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
