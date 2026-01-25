import React, { useState, useEffect, useRef } from 'react';
import { Item, FlavorType } from '../types/poi';
import ItemService from '../services/itemService';
import { useToast } from '../contexts/ToastContext';
import { DEFAULT_BEER_LOGO_PATH } from '../utils/constants';
import './EditItemModal.css';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onItemUpdated: () => void;
}

const FLAVOR_OPTIONS: FlavorType[] = [
  'bitter', 'caramel', 'chocolatey', 'coffee-like', 'creamy', 'crisp', 'dry',
  'earthy', 'floral', 'fruity', 'full-bodied', 'funky', 'herbal', 'honeyed',
  'hoppy', 'light-bodied', 'malty', 'nutty', 'refreshing', 'roasty', 'session',
  'smoky', 'smooth', 'sour', 'spicy', 'strong', 'sweet', 'tart', 'toasted',
  'woody', 'other'
];

const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onItemUpdated,
}) => {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [typicalPrice, setTypicalPrice] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');
  const [flavorType, setFlavorType] = useState<FlavorType>('other');
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setDescription(item.description || '');
      setTypicalPrice(item.typical_price?.toString() || '');
      setPercentage(item.percentage?.toString() || '');
      setFlavorType(item.flavor_type || 'other');
      setThumbnail(undefined);
      setThumbnailFile(null);
      setError(null);
    }
  }, [item]);

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

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
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
    if (!name.trim() || isSubmitting || !item) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const updateData: any = {
        name: name.trim(),
        description: description.trim(),
        flavor_type: flavorType,
      };

      if (typicalPrice.trim()) {
        const price = parseFloat(typicalPrice);
        if (isNaN(price) || price < 0) {
          setError('Typical price must be a valid number >= 0');
          setIsSubmitting(false);
          return;
        }
        updateData.typical_price = price;
      } else {
        updateData.typical_price = null;
      }

      if (percentage.trim()) {
        const perc = parseFloat(percentage);
        if (isNaN(perc) || perc < 0 || perc > 100) {
          setError('Percentage must be a valid number between 0 and 100');
          setIsSubmitting(false);
          return;
        }
        updateData.percentage = perc;
      } else {
        updateData.percentage = null;
      }

      if (thumbnail !== undefined) {
        updateData.thumbnail_write = thumbnail;
      }

      await ItemService.updateItem(item.id, updateData);
      showSuccess('Item updated successfully!');
      onItemUpdated();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to update item. Please try again.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-item-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="edit-item-title" className="modal-title">Edit Item</h2>
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
              <label htmlFor="edit-item-name" className="form-label required">
                Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                id="edit-item-name"
                className={`form-input ${error ? 'error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter item name"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-item-description" className="form-label">
                Description
              </label>
              <textarea
                id="edit-item-description"
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-item-flavor" className="form-label">
                Flavor Type
              </label>
              <select
                id="edit-item-flavor"
                className="form-input"
                value={flavorType}
                onChange={(e) => setFlavorType(e.target.value as FlavorType)}
                disabled={isSubmitting}
              >
                {FLAVOR_OPTIONS.map((flavor) => (
                  <option key={flavor} value={flavor}>
                    {flavor.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-')}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-item-price" className="form-label">
                Typical Price
              </label>
              <div className="item-request-price-input-wrapper">
                <span className="item-request-price-currency">$</span>
                <input
                  type="number"
                  id="edit-item-price"
                  className="item-request-price-input"
                  value={typicalPrice}
                  onChange={(e) => setTypicalPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="edit-item-percentage" className="form-label">
                Percentage
              </label>
              <div className="item-request-price-input-wrapper">
                <input
                  type="number"
                  id="edit-item-percentage"
                  className="item-request-price-input"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  max="100"
                  disabled={isSubmitting}
                />
                <span className="item-request-price-currency">%</span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="edit-item-thumbnail" className="form-label">
                Thumbnail (optional)
              </label>
              <input
                type="file"
                id="edit-item-thumbnail"
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
              ) : item?.thumbnail ? (
                <div style={{ marginTop: '8px' }}>
                  <span className="form-help">Current thumbnail:</span>
                  <img
                    src={`data:image/png;base64,${item.thumbnail}`}
                    alt="Current thumbnail"
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', marginTop: '4px', display: 'block' }}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div className="modal-footer">
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
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;
