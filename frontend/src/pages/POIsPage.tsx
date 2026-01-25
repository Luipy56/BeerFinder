import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ViewPOIDetailsModal from '../components/ViewPOIDetailsModal';
import EditPOIModal from '../components/EditPOIModal';
import POIService from '../services/poiService';
import { POI } from '../types/poi';
import { DEFAULT_BEER_LOGO_PATH } from '../utils/constants';
import './POIsPage.css';

const POIsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [pois, setPois] = useState<POI[]>([]);
  const [allPois, setAllPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('poisViewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'list';
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadPOIs();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    localStorage.setItem('poisViewMode', viewMode);
  }, [viewMode]);

  const loadPOIs = async () => {
    try {
      setLoading(true);
      const data = await POIService.getAllPOIs();
      setAllPois(data);
      setPois(data);
    } catch (error: any) {
      console.error('Error loading POIs:', error);
      showError(error.response?.data?.detail || 'Failed to load POIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setPois(allPois);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allPois.filter((poi) => {
      return poi.name?.toLowerCase().includes(query);
    });
    
    setPois(filtered);
  }, [searchQuery, allPois]);

  const handleViewPOI = (poi: POI) => {
    setSelectedPOI(poi);
    setIsViewModalOpen(true);
  };

  const handleEditPOI = () => {
    if (selectedPOI && user?.is_admin) {
      setIsViewModalOpen(false);
      setIsEditModalOpen(true);
    }
  };

  const handlePOIUpdated = async (name: string, description: string, thumbnail?: string) => {
    if (!selectedPOI || !selectedPOI.id) {
      showError('Invalid POI: missing ID');
      return;
    }

    try {
      const updateData: any = {
        name,
        description,
      };
      
      // Pass thumbnail (not thumbnail_write) - the service will convert it
      if (thumbnail !== undefined) {
        updateData.thumbnail = thumbnail;
      }

      const updatedPOI = await POIService.updatePOI(selectedPOI.id, updateData);
      // Reload POIs to get fresh data
      const freshData = await POIService.getAllPOIs();
      setAllPois(freshData);
      setPois(freshData);
      // Find the updated POI from the fresh data to ensure we have the latest thumbnail
      const refreshedPOI = freshData.find(p => p.id === updatedPOI.id) || updatedPOI;
      setIsEditModalOpen(false);
      setSelectedPOI(refreshedPOI);
      setIsViewModalOpen(true);
      showSuccess('POI updated successfully!');
    } catch (error: any) {
      console.error('Error updating POI:', error);
      showError(error.response?.data?.detail || error.message || 'Failed to update POI. Please try again.');
    }
  };

  const getThumbnailUrl = (thumbnail: string | null | undefined): string => {
    if (thumbnail) {
      return `data:image/png;base64,${thumbnail}`;
    }
    return DEFAULT_BEER_LOGO_PATH;
  };

  if (loading) {
    return (
      <div className="pois-page">
        <Header />
        <div className="pois-loading">
          <div className="loading-spinner">Loading POIs...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="pois-page">
      <Header />
      <div className="pois-container">
        <div className="pois-header">
          <h1 className="pois-title">All Points of Interest</h1>
          <p className="pois-subtitle">Browse all POIs in the application</p>
          <div className="pois-search-container">
            <input
              type="text"
              className="pois-search-input"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="pois-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
              title="List view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div className={viewMode === 'grid' ? 'pois-grid' : 'pois-list'}>
          {pois.length === 0 ? (
            <div className="pois-empty">
              <p>No POIs available</p>
            </div>
          ) : (
            pois.map((poi) => (
              <div
                key={poi.id}
                className={`poi-card ${viewMode === 'grid' ? 'poi-card-grid' : ''}`}
                onClick={() => handleViewPOI(poi)}
              >
                {poi.thumbnail && (
                  <div className="poi-card-thumbnail">
                    <img
                      src={getThumbnailUrl(poi.thumbnail)}
                      alt={poi.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_BEER_LOGO_PATH;
                      }}
                    />
                  </div>
                )}
                <div className="poi-card-content">
                  <h3 className="poi-card-name">{poi.name}</h3>
                  {poi.description && (
                    <p className="poi-card-description">
                      {poi.description.length > 150
                        ? `${poi.description.substring(0, 150)}...`
                        : poi.description}
                    </p>
                  )}
                  <div className="poi-card-location">
                    <span className="poi-card-location-label">Location:</span>
                    <span className="poi-card-location-value">
                      {poi.latitude?.toFixed(4)}, {poi.longitude?.toFixed(4)}
                    </span>
                  </div>
                  {poi.items && poi.items.length > 0 && (
                    <div className="poi-card-items-count">
                      {poi.items.length} item{poi.items.length !== 1 ? 's' : ''} assigned
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedPOI && (
        <>
          <ViewPOIDetailsModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedPOI(null);
            }}
            poi={selectedPOI}
            onEdit={handleEditPOI}
          />
          <EditPOIModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPOI(null);
            }}
            poi={selectedPOI}
            onSubmit={handlePOIUpdated}
          />
        </>
      )}
      <Footer />
    </div>
  );
};

export default POIsPage;
