import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import './LoginPromptModal.css';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    const header = document.querySelector('.app-header') as HTMLElement | null;
    if (header) header.classList.add('modal-open');

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      window.scrollTo(0, scrollY);
      if (header) header.classList.remove('modal-open');
    };
  }, [isOpen]);

  const handleGoToLogin = () => {
    onClose();
    navigate('/auth');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
    >
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="login-prompt-title" className="modal-title">{t('components.loginPrompt.title')}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label={t('common.closeModal')}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="login-prompt-description">
            {t('components.loginPrompt.description')}
          </p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleGoToLogin}
            className="btn btn-primary"
            aria-label={t('common.goToLogin')}
          >
            {t('components.loginPrompt.goToLogin')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default LoginPromptModal;
