import api from '../utils/axiosConfig';

export interface ItemRequest {
  id: number;
  name: string;
  description: string;
  price?: number | null;
  requested_by?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateItemRequestDto {
  name: string;
  description?: string;
  price?: number;
}

const ItemRequestService = {
  getAllItemRequests: async (): Promise<ItemRequest[]> => {
    const response = await api.get<ItemRequest[]>('/item-requests/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getItemRequestById: async (id: number): Promise<ItemRequest> => {
    const response = await api.get<ItemRequest>(`/item-requests/${id}/`);
    return response.data;
  },

  createItemRequest: async (itemRequestData: CreateItemRequestDto): Promise<ItemRequest> => {
    const response = await api.post<ItemRequest>('/item-requests/', itemRequestData);
    return response.data;
  },
};

export default ItemRequestService;
