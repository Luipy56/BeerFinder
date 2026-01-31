import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p className="footer-text">
          © {currentYear} <span className="footer-nickname">ldeluipy</span>. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
