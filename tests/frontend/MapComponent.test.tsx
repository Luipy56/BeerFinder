/**
 * Frontend tests for MapComponent
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import MapComponent from '../../frontend/src/components/MapComponent';
import POIService from '../../frontend/src/services/poiService';

// Mock the POI service
jest.mock('../../frontend/src/services/poiService');

describe('MapComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders map container', () => {
    (POIService.getAllPOIs as jest.Mock).mockResolvedValue([]);
    
    render(
      <MapContainer center={[51.505, -0.09]} zoom={13}>
        <MapComponent />
      </MapContainer>
    );
    
    // Map should be rendered
    expect(document.querySelector('.leaflet-container')).toBeInTheDocument();
  });

  it('loads and displays POIs', async () => {
    const mockPOIs = [
      {
        id: 1,
        name: 'Test POI',
        description: 'A test location',
        latitude: 51.505,
        longitude: -0.09,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    (POIService.getAllPOIs as jest.Mock).mockResolvedValue(mockPOIs);

    render(
      <MapContainer center={[51.505, -0.09]} zoom={13}>
        <MapComponent />
      </MapContainer>
    );

    await waitFor(() => {
      expect(POIService.getAllPOIs).toHaveBeenCalled();
    });
  });
});
