import fetch from "node-fetch";
import fs from "fs/promises";
import { Coordinates } from "../types";

type CoordinatesCache = {
  [place: string]: { coordinates: Coordinates };
};

// Load cache once at module initialization
let coordinatesCache: CoordinatesCache = {};
let cacheLoaded = false;

async function loadCache(): Promise<void> {
  if (cacheLoaded) return;

  try {
    const cacheData = await fs.readFile("./cache/coords.json", "utf-8");
    coordinatesCache = JSON.parse(cacheData) as CoordinatesCache;
    console.log("Coordinates cache loaded successfully");
  } catch (error) {
    // If file doesn't exist or can't be read, start with empty cache
    console.log("Cache file not found or invalid, starting with empty cache");
    coordinatesCache = {};
  }
  cacheLoaded = true;
}

async function saveCache(): Promise<void> {
  try {
    // Ensure the cache directory exists
    await fs.mkdir("./cache", { recursive: true });
    // Write to cache file
    await fs.writeFile("./cache/coords.json", JSON.stringify(coordinatesCache, null, 2));
  } catch (error) {
    console.error("Error saving cache file:", error);
  }
}

// Convert a location string (e.g., "Warszawa, Mazowieckie") to coordinates
// Uses OpenStreetMap's Nominatim service for geocoding
export async function getCoords(place: string): Promise<{ coordinates: Coordinates | null; cached: boolean }> {
  try {
    // Load cache if not already loaded
    await loadCache();

    // Check cache first
    if (coordinatesCache[place]) {
      return { coordinates: coordinatesCache[place].coordinates, cached: true };
    }

    // Clean up the location string - remove common problematic parts
    const cleanPlace = place.trim();

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cleanPlace + ", Polska"
    )}&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AutoSniper" },
    });

    const json = (await res.json()) as { lat: string; lon: string }[];

    // Check if we got any results
    if (!json || json.length === 0) {
      console.log(`No coordinates found for location: ${place} (cleaned to: ${cleanPlace})`);
      // Return null to indicate no coordinates found
      return { coordinates: null, cached: false };
    }

    const coords: Coordinates = {
      lat: parseFloat(json[0].lat),
      lon: parseFloat(json[0].lon),
    };

    // Update in-memory cache
    coordinatesCache[place] = { coordinates: coords };

    // Save cache to disk
    await saveCache();

    return { coordinates: coords, cached: false };
  } catch (error) {
    console.error(`Error getting coordinates for location: ${place}`, error);
    // Return null on error
    return { coordinates: null, cached: false };
  }
}

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getDistanceFromNameAndCoordinates(
  location: string,
  targetCoordinates: Coordinates
): Promise<{ distance: number | null; cashed: boolean }> {
  const data = await getCoords(location);

  const coordinates = data.coordinates;

  if (coordinates == null) {
    return { distance: null, cashed: data.cached };
  }

  const distance = getDistanceKm(targetCoordinates.lat, targetCoordinates.lon, coordinates.lat, coordinates.lon);
  return { distance, cashed: data.cached };
}
