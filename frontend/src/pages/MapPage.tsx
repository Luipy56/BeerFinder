import React from 'react';
import MapComponent from '../components/MapComponent';
import Header from '../components/Header';
import './MapPage.css';

const MapPage: React.FC = () => {
  return (
    <div className="map-page">
      <Header />
      <MapComponent />
    </div>
  );
};

export default MapPage;
