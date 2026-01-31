import api from '../utils/axiosConfig';
import { Item } from '../types/poi';

const ItemService = {
  getAllItems: async (): Promise<Item[]> => {
    const response = await api.get('/items/');
    // Handle paginated response from DRF
    if (response.data && response.data.results) {
      return response.data.results;
    }
    // Handle non-paginated response
    return Array.isArray(response.data) ? response.data : [];
  },

  getItemById: async (id: number): Promise<Item> => {
    const response = await api.get<Item>(`/items/${id}/`);
    return response.data;
  },

  updateItem: async (id: number, itemData: Partial<Item & { thumbnail_write?: string }>): Promise<Item> => {
    // Send thumbnail as thumbnail_write for the backend to process
    const requestPayload: any = {
      name: itemData.name,
      description: itemData.description,
      brand: itemData.brand,
      typical_price: itemData.typical_price,
      flavor_type: itemData.flavor_type,
      percentage: itemData.percentage,
    };
    
    // Add thumbnail_write if thumbnail is provided
    if (itemData.thumbnail_write !== undefined) {
      requestPayload.thumbnail_write = itemData.thumbnail_write;
    }
    
    const response = await api.patch<Item>(`/items/${id}/`, requestPayload);
    return response.data;
  },

  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/items/${id}/`);
  },
};

export default ItemService;
