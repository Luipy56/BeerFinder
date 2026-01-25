import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './CreatePOIModal.css';

interface CreatePOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, thumbnail?: string) => void;
  latitude: number;
  longitude: number;
}

const CreatePOIModal: React.FC<CreatePOIModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  latitude,
  longitude,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setThumbnail(undefined);
      setThumbnailFile(null);
      setIsSubmitting(false);
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
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(name, description, thumbnail);
        onClose();
      } catch (error) {
        setIsSubmitting(false);
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-poi-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="create-poi-title" className="modal-title">Create New Point of Interest</h2>
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
            <div className="form-group">
              <label htmlFor="name" className="form-label required">
                Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                id="name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter POI name"
                disabled={isSubmitting}
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="poi-thumbnail" className="form-label">
                Thumbnail (optional)
              </label>
              <input
                type="file"
                id="poi-thumbnail"
                accept="image/*"
                onChange={handleThumbnailChange}
                disabled={isSubmitting}
                className="form-input"
              />
              {thumbnailFile && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={URL.createObjectURL(thumbnailFile)}
                    alt="Thumbnail preview"
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
            <div className="form-group">
              <span className="form-help">
                Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="submit"
              className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create POI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreatePOIModal;
