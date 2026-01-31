import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';
import { POI, CreatePOIDto } from '../types/poi';
import POIService from '../services/poiService';
import CreatePOIModal from './CreatePOIModal';
import ViewPOIModal from './ViewPOIModal';
import EditPOIModal from './EditPOIModal';
import DeletePOIModal from './DeletePOIModal';
import LoginPromptModal from './LoginPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const SESSION_KEY_LAST_MAP = 'beerfinder_map_last_center';
const SPAIN_CENTER: [number, number] = [40.0, -3.7];
const DEFAULT_ZOOM = 6;
const POI_ZOOM = 13;

function parseStoredCenter(stored: string | null): { center: [number, number]; zoom: number } | null {
  if (!stored) return null;
  try {
    const data = JSON.parse(stored);
    const lat = typeof data.lat === 'number' ? data.lat : Number(data.lat);
    const lng = typeof data.lng === 'number' ? data.lng : Number(data.lng);
    const zoom = typeof data.zoom === 'number' ? data.zoom : POI_ZOOM;
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { center: [lat, lng], zoom };
    }
  } catch (_) {
    // ignore
  }
  return null;
}

function saveLastViewedPOI(poi: POI): void {
  if (poi.latitude == null || poi.longitude == null) return;
  try {
    sessionStorage.setItem(
      SESSION_KEY_LAST_MAP,
      JSON.stringify({ lat: poi.latitude, lng: poi.longitude, zoom: POI_ZOOM })
    );
  } catch (_) {
    // ignore
  }
}

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
  const [isLoginPromptModalOpen, setIsLoginPromptModalOpen] = useState<boolean>(false);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [mapState, setMapState] = useState<{ center: [number, number]; zoom: number }>(() => ({
    center: SPAIN_CENTER,
    zoom: DEFAULT_ZOOM,
  }));
  const [syncViewToState, setSyncViewToState] = useState(true);

  useEffect(() => {
    loadPOIs();
    const stored = parseStoredCenter(sessionStorage.getItem(SESSION_KEY_LAST_MAP));
    if (stored) {
      setMapState(stored);
      setSyncViewToState(true);
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapState((prev) => ({
            center: [position.coords.latitude, position.coords.longitude],
            zoom: prev.zoom < POI_ZOOM ? POI_ZOOM : prev.zoom,
          }));
          setSyncViewToState(true);
        },
        () => {
          // User denied or error: keep session/default (Spain)
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

  const clearSyncViewToState = useCallback(() => setSyncViewToState(false), []);

  const MapCenterUpdater: React.FC<{
    center: [number, number];
    zoom: number;
    syncViewToState: boolean;
    onApplied: () => void;
  }> = ({ center, zoom, syncViewToState, onApplied }) => {
    const map = useMap();
    useEffect(() => {
      if (syncViewToState) {
        map.setView(center, zoom);
        onApplied();
      }
    }, [center, zoom, syncViewToState, map, onApplied]);
    return null;
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isViewModalOpen) {
      setIsViewModalOpen(false);
      setSelectedPOI(null);
      return;
    }
    if (!isAuthenticated) {
      setIsLoginPromptModalOpen(true);
      return;
    }
    setMapState((prev) => ({ ...prev, center: [lat, lng] }));
    setSyncViewToState(true);
    setClickedLocation({ lat, lng });
    setIsCreateModalOpen(true);
  };

  const handleViewDetails = (poi: POI) => {
    if (poi.latitude != null && poi.longitude != null) {
      saveLastViewedPOI(poi);
      setMapState({ center: [poi.latitude, poi.longitude], zoom: POI_ZOOM });
      setSyncViewToState(true);
    }
    setSelectedPOI(poi);
    setIsViewModalOpen(true);
  };

  const handleCreatePOI = async (name: string, description: string, thumbnail?: string) => {
    if (!clickedLocation) return;

    try {
      const newPOI: CreatePOIDto = {
        name,
        description,
        latitude: clickedLocation.lat,
        longitude: clickedLocation.lng,
        ...(thumbnail && { thumbnail }),
      };

      const createdPOI = await POIService.createPOI(newPOI);
      // Ensure the POI has a valid id
      if (!createdPOI.id) {
        console.error('Created POI missing id:', createdPOI);
        showError('Failed to create POI: missing ID in response');
        return;
      }
      setPois([...pois, createdPOI]);
      showSuccess('POI created successfully!');
    } catch (error: any) {
      console.error('Error creating POI:', error);
      showError(error.response?.data?.detail || error.message || 'Failed to create POI. Please try again.');
      throw error;
    }
  };

  const handleEditPOI = async (name: string, description: string, thumbnail?: string) => {
    if (!selectedPOI || !selectedPOI.id) {
      console.error('handleEditPOI called with invalid POI:', selectedPOI);
      showError('Invalid POI: missing ID');
      return;
    }

    try {
      const updateData: any = {
        name,
        description,
      };
      
      // Only include thumbnail if a new one was provided
      if (thumbnail !== undefined) {
        updateData.thumbnail = thumbnail;
      }
      
      const updatedPOIResponse = await POIService.updatePOI(selectedPOI.id, updateData);
      // Always preserve original coordinates (coordinates are never edited)
      const updatedPOI = {
        ...selectedPOI,
        name,
        description,
        thumbnail: updatedPOIResponse.thumbnail || selectedPOI.thumbnail,
      };
      setPois(pois.map((p) => (p.id === selectedPOI.id ? updatedPOI : p)));
      setIsEditModalOpen(false);
      setIsViewModalOpen(true);
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
        center={mapState.center}
        zoom={mapState.zoom}
        style={{ height: '100%', width: '100%' }}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterUpdater
          center={mapState.center}
          zoom={mapState.zoom}
          syncViewToState={syncViewToState}
          onApplied={clearSyncViewToState}
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {pois.map((poi) => {
          // Only render marker if coordinates are valid
          if (poi.latitude == null || poi.longitude == null) {
            return null;
          }
          return (
            <Marker
              key={poi.id}
              position={[poi.latitude, poi.longitude]}
            >
            <Popup>
              <div className="poi-popup">
                <h3>{poi.name}</h3>
                {poi.description && (
                  <p>
                    {poi.description.length > 100
                      ? `${poi.description.substring(0, 100)}...`
                      : poi.description}
                  </p>
                )}
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
          );
        })}
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
              setIsViewModalOpen(true);
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
      <LoginPromptModal
        isOpen={isLoginPromptModalOpen}
        onClose={() => setIsLoginPromptModalOpen(false)}
      />
    </div>
  );
};

export default MapComponent;
