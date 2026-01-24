export interface POI {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  last_updated_by?: number;
  items?: Item[];
}

export interface Item {
  id: number;
  name: string;
  description: string;
  typical_price?: number;
  thumbnail?: string | null;
  created_by?: number;
  updated_by?: number;
}

export interface CreatePOIDto {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  item_ids?: number[];
}
