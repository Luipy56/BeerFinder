import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MapComponent from '../MapComponent';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import POIService from '../../services/poiService';

/** react-leaflet ships ESM; Jest in CRA does not transform it — use a light stub for integration-style tests. */
jest.mock('react-leaflet', () => {
  const React = require('react');
  return {
    MapContainer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', { className: 'leaflet-container' }, children),
    TileLayer: () => null,
    Marker: () => null,
    Popup: () => null,
    useMap: () => ({
      getContainer: () => globalThis.document.body,
      flyTo: jest.fn(),
      setView: jest.fn(),
      getZoom: () => 6,
    }),
    useMapEvents: () => null,
  };
});

/** Avoid ESM axios (pulled by api client) when AuthProvider / POI stack loads. */
jest.mock('../../utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

jest.mock('../../services/poiService');

/** POIs fetch and `setLoading(false)` are async; controls may portal to body only after the map mounts. */
async function waitForMapReady() {
  await waitFor(() => {
    expect(POIService.getAllPOIs).toHaveBeenCalled();
  });
  await waitFor(() => {
    expect(document.querySelector('.leaflet-container')).toBeInTheDocument();
  });
}

function renderWithProviders(ui: React.ReactElement, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('MapComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (POIService.getAllPOIs as jest.Mock).mockResolvedValue([]);
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((success: PositionCallback) => {
          success({
            coords: { latitude: 40, longitude: -3, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
            timestamp: Date.now(),
          } as GeolocationPosition);
        }),
      },
      configurable: true,
      writable: true,
    });
  });

  it('renders leaflet map after POIs load', async () => {
    renderWithProviders(<MapComponent />);

    await waitForMapReady();
  });

  it('shows locate control after load', async () => {
    renderWithProviders(<MapComponent />);

    await waitForMapReady();

    expect(screen.getByRole('button', { name: 'pages.map.locateMe' })).toBeInTheDocument();
  });

  it('shows geocode search on map', async () => {
    renderWithProviders(<MapComponent />);

    await waitForMapReady();

    expect(screen.getByPlaceholderText('pages.map.searchPlaceholder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pages.map.searchButton' })).toBeInTheDocument();
  });

  it('shows basemap style controls', async () => {
    renderWithProviders(<MapComponent />);

    await waitForMapReady();

    expect(screen.getByTestId('map-basemap-osm')).toBeInTheDocument();
    expect(screen.getByTestId('map-basemap-dark')).toBeInTheDocument();
  });

  it('loads POI from ?poi= when not in list', async () => {
    const poi = {
      id: 42,
      name: 'Deep link POI',
      description: 'Test',
      latitude: 41.0,
      longitude: -4.0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    (POIService.getPOIById as jest.Mock).mockResolvedValue(poi);

    renderWithProviders(<MapComponent />, ['/?poi=42']);

    await waitForMapReady();

    await waitFor(() => {
      expect(POIService.getPOIById).toHaveBeenCalledWith(42);
    });

    await waitFor(() => {
      expect(screen.getByText('Deep link POI')).toBeInTheDocument();
    });
  });
});
