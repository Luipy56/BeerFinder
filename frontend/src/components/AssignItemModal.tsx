import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Item } from '../types/poi';
import POIService from '../services/poiService';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../utils/format';
import { DEFAULT_BEER_LOGO_PATH } from '../utils/constants';
import './AssignItemModal.css';

interface AssignItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  poiId: number;
  onItemAssigned: () => void;
}

const AssignItemModal: React.FC<AssignItemModalProps> = ({
  isOpen,
  onClose,
  poiId,
  onItemAssigned,
}) => {
  const { showSuccess, showError } = useToast();
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [localPrice, setLocalPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailableItems();
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } else {
      // Reset state when modal closes
      setSearchQuery('');
      setSelectedItem(null);
      setLocalPrice('');
      setPriceError(null);
    }
  }, [isOpen, poiId]);

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

  const loadAvailableItems = async () => {
    try {
      setLoading(true);
      if (!poiId) {
        console.error('loadAvailableItems called with invalid poiId:', poiId);
        showError('Invalid POI ID');
        return;
      }
      const items = await POIService.getAvailableItems(poiId);
      setAvailableItems(items);
    } catch (error: any) {
      console.error('Error loading available items:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Failed to load available items';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter items by search query (case-insensitive) - searches name, brand, flavor_type, volumen
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableItems;
    }
    const query = searchQuery.toLowerCase();
    return availableItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const brandMatch = item.brand ? item.brand.toLowerCase().includes(query) : false;
      const flavorMatch = item.flavor_type
        ? item.flavor_type.toLowerCase().includes(query) ||
          item.flavor_type.replace('-', ' ').toLowerCase().includes(query)
        : false;
      const volumenMatch = item.volumen ? item.volumen.toLowerCase().includes(query) : false;
      return nameMatch || brandMatch || flavorMatch || volumenMatch;
    });
  }, [availableItems, searchQuery]);

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setLocalPrice('');
    setPriceError(null);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalPrice(value);
    setPriceError(null);
  };

  const handleAssign = async () => {
    if (!selectedItem) return;

    // Validate price
    if (!localPrice.trim()) {
      setPriceError('Local price is required');
      return;
    }

    const price = parseFloat(localPrice);
    if (isNaN(price) || price <= 0) {
      setPriceError('Please enter a valid price greater than 0');
      return;
    }

    setIsSubmitting(true);
    setPriceError(null);

    try {
      await POIService.assignItem(poiId, selectedItem.id, price);
      showSuccess('Item assigned successfully!');
      await loadAvailableItems();
      setSelectedItem(null);
      setLocalPrice('');
      onItemAssigned();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to assign item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getThumbnailUrl = (thumbnail: string | null | undefined): string => {
    if (thumbnail) {
      return `data:image/png;base64,${thumbnail}`;
    }
    return DEFAULT_BEER_LOGO_PATH;
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay assign-item-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-item-title"
    >
      <div className="modal modal-large assign-item-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="assign-item-title" className="modal-title">Assign Item to POI</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="modal-body assign-item-modal-body">
          {/* Search Bar */}
          <div className="assign-item-search">
            <input
              ref={searchInputRef}
              type="text"
              className="assign-item-search-input"
              placeholder="Search items by name, brand, flavor, or volumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="assign-item-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Selected Item Price Form */}
          {selectedItem && (
            <div className="assign-item-price-form">
              <div className="assign-item-price-form-header">
                <h3>Set Local Price for {selectedItem.name}</h3>
                <button
                  type="button"
                  className="assign-item-price-form-close"
                  onClick={() => {
                    setSelectedItem(null);
                    setLocalPrice('');
                    setPriceError(null);
                  }}
                  aria-label="Cancel"
                >
                  ×
                </button>
              </div>
              <div className="assign-item-price-form-body">
                <div className="form-group">
                  <label htmlFor="local-price" className="form-label required">
                    Local Price
                  </label>
                  <div className="assign-item-price-input-wrapper">
                    <span className="assign-item-price-currency">$</span>
                    <input
                      id="local-price"
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-input assign-item-price-input ${priceError ? 'error' : ''}`}
                      placeholder="0.00"
                      value={localPrice}
                      onChange={handlePriceChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  {priceError && (
                    <span className="form-error-message" role="alert">
                      {priceError}
                    </span>
                  )}
                  {selectedItem.typical_price && (
                    <span className="assign-item-typical-price">
                      Typical price: ${formatPrice(selectedItem.typical_price)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary assign-item-confirm-btn"
                  onClick={handleAssign}
                  disabled={isSubmitting || !localPrice.trim()}
                >
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="assign-item-list-container">
            {loading ? (
              <div className="assign-item-loading">
                <div className="loading-spinner"></div>
                <p>Loading items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="assign-item-empty">
                <p>
                  {searchQuery
                    ? `No items found matching "${searchQuery}"`
                    : 'No items available to assign'}
                </p>
              </div>
            ) : (
              <div className="assign-item-grid">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`assign-item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                    onClick={() => handleItemSelect(item)}
                  >
                    <div className="assign-item-card-thumbnail">
                      <img
                        src={getThumbnailUrl(item.thumbnail)}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_BEER_LOGO_PATH;
                        }}
                      />
                    </div>
                    <div className="assign-item-card-content">
                      <h3 className="assign-item-card-name">{item.name}</h3>
                      {item.brand && (
                        <div className="assign-item-card-brand">
                          <span className="assign-item-card-brand-label">Brand:</span>
                          <span className="assign-item-card-brand-value">{item.brand}</span>
                        </div>
                      )}
                      {(item.flavor_type || item.volumen) && (
                        <div className="assign-item-card-flavor">
                          <span className="assign-item-card-flavor-label">Flavor{item.volumen ? ' · Volumen' : ''}:</span>
                          <span className="assign-item-card-flavor-value">
                            {[
                              item.flavor_type && item.flavor_type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-'),
                              item.volumen,
                            ].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}
                      {item.description && (
                        <p className="assign-item-card-description">{item.description}</p>
                      )}
                      {item.typical_price !== undefined && item.typical_price !== null && (
                        <div className="assign-item-card-price">
                          ${formatPrice(item.typical_price)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignItemModal;
