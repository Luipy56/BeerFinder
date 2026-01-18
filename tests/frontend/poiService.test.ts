/**
 * Frontend tests for POI Service
 */
import POIService from '../../frontend/src/services/poiService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('POIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches all POIs', async () => {
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

    mockedAxios.create = jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ data: mockPOIs })
    } as any));

    const pois = await POIService.getAllPOIs();
    expect(pois).toEqual(mockPOIs);
  });

  it('creates a new POI', async () => {
    const newPOI = {
      name: 'New POI',
      description: 'A new location',
      latitude: 51.505,
      longitude: -0.09
    };

    const createdPOI = { ...newPOI, id: 1 };

    mockedAxios.create = jest.fn(() => ({
      post: jest.fn().mockResolvedValue({ data: createdPOI })
    } as any));

    const result = await POIService.createPOI(newPOI);
    expect(result).toEqual(createdPOI);
  });
});
