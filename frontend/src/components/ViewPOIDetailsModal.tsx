import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { POI, Item } from '../types/poi';
import './ViewPOIModal.css';
import { formatPrice } from '../utils/format';
import { getFlavorLabel } from '../utils/formatFlavor';
import POIService from '../services/poiService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_BEER_LOGO_PATH } from '../utils/constants';

interface POIItem {
  id: number;
  item: Item;
  local_price?: number | null;
  relationship_created_by_username?: string;
  created_at: string;
}

interface ViewPOIDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  poi: POI | null;
  onEdit?: () => void;
}

const ViewPOIDetailsModal: React.FC<ViewPOIDetailsModalProps> = ({
  isOpen,
  onClose,
  poi,
  onEdit,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showError } = useToast();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [poiItems, setPoiItems] = useState<POIItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
    if (isOpen && poi) {
      loadPOIItems();
    }
  }, [isOpen, poi]);

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

  const loadPOIItems = async () => {
    if (!poi || !poi.id) {
      console.error('loadPOIItems called with invalid POI:', poi);
      return;
    }

    try {
      setLoadingItems(true);
      const items = await POIService.getPOIItems(poi.id);
      setPoiItems(items);
    } catch (error: any) {
      console.error('Error loading POI items:', error);
      showError(t('pages.items.failedToLoad'));
    } finally {
      setLoadingItems(false);
    }
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

  return (
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
          <div className="modal-header-actions">
            {user?.is_admin && onEdit && (
              <button
                className="modal-edit-button"
                onClick={onEdit}
                aria-label="Edit POI"
                type="button"
                title="Edit POI"
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
              aria-label={t('common.closeModal')}
              type="button"
            >
              ×
            </button>
          </div>
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
                <h3 className="poi-detail-label">Description</h3>
                <p className="poi-detail-value">{poi.description}</p>
              </div>
            )}
            <div className="poi-detail-item">
              <h3 className="poi-detail-label">Items</h3>
              <div className="poi-items-container">
                {loadingItems ? (
                  <div className="poi-item-empty">Loading items...</div>
                ) : poiItems.length > 0 ? (
                  <ul className="poi-items-list">
                    {poiItems.map((poiItem) => (
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
                          <div className="poi-item-name">{poiItem.item.name}</div>
                          {(poiItem.item.flavor_type || poiItem.item.volumen) && (
                            <div className="poi-item-flavor">
                              {[
                                poiItem.item.flavor_type && poiItem.item.flavor_type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-'),
                                poiItem.item.volumen,
                              ].filter(Boolean).join(' · ')}
                            </div>
                          )}
                          {poiItem.item.description && (
                            <div className="poi-item-description">{poiItem.item.description}</div>
                          )}
                        </div>
                        {poiItem.local_price && (
                          <div className="poi-item-price">
                            {formatPrice(poiItem.local_price)}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="poi-item-empty">{t('components.viewPOIDetailsModal.noItemsAssigned')}</div>
                )}
              </div>
            </div>
            <div className="poi-detail-item">
              <h3 className="poi-detail-label">{t('components.viewPOIDetailsModal.location')}</h3>
              <p className="poi-detail-value">
                {poi.latitude?.toFixed(6)}, {poi.longitude?.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPOIDetailsModal;
