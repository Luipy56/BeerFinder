import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { POI } from '../types/poi';
import './EditPOIModal.css';

interface EditPOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  poi: POI | null;
  onSubmit: (name: string, description: string, thumbnail?: string) => Promise<void>;
  /** When provided, the Delete button closes this modal and asks the parent to open the delete confirmation modal */
  onRequestDelete?: () => void;
}

const EditPOIModal: React.FC<EditPOIModalProps> = ({
  isOpen,
  onClose,
  poi,
  onSubmit,
  onRequestDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (poi) {
      setName(poi.name);
      setDescription(poi.description || '');
      setThumbnail(undefined);
      setThumbnailFile(null);
      setError(null);
    }
  }, [poi]);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsSubmitting(false);
      setThumbnail(undefined);
      setThumbnailFile(null);
    }
  }, [isOpen]);

  const handleRequestDelete = () => {
    if (!poi || isSubmitting) return;
    onRequestDelete?.();
    /* Do not call onClose() here: parent will close this modal and open the delete confirmation modal; calling onClose() would clear selectedPOI and the confirmation modal would receive poi=null */
  };

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

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64Data = base64String.split(',')[1];
        setThumbnail(base64Data);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnail(undefined);
      setThumbnailFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting || !poi) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(name, description, thumbnail);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update POI. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
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
      aria-labelledby="edit-poi-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="edit-poi-title" className="modal-title">Edit Point of Interest</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="form-error-message" role="alert" aria-live="polite">
                {error}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="edit-name" className="form-label required">
                Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                id="edit-name"
                className={`form-input ${error ? 'error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter POI name"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-description" className="form-label">
                Description
              </label>
              <textarea
                id="edit-description"
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-poi-thumbnail" className="form-label">
                Thumbnail
              </label>
              <input
                type="file"
                id="edit-poi-thumbnail"
                accept="image/*"
                onChange={handleThumbnailChange}
                disabled={isSubmitting}
                className="form-input"
              />
              {thumbnailFile ? (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={URL.createObjectURL(thumbnailFile)}
                    alt="Thumbnail preview"
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              ) : poi?.thumbnail ? (
                <div style={{ marginTop: '8px' }}>
                  <span className="form-help">Current thumbnail:</span>
                  <img
                    src={`data:image/png;base64,${poi.thumbnail}`}
                    alt="Current thumbnail"
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', marginTop: '4px', display: 'block' }}
                  />
                </div>
              ) : null}
            </div>
            <div className="form-group">
              <span className="form-help">
                Location: {poi.latitude != null ? poi.latitude.toFixed(6) : 'N/A'}, {poi.longitude != null ? poi.longitude.toFixed(6) : 'N/A'}
              </span>
            </div>
          </div>
          <div className="modal-footer">
            {onRequestDelete && (
              <button
                type="button"
                onClick={handleRequestDelete}
                className="btn btn-danger"
                disabled={isSubmitting}
                aria-label="Delete POI"
              >
                Delete
              </button>
            )}
            <div className="modal-footer-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`}
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditPOIModal;
