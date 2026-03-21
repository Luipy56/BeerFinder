import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
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
import MapGeocodeControl from './MapGeocodeControl';
import MapBasemapControl, { BasemapId } from './MapBasemapControl';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { buildMapMarkers, clusterIcon } from '../utils/mapClustering';
import { haversineDistanceKm, formatDistanceFromKm } from '../utils/geoUtils';

const STORAGE_BASEMAP = 'beerfinder_map_basemap';
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTO_DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>';

const SESSION_KEY_LAST_MAP = 'beerfinder_map_last_center';
const SPAIN_CENTER: [number, number] = [40.0, -3.7];
const DEFAULT_ZOOM = 6;
const POI_ZOOM = 13;
/** OSM raster tiles are reliable through zoom 19 (see openstreetmap.org tile usage policy). */
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
/** Tight zoom for “my location” and precise POI placement (inspired by store-locator / venue apps). */
const LOCATE_ZOOM = 18;

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

const MapZoomTracker: React.FC<{ onZoomChange: (z: number) => void }> = ({ onZoomChange }) => {
  const map = useMap();
  useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  });
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  return null;
};

const MapLocateControl: React.FC = () => {
  const map = useMap();
  const { t } = useTranslation();
  const { showError } = useToast();
  const container = map.getContainer();

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      showError(t('pages.map.geolocationNotSupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], LOCATE_ZOOM, { duration: 0.6 });
      },
      () => {
        showError(t('pages.map.geolocationDenied'));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 }
    );
  }, [map, showError, t]);

  return createPortal(
    <div className="map-locate-control" role="presentation">
      <button
        type="button"
        className="map-locate-button"
        onClick={handleLocate}
        aria-label={t('pages.map.locateMe')}
        title={t('pages.map.locateMe')}
      >
        <span className="map-locate-icon" aria-hidden="true" />
      </button>
    </div>,
    container
  );
};

const MapComponent: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [searchParams] = useSearchParams();
  const poiQueryParam = searchParams.get('poi');
  const deepLinkHandledRef = useRef<string | null>(null);
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
  const mapZoomRef = useRef(DEFAULT_ZOOM);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  const onMapZoomChange = useCallback((z: number) => {
    mapZoomRef.current = z;
    setMapZoom(z);
  }, []);

  const handleClusterZoomIn = useCallback((lat: number, lng: number) => {
    const z = mapZoomRef.current;
    setMapState({
      center: [lat, lng],
      zoom: Math.min(MAX_ZOOM, Math.max(z + 2, 12)),
    });
    setSyncViewToState(true);
  }, []);

  const markerEntries = useMemo(() => buildMapMarkers(pois, mapZoom), [pois, mapZoom]);

  const [basemap, setBasemap] = useState<BasemapId>(() => {
    try {
      return localStorage.getItem(STORAGE_BASEMAP) === 'dark' ? 'dark' : 'osm';
    } catch {
      return 'osm';
    }
  });
  const [userLatLng, setUserLatLng] = useState<{ lat: number; lng: number } | null>(null);

  const handleBasemapChange = useCallback((next: BasemapId) => {
    try {
      localStorage.setItem(STORAGE_BASEMAP, next);
    } catch {
      // ignore
    }
    setBasemap(next);
  }, []);

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
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLatLng({ lat, lng });
          setMapState((prev) => ({
            center: [lat, lng],
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

  useEffect(() => {
    if (loading) return;
    if (poiQueryParam == null || poiQueryParam === '') {
      deepLinkHandledRef.current = null;
      return;
    }
    if (deepLinkHandledRef.current === poiQueryParam) return;

    const id = Number.parseInt(poiQueryParam, 10);
    if (!Number.isFinite(id) || id <= 0) {
      showError(t('pages.map.poiLinkInvalid'));
      deepLinkHandledRef.current = poiQueryParam;
      return;
    }

    let cancelled = false;

    const openFromDeepLink = async () => {
      try {
        let poi = pois.find((p) => p.id === id);
        if (!poi) {
          poi = await POIService.getPOIById(id);
        }
        if (cancelled || !poi) return;
        deepLinkHandledRef.current = poiQueryParam;
        if (poi.latitude != null && poi.longitude != null) {
          saveLastViewedPOI(poi);
          setMapState({ center: [poi.latitude, poi.longitude], zoom: POI_ZOOM });
          setSyncViewToState(true);
        }
        setSelectedPOI(poi);
        setIsViewModalOpen(true);
        setPois((prev) => (prev.some((p) => p.id === poi.id) ? prev : [...prev, poi!]));
      } catch {
        if (!cancelled) {
          showError(t('pages.map.poiNotFound'));
          deepLinkHandledRef.current = poiQueryParam;
        }
      }
    };

    void openFromDeepLink();
    return () => {
      cancelled = true;
    };
  }, [loading, poiQueryParam, pois, showError, t]);

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
      showSuccess(t('components.createPOIModal.poiCreated'));
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
      showSuccess(t('components.editPOIModal.failedToUpdate').replace('Failed to update POI. Please try again.', '') || t('pages.pois.poiDeleted'));
    } catch (error: any) {
      console.error('Error updating POI:', error);
      showError(error.response?.data?.detail || error.message || t('pages.pois.failedToUpdate'));
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
    return <div className="map-loading">{t('pages.map.loading')}</div>;
  }

  return (
    <div className="map-container">
      <MapContainer
        center={mapState.center}
        zoom={mapState.zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ height: '100%', width: '100%' }}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom
      >
        <TileLayer
          key={basemap}
          attribution={basemap === 'osm' ? OSM_ATTRIBUTION : CARTO_ATTRIBUTION}
          url={basemap === 'osm' ? OSM_TILE_URL : CARTO_DARK_TILE_URL}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          maxNativeZoom={19}
        />
        <MapLocateControl />
        <MapBasemapControl basemap={basemap} onBasemapChange={handleBasemapChange} />
        <MapGeocodeControl />
        <MapZoomTracker onZoomChange={onMapZoomChange} />
        <MapCenterUpdater
          center={mapState.center}
          zoom={mapState.zoom}
          syncViewToState={syncViewToState}
          onApplied={clearSyncViewToState}
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {markerEntries.map((entry) => {
          if (entry.type === 'poi') {
            const poi = entry.poi;
            const popupDistance =
              userLatLng != null
                ? formatDistanceFromKm(
                    haversineDistanceKm(userLatLng.lat, userLatLng.lng, poi.latitude, poi.longitude)
                  )
                : null;
            return (
              <Marker key={`poi-${poi.id}`} position={[poi.latitude, poi.longitude]}>
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
                    {popupDistance && (
                      <p className="poi-popup-distance">{t('pages.map.distanceAway', { distance: popupDistance })}</p>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(poi);
                      }}
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    >
                      {t('pages.map.viewDetails')}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          }
          const m = entry;
          const clusterKey = `cluster-${m.lat.toFixed(5)}-${m.lng.toFixed(5)}-${m.pois.length}-${m.pois[0]?.id ?? 0}`;
          return (
            <Marker key={clusterKey} position={[m.lat, m.lng]} icon={clusterIcon(m.pois.length)}>
              <Popup>
                <div className="poi-popup map-cluster-popup">
                  <p className="map-cluster-popup-text">{t('pages.map.clusterPlaces', { count: m.pois.length })}</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClusterZoomIn(m.lat, m.lng);
                    }}
                  >
                    {t('pages.map.clusterZoomIn')}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {pois.length === 0 && !loading && (
        <div className="map-empty-state">
          <h3>{t('pages.map.noPOIs')}</h3>
          <p>{t('pages.map.clickToCreate')}</p>
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
