import api from '../utils/axiosConfig';
import { POI, CreatePOIDto, Item } from '../types/poi';

const POIService = {
  getAllPOIs: async (): Promise<POI[]> => {
    const response = await api.get('/pois/');
    // Handle GeoJSON format from DRF-GIS
    if (response.data && response.data.results) {
      return response.data.results.map((item: any) => {
        // Extract from GeoJSON feature format if needed
        if (item.geometry) {
          const itemId = item.id !== undefined ? item.id : item.properties?.id;
          return {
            id: itemId,
            ...item.properties,
            latitude: item.geometry.coordinates[1],
            longitude: item.geometry.coordinates[0],
          };
        }
        return item;
      });
    }
    // Handle regular list format (non-paginated)
    if (Array.isArray(response.data)) {
      return response.data.map((item: any) => {
        // Handle GeoJSON format in array
        if (item.geometry) {
          const itemId = item.id !== undefined ? item.id : item.properties?.id;
          return {
            id: itemId,
            ...item.properties,
            latitude: item.geometry.coordinates[1],
            longitude: item.geometry.coordinates[0],
          };
        }
        return item;
      });
    }
    return [];
  },

  getPOIById: async (id: number): Promise<POI> => {
    const response = await api.get(`/pois/${id}/`);
    // Handle GeoJSON format from DRF-GIS
    if (response.data && response.data.geometry) {
      const geoData = response.data;
      const poiId = geoData.id !== undefined ? geoData.id : (geoData.properties?.id || id);
      return {
        id: poiId,
        ...geoData.properties,
        latitude: geoData.geometry.coordinates[1],
        longitude: geoData.geometry.coordinates[0],
      };
    }
    // Handle regular format (non-GeoJSON)
    return response.data;
  },

  createPOI: async (poiData: CreatePOIDto): Promise<POI> => {
    const response = await api.post('/pois/', poiData);
    // Handle GeoJSON format from DRF-GIS
    // GeoJSON Feature format: { type: "Feature", id: X, geometry: {...}, properties: {...} }
    if (response.data && response.data.geometry) {
      const geoData = response.data;
      // Extract id from top level (GeoJSON Feature) or from properties
      const poiId = geoData.id !== undefined ? geoData.id : (geoData.properties?.id);
      const poi: POI = {
        id: poiId,
        ...geoData.properties,
        latitude: geoData.geometry.coordinates[1],
        longitude: geoData.geometry.coordinates[0],
      };
      // Ensure id is present
      if (poi.id === undefined || poi.id === null) {
        console.error('POI created but missing id in response:', response.data);
        throw new Error('POI created but response missing ID');
      }
      return poi;
    }
    // Handle regular format (non-GeoJSON)
    if (!response.data || response.data.id === undefined || response.data.id === null) {
      console.error('POI created but missing id in response:', response.data);
      throw new Error('POI created but response missing ID');
    }
    return response.data;
  },

  updatePOI: async (id: number, poiData: Partial<CreatePOIDto>): Promise<POI> => {
    // Note: coordinates are never updated, only name and description
    const response = await api.patch(`/pois/${id}/`, poiData);
    // Handle GeoJSON format from DRF-GIS
    if (response.data && response.data.geometry) {
      const geoData = response.data;
      const poiId = geoData.id !== undefined ? geoData.id : (geoData.properties?.id || id);
      return {
        id: poiId,
        ...geoData.properties,
        latitude: geoData.geometry.coordinates[1],
        longitude: geoData.geometry.coordinates[0],
      };
    }
    // Handle regular format (non-GeoJSON)
    // Ensure id is present
    if (response.data && (response.data.id === undefined || response.data.id === null)) {
      return { ...response.data, id };
    }
    return response.data;
  },

  deletePOI: async (id: number): Promise<void> => {
    await api.delete(`/pois/${id}/`);
  },

  getAvailableItems: async (poiId: number): Promise<Item[]> => {
    const response = await api.get(`/pois/${poiId}/available_items/`);
    return response.data;
  },

  getPOIItems: async (poiId: number): Promise<any[]> => {
    const response = await api.get(`/pois/${poiId}/poi_items/`);
    return response.data;
  },

  assignItem: async (poiId: number, itemId: number, localPrice?: number): Promise<any> => {
    const response = await api.post(`/pois/${poiId}/assign_item/`, {
      item_id: itemId,
      local_price: localPrice,
    });
    return response.data;
  },

  removeItem: async (poiId: number, itemId: number): Promise<void> => {
    await api.post(`/pois/${poiId}/remove_item/`, { item_id: itemId });
  },
};

export default POIService;
