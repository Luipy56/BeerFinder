import React from 'react';
import MapComponent from '../components/MapComponent';
import UserMenu from '../components/UserMenu';
import './MapPage.css';

const MapPage: React.FC = () => {
  return (
    <div className="map-page">
      <header className="map-header">
        <div className="header-content">
          <div className="header-text">
            <h1>BeerFinder</h1>
            <p>Click on the map to create points of interest</p>
          </div>
          <UserMenu />
        </div>
      </header>
      <MapComponent />
    </div>
  );
};

export default MapPage;
