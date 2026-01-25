import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import './Header.css';

const Header: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand" onClick={() => navigate('/')}>
          <h1 className="header-title">BeerFinder</h1>
        </div>
        <nav className="header-nav">
          {isAuthenticated && (
            <>
              <button
                className={`header-nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={() => navigate('/')}
              >
                Map
              </button>
              <button
                className={`header-nav-link ${isActive('/profile') ? 'active' : ''}`}
                onClick={() => navigate('/profile')}
              >
                Profile
              </button>
              <button
                className={`header-nav-link ${isActive('/item-requests') ? 'active' : ''}`}
                onClick={() => navigate('/item-requests')}
              >
                My Item Requests
              </button>
              {user?.is_admin && (
                <button
                  className={`header-nav-link ${isActive('/item-requests/all') ? 'active' : ''}`}
                  onClick={() => navigate('/item-requests/all')}
                >
                  All Item Requests
                </button>
              )}
              <button
                className={`header-nav-link ${isActive('/items') ? 'active' : ''}`}
                onClick={() => navigate('/items')}
              >
                Items
              </button>
              <button
                className={`header-nav-link ${isActive('/pois') ? 'active' : ''}`}
                onClick={() => navigate('/pois')}
              >
                POIs
              </button>
            </>
          )}
        </nav>
        <div className="header-actions">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
