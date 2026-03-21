import React from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';

export type BasemapId = 'osm' | 'dark';

interface MapBasemapControlProps {
  basemap: BasemapId;
  onBasemapChange: (next: BasemapId) => void;
}

const MapBasemapControl: React.FC<MapBasemapControlProps> = ({ basemap, onBasemapChange }) => {
  const map = useMap();
  const { t } = useTranslation();
  const container = map.getContainer();

  return createPortal(
    <div className="map-basemap-control" role="group" aria-label={t('pages.map.basemapGroup')}>
      <button
        type="button"
        className={`map-basemap-segment ${basemap === 'osm' ? 'map-basemap-segment-active' : ''}`}
        onClick={() => onBasemapChange('osm')}
        aria-pressed={basemap === 'osm'}
        data-testid="map-basemap-osm"
      >
        {t('pages.map.basemapOsm')}
      </button>
      <button
        type="button"
        className={`map-basemap-segment ${basemap === 'dark' ? 'map-basemap-segment-active' : ''}`}
        onClick={() => onBasemapChange('dark')}
        aria-pressed={basemap === 'dark'}
        data-testid="map-basemap-dark"
      >
        {t('pages.map.basemapDark')}
      </button>
    </div>,
    container
  );
};

export default MapBasemapControl;
