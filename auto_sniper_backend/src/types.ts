/** Contains data about the car */
export type car = {
  brand: string;
  model: string;
  year: number;
  mileage: number;
};

/** Contains data related to the listing, not the car */
export type metadata = {
  price: number;
  negotiable?: boolean;
  location: string;
  title: string;
  link: string;
  platform: string;
  image: string;
  description?: string;
  vin?: string;
  plateNumber?: string;
  dataOfFirstRegistration?: string;
};

/** A listing of a car on any platform */
export type listing = {
  car: car;
  metadata: metadata;
};

export interface ProcessedListing extends listing {
  processed: {
    distance: number | null;
    carHistory?: any; // Raw history data from gov.pl (cached for reuse)
    language?: number;
  };
}

export type Fitness = {
  price: number;
  mileage: number;
  distance: number | null;
  year: number;
  looks: number | null;
  description: number | null;
  govDataMatch: number | null;
  historyQuality: number | null;
  language: number | null;
  total: number;
};

export interface AnalizedListing extends ProcessedListing {
  fitness: Fitness;
}

export type Coordinates = {
  lat: number;
  lon: number;
};

/** The perfect car configuration */
export interface searchQuery {
  brand: string;
  model: string;
  year: number;
  location: Coordinates;
  maxPrice?: number;
  description?: string;
  description_forlooks?: string;
  description_fordescription?: string;
  description_forgovdata?: string;
}

export type partialListing = {
  car: Partial<car>;
  metadata: metadata;
};
