export interface POI {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  price?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  items?: Item[];
}

export interface Item {
  id: number;
  name: string;
  description: string;
  price?: number;
}

export interface CreatePOIDto {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  price?: number;
  item_ids?: number[];
}
