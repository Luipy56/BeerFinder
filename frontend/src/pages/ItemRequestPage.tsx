import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ItemRequestService, { ItemRequest, CreateItemRequestDto } from '../services/itemRequestService';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ItemRequestPage.css';
import { formatPrice } from '../utils/format';

const ItemRequestPage: React.FC = () => {
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
    price: undefined,
    thumbnail: undefined,
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
      [name]: name === 'price' ? (value ? parseFloat(value) : undefined) : value,
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
      setFormData({ name: '', description: '', price: undefined });
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
    setFormData({ name: '', description: '', price: undefined, thumbnail: undefined });
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

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="page-layout">
          <Header />
          <div className="item-request-page">
            <div className="item-request-loading">
              <div className="loading-spinner"></div>
              <p>Loading item requests...</p>
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
              <button
                className="btn-back"
                onClick={() => navigate('/')}
                aria-label="Back to map"
              >
                ← Back to map
              </button>
              <h1>Item Requests</h1>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
              aria-label={showCreateForm ? 'Cancel create request' : 'Create new item request'}
            >
              {showCreateForm ? 'Cancel' : 'New Request'}
            </button>
          </div>

          {showCreateForm && (
            <div className="item-request-create-form card">
              <h2>Create Item Request</h2>
              <form onSubmit={handleSubmit} aria-label="Create item request form">
                <div className="form-group">
                  <label htmlFor="request-name" className="form-label required">
                    Name
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
                    Description
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
                  <label htmlFor="request-price" className="form-label">
                    Price
                  </label>
                  <input
                    type="number"
                    id="request-price"
                    name="price"
                    className="form-input"
                    value={formData.price || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    disabled={isCreating}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="request-thumbnail" className="form-label">
                    Thumbnail (optional)
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
                        alt="Thumbnail preview"
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`}
                    disabled={isCreating || !formData.name.trim()}
                  >
                    {isCreating ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {itemRequests.length === 0 && !showCreateForm ? (
            <div className="item-request-empty">
              <h3>No Item Requests</h3>
              <p>You haven't submitted any item requests yet.</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                Create Your First Request
              </button>
            </div>
          ) : (
            <div className="item-request-list">
              {itemRequests.map((request) => (
                <div
                  key={request.id}
                  className="item-request-card card"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="item-request-card-header">
                    <h3>{request.name}</h3>
                    <span className={getStatusBadgeClass(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
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
                    aria-label="Close modal"
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="item-request-detail">
                      <div className="detail-item">
                        <span className="detail-label">Status</span>
                        <span className={`${getStatusBadgeClass(selectedRequest.status)} status-badge-inline`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </span>
                      </div>
                    {selectedRequest.description && (
                      <div className="detail-item">
                        <span className="detail-label">Description</span>
                        <p className="detail-value">{selectedRequest.description}</p>
                      </div>
                    )}
                    {selectedRequest.price !== undefined && selectedRequest.price !== null && (
                      <div className="detail-item">
                        <span className="detail-label">Price</span>
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
                    Close
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
