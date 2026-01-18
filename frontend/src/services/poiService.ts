import api from '../utils/axiosConfig';
import { POI, CreatePOIDto } from '../types/poi';

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
