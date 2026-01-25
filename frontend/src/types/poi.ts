export interface POI {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  thumbnail?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: number;
  last_updated_by?: number;
  items?: Item[];
}

export type FlavorType =
  | 'bitter'
  | 'caramel'
  | 'chocolatey'
  | 'coffee-like'
  | 'creamy'
  | 'crisp'
  | 'dry'
  | 'earthy'
  | 'floral'
  | 'fruity'
  | 'full-bodied'
  | 'funky'
  | 'herbal'
  | 'honeyed'
  | 'hoppy'
  | 'light-bodied'
  | 'malty'
  | 'nutty'
  | 'refreshing'
  | 'roasty'
  | 'session'
  | 'smoky'
  | 'smooth'
  | 'sour'
  | 'spicy'
  | 'strong'
  | 'sweet'
  | 'tart'
  | 'toasted'
  | 'woody'
  | 'other';

export interface Item {
  id: number;
  name: string;
  description: string;
  typical_price?: number;
  thumbnail?: string | null;
  flavor_type?: FlavorType;
  percentage?: number;
  created_by?: number;
  updated_by?: number;
}

export interface CreatePOIDto {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  thumbnail?: string;
  item_ids?: number[];
}
