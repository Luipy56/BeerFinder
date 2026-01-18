import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';
import { POI, CreatePOIDto } from '../types/poi';
import POIService from '../services/poiService';
import CreatePOIModal from './CreatePOIModal';

const MapComponent: React.FC = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadPOIs();
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
    setClickedLocation({ lat, lng });
    setIsModalOpen(true);
  };

  const handleCreatePOI = async (name: string, description: string, price?: number) => {
    if (!clickedLocation) return;

    try {
      const newPOI: CreatePOIDto = {
        name,
        description,
        latitude: clickedLocation.lat,
        longitude: clickedLocation.lng,
        price,
      };

      console.log('Creating POI with data:', newPOI);
      const createdPOI = await POIService.createPOI(newPOI);
      setPois([...pois, createdPOI]);
      console.log('POI created successfully:', createdPOI);
    } catch (error: any) {
      console.error('Error creating POI:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response,
      });
      alert(`Failed to create POI: ${error.message || 'Network error'}. Please check the console for details.`);
    }
  };

  if (loading) {
    return <div className="map-loading">Loading map...</div>;
  }

  return (
    <div className="map-container">
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {pois.map((poi) => (
          <Marker key={poi.id} position={[poi.latitude, poi.longitude]}>
            <Popup>
              <div>
                <h3>{poi.name}</h3>
                <p>{poi.description}</p>
                {poi.price && <p><strong>Price:</strong> ${poi.price.toFixed(2)}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {clickedLocation && (
        <CreatePOIModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setClickedLocation(null);
          }}
          onSubmit={handleCreatePOI}
          latitude={clickedLocation.lat}
          longitude={clickedLocation.lng}
        />
      )}
    </div>
  );
};

export default MapComponent;
