import api from '../utils/axiosConfig';
import { FlavorType } from '../types/poi';

export interface ItemRequest {
  id: number;
  name: string;
  description: string;
  price?: number | null;
  percentage?: number | null;
  thumbnail?: string | null;
  flavor_type?: FlavorType;
  requested_by?: number;
  requested_by_username?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateItemRequestDto {
  name: string;
  description?: string;
  price?: number;
  percentage?: number | null;
  thumbnail?: string;
  flavor_type?: FlavorType;
}

const ItemRequestService = {
  getAllItemRequests: async (): Promise<ItemRequest[]> => {
    const response = await api.get<any>('/item-requests/');
    // Handle paginated response from DRF
    if (response.data && response.data.results) {
      return response.data.results;
    }
    // Handle non-paginated response
    return Array.isArray(response.data) ? response.data : [];
  },

  getItemRequestById: async (id: number): Promise<ItemRequest> => {
    const response = await api.get<ItemRequest>(`/item-requests/${id}/`);
    return response.data;
  },

  createItemRequest: async (itemRequestData: CreateItemRequestDto): Promise<ItemRequest> => {
    // Send thumbnail as thumbnail_write for the backend to process
    const requestPayload: any = {
      name: itemRequestData.name,
      description: itemRequestData.description,
      price: itemRequestData.price,
      flavor_type: itemRequestData.flavor_type,
    };
    
    // Add percentage if provided, otherwise set to null
    if (itemRequestData.percentage !== undefined && itemRequestData.percentage !== null) {
      requestPayload.percentage = itemRequestData.percentage;
    } else {
      requestPayload.percentage = null;
    }
    
    // Add thumbnail_write if thumbnail is provided
    if (itemRequestData.thumbnail) {
      requestPayload.thumbnail_write = itemRequestData.thumbnail;
    }
    
    const response = await api.post<ItemRequest>('/item-requests/', requestPayload);
    return response.data;
  },
};

export default ItemRequestService;
