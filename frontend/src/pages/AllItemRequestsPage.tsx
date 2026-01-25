import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ItemRequestService, { ItemRequest } from '../services/itemRequestService';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ItemRequestPage.css';
import { formatPrice } from '../utils/format';
import api from '../utils/axiosConfig';

const AllItemRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [itemRequests, setItemRequests] = useState<ItemRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ItemRequest | null>(null);

  useEffect(() => {
    if (user && user.is_admin) {
      loadAllItemRequests();
    } else {
      navigate('/item-requests');
    }
  }, [user]);

  const loadAllItemRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/item-requests/list_all/');
      // Handle paginated response from DRF
      if (response.data && response.data.results) {
        setItemRequests(response.data.results);
      } else if (Array.isArray(response.data)) {
        setItemRequests(response.data);
      } else {
        setItemRequests([]);
      }
    } catch (error: any) {
      console.error('Error loading all item requests:', error);
      showError(error.response?.data?.detail || 'Failed to load item requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      await api.post(`/item-requests/${requestId}/approve/`);
      showSuccess('Item request approved successfully!');
      await loadAllItemRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.post(`/item-requests/${requestId}/reject/`);
      showSuccess('Item request rejected successfully!');
      await loadAllItemRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to reject request');
    }
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
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              {request.requested_by_username && (
                <p className="item-request-user">
                  {request.requested_by_username}
                </p>
              )}
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
                <h1>All Item Requests</h1>
              </div>
            </div>

            {itemRequests.length === 0 ? (
              <div className="item-request-empty">
                <h3>No Item Requests</h3>
                <p>There are no item requests in the system.</p>
              </div>
            ) : (
              <div className="item-request-sections">
                {renderRequestSection('Pending', groupedRequests.pending, 'pending')}
                {renderRequestSection('Approved', groupedRequests.approved, 'approved')}
                {renderRequestSection('Rejected', groupedRequests.rejected, 'rejected')}
              </div>
            )}

            {selectedRequest && (
              <div
                className="modal-overlay"
                onClick={() => setSelectedRequest(null)}
                role="dialog"
                aria-modal="true"
              >
                <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
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
                      {selectedRequest.requested_by_username && (
                        <div className="detail-item">
                          <span className="detail-label">Requested by</span>
                          <span className="detail-value">{selectedRequest.requested_by_username}</span>
                        </div>
                      )}
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
                    </div>
                  </div>
                  <div className="modal-footer">
                    {selectedRequest.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(selectedRequest.id)}
                          className="btn btn-success"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(selectedRequest.id)}
                          className="btn btn-danger"
                        >
                          Reject
                        </button>
                      </>
                    )}
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

export default AllItemRequestsPage;
