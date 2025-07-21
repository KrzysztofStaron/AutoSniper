export type SearchPlatform = "otomoto" | "olx" | "all" | "samochody" | "autoplac" | "gratka";

export interface SearchRequest {
  brand: string;
  model: string;
  year: number;
  maxPrice?: number;
  location: { lat: number; lon: number };
  platform: SearchPlatform;
  description_forlooks: string;
  description_fordescription: string;
  description_forgovdata: string;
}

export interface LocationData {
  lat: number;
  lon: number;
}
