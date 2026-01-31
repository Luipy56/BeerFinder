import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Item } from '../types/poi';
import './DeleteItemModal.css';

interface DeleteItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onConfirm: () => Promise<void>;
}

const DeleteItemModal: React.FC<DeleteItemModalProps> = ({
  isOpen,
  onClose,
  item,
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

  const handleConfirm = async () => {
    if (isDeleting || !item) return;

    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to delete item. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-item-title"
    >
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="delete-item-title" className="modal-title">Delete Item</h2>
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
            Are you sure you want to delete <strong>"{item.name}"</strong>? This action cannot be undone.
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
            aria-label="Confirm delete item"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteItemModal;
