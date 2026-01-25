import React, { useState, useEffect, useRef } from 'react';
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

  return (
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
};

export default DeletePOIModal;
