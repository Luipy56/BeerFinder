import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';
import { POI, CreatePOIDto } from '../types/poi';
import POIService from '../services/poiService';
import CreatePOIModal from './CreatePOIModal';
import ViewPOIModal from './ViewPOIModal';
import EditPOIModal from './EditPOIModal';
import DeletePOIModal from './DeletePOIModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../utils/format';

const MapComponent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([51.505, -0.09]); // Default to London

  useEffect(() => {
    loadPOIs();
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn('Error getting user location:', error);
          // Keep default location
        }
      );
    }
  }, []);

  const loadPOIs = async () => {
    try {
      const data = await POIService.getAllPOIs();
      setPois(data);
    } catch (error) {
      console.error('Error loading POIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
    useMapEvents({
      click: (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Close ViewPOIModal if open when clicking on map
    if (isViewModalOpen) {
      setIsViewModalOpen(false);
      setSelectedPOI(null);
      return;
    }
    
    if (!isAuthenticated) {
      if (window.confirm('You need to be logged in to create a POI. Would you like to login?')) {
        navigate('/auth');
      }
      return;
    }
    setClickedLocation({ lat, lng });
    setIsCreateModalOpen(true);
  };

  const handleMarkerClick = (poi: POI) => {
    setSelectedPOI(poi);
    // Don't open ViewPOIModal here - only open it when "View Details" button is clicked
  };

  const handleViewDetails = (poi: POI) => {
    setSelectedPOI(poi);
    setIsViewModalOpen(true);
  };

  const handleCreatePOI = async (name: string, description: string) => {
    if (!clickedLocation) return;

    try {
      const newPOI: CreatePOIDto = {
        name,
        description,
        latitude: clickedLocation.lat,
        longitude: clickedLocation.lng,
      };

      const createdPOI = await POIService.createPOI(newPOI);
      setPois([...pois, createdPOI]);
      showSuccess('POI created successfully!');
    } catch (error: any) {
      console.error('Error creating POI:', error);
      showError(error.response?.data?.detail || error.message || 'Failed to create POI. Please try again.');
      throw error;
    }
  };

  const handleEditPOI = async (name: string, description: string) => {
    if (!selectedPOI) return;

    try {
      const updatedPOI = await POIService.updatePOI(selectedPOI.id, {
        name,
        description,
      });
      setPois(pois.map((p) => (p.id === selectedPOI.id ? updatedPOI : p)));
      setIsEditModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedPOI(updatedPOI);
      showSuccess('POI updated successfully!');
    } catch (error: any) {
      console.error('Error updating POI:', error);
      showError(error.response?.data?.detail || error.message || 'Failed to update POI. Please try again.');
      throw error;
    }
  };

  const handleDeletePOI = async () => {
    if (!selectedPOI) return;

    try {
      await POIService.deletePOI(selectedPOI.id);
      setPois(pois.filter((p) => p.id !== selectedPOI.id));
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedPOI(null);
      showSuccess('POI deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting POI:', error);
      showError(error.response?.data?.detail || error.message || 'Failed to delete POI. Please try again.');
      throw error;
    }
  };

  const handleOpenEdit = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = () => {
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return <div className="map-loading">Loading map...</div>;
  }

  return (
    <div className="map-container">
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.latitude, poi.longitude]}
          >
            <Popup>
              <div className="poi-popup">
                <h3>{poi.name}</h3>
                {poi.description && <p>{poi.description}</p>}
                <button
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(poi);
                  }}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {pois.length === 0 && !loading && (
        <div className="map-empty-state">
          <h3>No Points of Interest</h3>
          <p>Click on the map to create your first POI</p>
        </div>
      )}
      {clickedLocation && (
        <CreatePOIModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setClickedLocation(null);
          }}
          onSubmit={handleCreatePOI}
          latitude={clickedLocation.lat}
          longitude={clickedLocation.lng}
        />
      )}
      {selectedPOI && (
        <>
          <ViewPOIModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedPOI(null);
            }}
            poi={selectedPOI}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            canEdit={isAuthenticated && selectedPOI ? (user?.is_admin || selectedPOI.created_by === user?.id) : false}
            canDelete={isAuthenticated && selectedPOI ? (user?.is_admin || selectedPOI.created_by === user?.id) : false}
          />
          <EditPOIModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPOI(null);
            }}
            poi={selectedPOI}
            onSubmit={handleEditPOI}
          />
          <DeletePOIModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPOI(null);
            }}
            poi={selectedPOI}
            onConfirm={handleDeletePOI}
          />
        </>
      )}
    </div>
  );
};

export default MapComponent;
