import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ItemRequestService, { ItemRequest, CreateItemRequestDto } from '../services/itemRequestService';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ItemRequestPage.css';
import { formatPrice } from '../utils/format';
import { getFlavorLabel } from '../utils/formatFlavor';
import { FlavorType } from '../types/poi';

const FLAVOR_OPTIONS: FlavorType[] = [
  'bitter', 'caramel', 'chocolatey', 'coffee-like', 'creamy', 'crisp', 'dry',
  'earthy', 'floral', 'fruity', 'full-bodied', 'funky', 'herbal', 'honeyed',
  'hoppy', 'light-bodied', 'malty', 'nutty', 'refreshing', 'roasty', 'session',
  'smoky', 'smooth', 'sour', 'spicy', 'strong', 'sweet', 'tart', 'toasted',
  'woody', 'other'
];

const ItemRequestPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [itemRequests, setItemRequests] = useState<ItemRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ItemRequest | null>(null);
  const [formData, setFormData] = useState<CreateItemRequestDto>({
    name: '',
    description: '',
    brand: '',
    price: undefined,
    percentage: null,
    thumbnail: undefined,
    flavor_type: 'other',
    volumen: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      loadItemRequests();
    }
  }, [isAuthenticated]);

  const loadItemRequests = async () => {
    try {
      setIsLoading(true);
      const data = await ItemRequestService.getAllItemRequests();
      setItemRequests(data);
    } catch (error: any) {
      console.error('Error loading item requests:', error);
      showError(error.response?.data?.detail || 'Failed to load item requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' 
        ? (value ? parseFloat(value) : undefined)
        : name === 'percentage'
        ? (value ? parseFloat(value) : null)
        : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

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
        setFormData((prev) => ({ ...prev, thumbnail: base64Data }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isCreating) return;

    setIsCreating(true);
    try {
      const newRequest = await ItemRequestService.createItemRequest(formData);
      setItemRequests([newRequest, ...itemRequests]);
      setFormData({ name: '', description: '', price: undefined, percentage: null, thumbnail: undefined, flavor_type: 'other', volumen: '' });
      setThumbnailFile(null);
      setErrors({});
      setShowCreateForm(false);
      showSuccess('Item request submitted successfully!');
    } catch (error: any) {
      console.error('Error creating item request:', error);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const fieldErrors: Record<string, string> = {};
          Object.entries(errorData).forEach(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              fieldErrors[field] = messages[0];
            } else {
              fieldErrors[field] = messages;
            }
          });
          setErrors(fieldErrors);
        } else {
          showError(errorData || 'Failed to submit item request. Please try again.');
        }
      } else {
        showError('Failed to submit item request. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', price: undefined, percentage: null, thumbnail: undefined, flavor_type: 'other' });
    setThumbnailFile(null);
    setErrors({});
    setShowCreateForm(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-badge status-approved';
      case 'rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge status-pending';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group requests by status
  const groupedRequests = {
    pending: itemRequests.filter((r) => r.status === 'pending'),
    approved: itemRequests.filter((r) => r.status === 'approved'),
    rejected: itemRequests.filter((r) => r.status === 'rejected'),
  };

  const renderRequestSection = (title: string, requests: ItemRequest[], status: 'pending' | 'approved' | 'rejected') => {
    if (requests.length === 0) return null;

    return (
      <div className="item-request-section" key={status}>
        <h2 className="item-request-section-title">{title} ({requests.length})</h2>
        <div className="item-request-list">
          {requests.map((request) => (
            <div
              key={request.id}
              className="item-request-card card"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="item-request-card-header">
                <h3>{request.name}</h3>
                <span className={getStatusBadgeClass(request.status)}>
                  {t(`enums.status.${request.status}`)}
                </span>
              </div>
              {request.description && (
                <p className="item-request-description">{request.description}</p>
              )}
              <div className="item-request-card-footer">
                {request.price !== undefined && request.price !== null && (
                  <span className="item-request-price">${formatPrice(request.price)}</span>
                )}
                <span className="item-request-date">
                  {formatDate(request.created_at)}
                </span>
              </div>
            </div>
            ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="page-layout">
          <Header />
          <div className="item-request-page">
            <div className="item-request-loading">
              <div className="loading-spinner"></div>
              <p>{t('pages.itemRequests.loading')}</p>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="page-layout">
        <Header />
        <div className="item-request-page">
          <div className="item-request-container">
          <div className="item-request-header">
            <div className="item-request-header-left">
              <h1>{t('pages.itemRequests.pageTitle')}</h1>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
              aria-label={showCreateForm ? t('pages.itemRequests.cancelCreateAria') : t('pages.itemRequests.createNewAria')}
            >
              {showCreateForm ? t('common.cancel') : t('pages.itemRequests.newRequest')}
            </button>
          </div>

          {showCreateForm && (
            <div className="item-request-create-form card">
              <h2>{t('pages.itemRequests.createTitle')}</h2>
              <form onSubmit={handleSubmit} aria-label={t('pages.itemRequests.createFormAriaLabel')}>
                <div className="form-group">
                  <label htmlFor="request-name" className="form-label required">
                    {t('components.editItemModal.name')}
                  </label>
                  <input
                    type="text"
                    id="request-name"
                    name="name"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isCreating}
                    aria-required="true"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <span id="name-error" className="form-error" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="request-description" className="form-label">
                    {t('components.editItemModal.description')}
                  </label>
                  <textarea
                    id="request-description"
                    name="description"
                    className="form-textarea"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    disabled={isCreating}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="request-brand" className="form-label">
                    {t('components.editItemModal.brand')}
                  </label>
                  <input
                    type="text"
                    id="request-brand"
                    name="brand"
                    className="form-input"
                    value={formData.brand || ''}
                    onChange={handleChange}
                    disabled={isCreating}
                    placeholder={t('components.editItemModal.placeholderBrand')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="request-price" className="form-label">
                    {t('components.editItemModal.typicalPrice')}
                  </label>
                  <div className="item-request-price-input-wrapper">
                    <span className="item-request-price-currency">$</span>
                    <input
                      type="number"
                      id="request-price"
                      name="price"
                      className="form-input item-request-price-input"
                      value={formData.price || ''}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      disabled={isCreating}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="request-percentage" className="form-label">
                    {t('components.editItemModal.percentage')}
                  </label>
                  <div className="item-request-price-input-wrapper">
                    <input
                      type="number"
                      id="request-percentage"
                      name="percentage"
                      className="form-input item-request-price-input"
                      value={formData.percentage !== null && formData.percentage !== undefined ? formData.percentage : ''}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      max="100"
                      disabled={isCreating}
                      placeholder="0.0"
                    />
                    <span className="item-request-price-currency">%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="request-volumen" className="form-label">
                    {t('components.editItemModal.volumen')}
                  </label>
                  <input
                    type="text"
                    id="request-volumen"
                    name="volumen"
                    className="form-input"
                    value={formData.volumen || ''}
                    onChange={handleChange}
                    disabled={isCreating}
                    placeholder={t('components.editItemModal.placeholderVolumen')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="request-flavor-type" className="form-label">
                    {t('pages.itemRequests.flavorType')}
                  </label>
                  <select
                    id="request-flavor-type"
                    name="flavor_type"
                    className="form-input"
                    value={formData.flavor_type || 'other'}
                    onChange={(e) => setFormData({ ...formData, flavor_type: e.target.value as FlavorType })}
                    disabled={isCreating}
                  >
                    {FLAVOR_OPTIONS.map((flavor) => (
                      <option key={flavor} value={flavor}>
                        {getFlavorLabel(flavor, t)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="request-thumbnail" className="form-label">
                    {t('components.editItemModal.thumbnail')}
                  </label>
                  <input
                    type="file"
                    id="request-thumbnail"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    disabled={isCreating}
                    className="form-input"
                  />
                  {thumbnailFile && (
                    <div className="thumbnail-preview">
                      <img
                        src={URL.createObjectURL(thumbnailFile)}
                        alt={t('common.thumbnailPreview')}
                        style={{ maxWidth: '200px', maxHeight: '200px', marginTop: 'var(--spacing-sm)' }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={isCreating}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`}
                    disabled={isCreating || !formData.name.trim()}
                  >
                    {isCreating ? t('pages.itemRequests.submitting') : t('pages.itemRequests.submitRequest')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {itemRequests.length === 0 && !showCreateForm ? (
            <div className="item-request-empty">
              <h3>{t('pages.itemRequests.noRequests')}</h3>
              <p>{t('pages.itemRequests.emptyMessage')}</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                {t('pages.itemRequests.createFirstRequest')}
              </button>
            </div>
          ) : (
            <div className="item-request-sections">
              {renderRequestSection(t('enums.status.pending'), groupedRequests.pending, 'pending')}
              {renderRequestSection(t('enums.status.approved'), groupedRequests.approved, 'approved')}
              {renderRequestSection(t('enums.status.rejected'), groupedRequests.rejected, 'rejected')}
            </div>
          )}

          {selectedRequest && (
            <div
              className="modal-overlay"
              onClick={() => setSelectedRequest(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="item-request-detail-title"
            >
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 id="item-request-detail-title" className="modal-title">
                    {selectedRequest.name}
                  </h2>
                  <button
                    className="modal-close"
                    onClick={() => setSelectedRequest(null)}
                    aria-label={t('common.closeModal')}
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="item-request-detail">
                      <div className="detail-item">
                        <span className="detail-label">{t('pages.itemRequests.status')}</span>
                        <span className={`${getStatusBadgeClass(selectedRequest.status)} status-badge-inline`}>
                          {t(`enums.status.${selectedRequest.status}`)}
                        </span>
                      </div>
                    {selectedRequest.thumbnail && (
                      <div className="detail-item">
                        <span className="detail-label">{t('pages.itemRequests.image')}</span>
                        <div className="item-request-thumbnail-container">
                          <img
                            src={`data:image/png;base64,${selectedRequest.thumbnail}`}
                            alt={selectedRequest.name}
                            className="item-request-thumbnail"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {selectedRequest.description && (
                      <div className="detail-item">
                        <span className="detail-label">{t('components.editItemModal.description')}</span>
                        <p className="detail-value">{selectedRequest.description}</p>
                      </div>
                    )}
                    {selectedRequest.brand && (
                      <div className="detail-item">
                        <span className="detail-label">{t('components.editItemModal.brand')}</span>
                        <span className="detail-value">{selectedRequest.brand}</span>
                      </div>
                    )}
                    {selectedRequest.flavor_type && (
                      <div className="detail-item">
                        <span className="detail-label">{t('pages.itemRequests.flavorType')}</span>
                        <span className="detail-value">
                          {getFlavorLabel(selectedRequest.flavor_type, t)}
                        </span>
                      </div>
                    )}
                    {selectedRequest.volumen && (
                      <div className="detail-item">
                        <span className="detail-label">{t('components.editItemModal.volumen')}</span>
                        <span className="detail-value">{selectedRequest.volumen}</span>
                      </div>
                    )}
                    {selectedRequest.price !== undefined && selectedRequest.price !== null && (
                      <div className="detail-item">
                        <span className="detail-label">{t('components.editItemModal.typicalPrice')}</span>
                        <span className="detail-value">${formatPrice(selectedRequest.price)}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Created</span>
                      <span className="detail-value">{formatDate(selectedRequest.created_at)}</span>
                    </div>
                    {selectedRequest.updated_at !== selectedRequest.created_at && (
                      <div className="detail-item">
                        <span className="detail-label">Last Updated</span>
                        <span className="detail-value">{formatDate(selectedRequest.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="btn btn-primary"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default ItemRequestPage;
