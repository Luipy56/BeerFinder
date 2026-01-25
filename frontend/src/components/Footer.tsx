import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p className="footer-text">
          © {currentYear} <span className="footer-nickname">ldeluipy</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
