import axios from 'axios';
import { POI, CreatePOIDto } from '../types/poi';

// Get API URL - always use current hostname for flexibility
// This allows the app to work from localhost, LAN IP, or any hostname
const getApiBaseUrl = () => {
  // Always use the hostname from where the page is being accessed
  // This ensures it works from localhost, LAN IP, or any domain
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If accessing from localhost/127.0.0.1, use that
  // Otherwise use the hostname (which will be the server's IP when accessed from network)
  return `${protocol}//${hostname}:8000/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

// Log for debugging (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const POIService = {
  getAllPOIs: async (): Promise<POI[]> => {
    const response = await api.get('/pois/');
    // Handle GeoJSON format from DRF-GIS
    if (response.data && response.data.results) {
      return response.data.results.map((item: any) => {
        // Extract from GeoJSON feature format if needed
        if (item.geometry) {
          return {
            ...item.properties,
            latitude: item.geometry.coordinates[1],
            longitude: item.geometry.coordinates[0],
          };
        }
        return item;
      });
    }
    // Handle regular list format
    return Array.isArray(response.data) ? response.data : [];
  },

  getPOIById: async (id: number): Promise<POI> => {
    const response = await api.get<POI>(`/pois/${id}/`);
    return response.data;
  },

  createPOI: async (poiData: CreatePOIDto): Promise<POI> => {
    const response = await api.post('/pois/', poiData);
    // Handle GeoJSON format from DRF-GIS
    if (response.data && response.data.geometry) {
      return {
        ...response.data.properties,
        latitude: response.data.geometry.coordinates[1],
        longitude: response.data.geometry.coordinates[0],
      };
    }
    return response.data;
  },

  updatePOI: async (id: number, poiData: Partial<CreatePOIDto>): Promise<POI> => {
    const response = await api.patch<POI>(`/pois/${id}/`, poiData);
    return response.data;
  },

  deletePOI: async (id: number): Promise<void> => {
    await api.delete(`/pois/${id}/`);
  },
};

export default POIService;
