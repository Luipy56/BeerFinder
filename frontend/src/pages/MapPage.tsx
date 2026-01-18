import React from 'react';
import MapComponent from '../components/MapComponent';
import './MapPage.css';

const MapPage: React.FC = () => {
  return (
    <div className="map-page">
      <header className="map-header">
        <h1>BeerFinder</h1>
        <p>Click on the map to create points of interest</p>
      </header>
      <MapComponent />
    </div>
  );
};

export default MapPage;
