import React, { useEffect, useRef } from 'react';
import { Item } from '../types/poi';
import './ViewPOIModal.css';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/format';
import { DEFAULT_BEER_LOGO_PATH } from '../utils/constants';

interface ViewItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onEdit?: () => void;
}

const ViewItemDetailsModal: React.FC<ViewItemDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
}) => {
  const { user } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Disable body scroll when modal is open
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
      
      return () => {
        // Restore scroll when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  const getThumbnailUrl = (thumbnail: string | null | undefined): string => {
    if (thumbnail) {
      return `data:image/png;base64,${thumbnail}`;
    }
    return DEFAULT_BEER_LOGO_PATH;
  };

  const formatFlavor = (flavor?: string): string => {
    if (!flavor) return '';
    return flavor.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
  };

  const isAdmin = user?.is_admin;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-item-title"
    >
      <div className="modal modal-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="view-item-title" className="modal-title">{item.name}</h2>
          <div className="modal-header-actions">
            {isAdmin && onEdit && (
              <button
                className="modal-edit-button"
                onClick={onEdit}
                aria-label="Edit item"
                type="button"
                title="Edit item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  <path d="M15 5l4 4"></path>
                </svg>
              </button>
            )}
            <button
              ref={closeButtonRef}
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
        <div className="modal-body">
          {item.thumbnail && (
            <div className="poi-thumbnail-container">
              <img
                src={getThumbnailUrl(item.thumbnail)}
                alt={item.name}
                className="poi-thumbnail"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_BEER_LOGO_PATH;
                }}
              />
            </div>
          )}
          <div className="poi-details">
            {item.description && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">Description</h3>
                <p className="poi-detail-value">{item.description}</p>
              </div>
            )}
            {item.brand && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">Brand</h3>
                <p className="poi-detail-value">{item.brand}</p>
              </div>
            )}
            {item.flavor_type && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">Flavor Type</h3>
                <p className="poi-detail-value">{formatFlavor(item.flavor_type)}</p>
              </div>
            )}
            {item.typical_price !== null && item.typical_price !== undefined && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">Typical Price</h3>
                <p className="poi-detail-value">{formatPrice(item.typical_price)}</p>
              </div>
            )}
            {item.percentage !== null && item.percentage !== undefined && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">Percentage</h3>
                <p className="poi-detail-value">{item.percentage}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewItemDetailsModal;
