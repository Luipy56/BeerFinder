import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { POI } from '../types/poi';
import './DeletePOIModal.css';

interface DeletePOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  poi: POI | null;
  onConfirm: () => Promise<void>;
}

const DeletePOIModal: React.FC<DeletePOIModalProps> = ({
  isOpen,
  onClose,
  poi,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
      setError(null);
    }
  }, [isOpen]);

  // Disable body scroll and reduce header z-index when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      // Disable scroll and compensate for scrollbar width
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Reduce header z-index so overlay can cover it
      const header = document.querySelector('.app-header') as HTMLElement;
      if (header) {
        header.classList.add('modal-open');
      }
      
      return () => {
        // Restore scroll when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollY);
        
        // Restore header z-index
        if (header) {
          header.classList.remove('modal-open');
        }
      };
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (isDeleting || !poi) return;

    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete POI. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  if (!isOpen || !poi) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-poi-title"
    >
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="delete-poi-title" className="modal-title">Disable Point of Interest</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
            disabled={isDeleting}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="form-error-message" role="alert" aria-live="polite">
              {error}
            </div>
          )}
          <p className="delete-confirmation-text">
            Are you sure you want to disable <strong>"{poi.name}"</strong>? This will hide it from the map.
          </p>
        </div>
        <div className="modal-footer">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`btn btn-danger ${isDeleting ? 'btn-loading' : ''}`}
            disabled={isDeleting}
            aria-label="Confirm disable POI"
          >
            {isDeleting ? 'Disabling...' : 'Disable'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeletePOIModal;
