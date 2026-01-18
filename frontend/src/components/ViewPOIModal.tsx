import React, { useEffect, useRef } from 'react';
import { POI } from '../types/poi';
import './ViewPOIModal.css';
import { formatPrice } from '../utils/format';

interface ViewPOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  poi: POI | null;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ViewPOIModal: React.FC<ViewPOIModalProps> = ({
  isOpen,
  onClose,
  poi,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !poi) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-poi-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="view-poi-title" className="modal-title">{poi.name}</h2>
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
        <div className="modal-body">
          <div className="poi-details">
            {poi.description && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">Description</h3>
                <p className="poi-detail-value">{poi.description}</p>
              </div>
            )}
            {poi.price !== undefined && poi.price !== null && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">Price</h3>
                <p className="poi-detail-value">${formatPrice(poi.price)}</p>
              </div>
            )}
            <div className="poi-detail-item">
              <h3 className="poi-detail-label">Location</h3>
              <p className="poi-detail-value">
                {poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}
              </p>
            </div>
            {poi.items && poi.items.length > 0 && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">Items</h3>
                <ul className="poi-items-list">
                  {poi.items.map((item) => (
                    <li key={item.id} className="poi-item">
                      <span className="poi-item-name">{item.name}</span>
                      {item.price !== undefined && item.price !== null && (
                        <span className="poi-item-price">${formatPrice(item.price)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="poi-detail-item">
              <h3 className="poi-detail-label">Created</h3>
              <p className="poi-detail-value">{formatDate(poi.created_at)}</p>
            </div>
            {poi.updated_at !== poi.created_at && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">Last Updated</h3>
                <p className="poi-detail-value">{formatDate(poi.updated_at)}</p>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          {(canEdit && onEdit) && (
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-secondary"
              aria-label="Edit POI"
            >
              Edit
            </button>
          )}
          {(canDelete && onDelete) && (
            <button
              type="button"
              onClick={onDelete}
              className="btn btn-danger"
              aria-label="Delete POI"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPOIModal;
