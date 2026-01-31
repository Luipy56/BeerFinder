import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { POI, Item } from '../types/poi';
import './ViewPOIModal.css';
import { formatPrice } from '../utils/format';
import { getFlavorLabel } from '../utils/formatFlavor';
import POIService from '../services/poiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { DEFAULT_BEER_LOGO_PATH } from '../utils/constants';
import AssignItemModal from './AssignItemModal';

interface POIItem {
  id: number;
  item: Item;
  local_price?: number | null;
  relationship_created_by_username?: string;
  created_at: string;
}

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [poiItems, setPoiItems] = useState<POIItem[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
    if (isOpen && poi) {
      loadPOIItems();
    }
  }, [isOpen, poi]);

  // Close leaflet popup when modal closes
  useEffect(() => {
    if (!isOpen) {
      const popup = document.querySelector('.leaflet-popup-content-wrapper');
      if (popup) {
        const closeButton = popup.closest('.leaflet-popup')?.querySelector('.leaflet-popup-close-button') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
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

  const loadPOIItems = async () => {
    if (!poi || !poi.id) {
      console.error('loadPOIItems called with invalid POI:', poi);
      return;
    }
    try {
      const items = await POIService.getPOIItems(poi.id);
      setPoiItems(items);
    } catch (error: any) {
      console.error('Error loading POI items:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Failed to load POI items';
      showError(errorMessage);
    }
  };

  const handleItemAssigned = async () => {
    await loadPOIItems();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !poi) return null;

  const getThumbnailUrl = (thumbnail: string | null | undefined): string => {
    if (thumbnail) {
      return `data:image/png;base64,${thumbnail}`;
    }
    return DEFAULT_BEER_LOGO_PATH;
  };

  const isOwner = user && poi.created_by === user.id;
  const isAdmin = user?.is_admin;
  const canEditPOI = canEdit && (isAdmin || isOwner);
  const canDeletePOI = canDelete && (isAdmin || isOwner);

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-poi-title"
    >
      <div className="modal modal-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="view-poi-title" className="modal-title">{poi.name}</h2>
          <button
            ref={closeButtonRef}
            className="modal-close"
            onClick={onClose}
            aria-label={t('common.closeModal')}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {poi.thumbnail && (
            <div className="poi-thumbnail-container">
              <img
                src={`data:image/png;base64,${poi.thumbnail}`}
                alt={poi.name}
                className="poi-thumbnail"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="poi-details">
            {poi.description && (
              <div className="poi-detail-item">
                <h3 className="poi-detail-label">{t('components.viewItemDetailsModal.description')}</h3>
                <p className="poi-detail-value">{poi.description}</p>
              </div>
            )}
            <div className="poi-detail-item">
              <div className="poi-items-header">
                <h3 className="poi-detail-label">{t('components.viewPOIModal.items')}</h3>
                {user && (
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="btn btn-sm btn-primary"
                  >
                    {t('components.assignItemModal.assignItem')}
                  </button>
                )}
              </div>
              <div className="poi-items-container">
                <ul className="poi-items-list">
                  {poiItems.length > 0 ? (
                    poiItems.map((poiItem) => (
                      <li key={poiItem.id} className="poi-item">
                        <div className="poi-item-thumbnail">
                          <img
                            src={getThumbnailUrl(poiItem.item.thumbnail)}
                            alt={poiItem.item.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_BEER_LOGO_PATH;
                            }}
                          />
                        </div>
                        <div className="poi-item-info">
                          <span className="poi-item-name">{poiItem.item.name}</span>
                          {(poiItem.item.flavor_type || poiItem.item.volumen) && (
                            <span className="poi-item-flavor">
                              {[
                                poiItem.item.flavor_type && getFlavorLabel(poiItem.item.flavor_type, t),
                                poiItem.item.volumen,
                              ].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {poiItem.relationship_created_by_username && (
                            <span className="poi-item-assigned-by">
                              by {poiItem.relationship_created_by_username}
                            </span>
                          )}
                        </div>
                        <span className="poi-item-price">
                          ${formatPrice(poiItem.local_price || poiItem.item.typical_price || 0)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="poi-item-empty">{t('components.viewPOIModal.noItemsAssigned')}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {canEditPOI && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-secondary"
              aria-label={t('components.viewPOIModal.edit')}
            >
              {t('components.viewPOIModal.edit')}
            </button>
          )}
          {canDeletePOI && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="btn btn-danger"
              aria-label={t('components.viewPOIModal.delete')}
            >
              {t('components.viewPOIModal.delete')}
            </button>
          )}
        </div>
      </div>
      {poi && (
        <AssignItemModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          poiId={poi.id}
          onItemAssigned={handleItemAssigned}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ViewPOIModal;
