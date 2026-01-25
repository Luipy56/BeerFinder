import React, { useEffect, useRef, useState } from 'react';
import { POI, Item } from '../types/poi';
import './ViewPOIModal.css';
import { formatPrice } from '../utils/format';
import POIService from '../services/poiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

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
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [poiItems, setPoiItems] = useState<POIItem[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [localPrice, setLocalPrice] = useState<string>('');

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
    if (isOpen && poi) {
      loadPOIItems();
      loadAvailableItems();
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

  const loadPOIItems = async () => {
    if (!poi) return;
    try {
      const items = await POIService.getPOIItems(poi.id);
      setPoiItems(items);
    } catch (error) {
      console.error('Error loading POI items:', error);
    }
  };

  const loadAvailableItems = async () => {
    if (!poi) return;
    try {
      const items = await POIService.getAvailableItems(poi.id);
      setAvailableItems(items);
    } catch (error) {
      console.error('Error loading available items:', error);
    }
  };

  const handleAssignItem = async () => {
    if (!poi || !selectedItemId) return;
    setLoading(true);
    try {
      const price = localPrice ? parseFloat(localPrice) : undefined;
      await POIService.assignItem(poi.id, selectedItemId, price);
      showSuccess('Item assigned successfully!');
      setShowAssignForm(false);
      setSelectedItemId(null);
      setLocalPrice('');
      await loadPOIItems();
      await loadAvailableItems();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to assign item');
    } finally {
      setLoading(false);
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
    return '/placeholder-item.png'; // Placeholder image
  };

  const isOwner = user && poi.created_by === user.id;
  const isAdmin = user?.is_admin;
  const canEditPOI = canEdit && (isAdmin || isOwner);
  const canDeletePOI = canDelete && (isAdmin || isOwner);

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
            <div className="poi-detail-item">
              <div className="poi-items-header">
                <h3 className="poi-detail-label">Items</h3>
                {user && (
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(!showAssignForm)}
                    className="btn btn-sm btn-primary"
                  >
                    {showAssignForm ? 'Cancel' : 'Assign Item'}
                  </button>
                )}
              </div>
              {showAssignForm && availableItems.length > 0 && (
                <div className="assign-item-form">
                  <select
                    value={selectedItemId || ''}
                    onChange={(e) => setSelectedItemId(Number(e.target.value))}
                    className="form-input"
                  >
                    <option value="">Select an item...</option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.typical_price ? `($${formatPrice(item.typical_price)})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Local price (optional)"
                    value={localPrice}
                    onChange={(e) => setLocalPrice(e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={handleAssignItem}
                    disabled={!selectedItemId || loading}
                    className="btn btn-sm btn-primary"
                  >
                    {loading ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              )}
              {showAssignForm && availableItems.length === 0 && (
                <p className="poi-detail-value">No items available to assign</p>
              )}
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
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E%3F%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                        <div className="poi-item-info">
                          <span className="poi-item-name">{poiItem.item.name}</span>
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
                    <li className="poi-item-empty">No items assigned</li>
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
              aria-label="Edit POI"
            >
              Edit
            </button>
          )}
          {canDeletePOI && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="btn btn-danger"
              aria-label="Disable POI"
            >
              Disable
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewPOIModal;
