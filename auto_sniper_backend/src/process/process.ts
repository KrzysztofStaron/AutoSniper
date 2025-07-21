import { getDistanceFromNameAndCoordinates } from "./distance";
import { ProcessedListing, listing, searchQuery } from "../types";
import { getCarHistory } from "./history";

export async function processData(data: listing[], query: searchQuery) {
  // Merge listings in each group
  const mergedListings: listing[] = mergeListings(data);

  console.log(`Merged ${data.length} listings into ${mergedListings.length} unique listings`);

  // Process distance calculations sequentially (API limitations)
  console.log("Processing distance calculations...");
  const processedData: ProcessedListing[] = [];

  for (let i = 0; i < mergedListings.length; i++) {
    const listing = mergedListings[i];
    const distanceData = await getDistanceFromNameAndCoordinates(listing.metadata.location, query.location);

    const processed: ProcessedListing = {
      ...listing,
      processed: {
        distance: distanceData.distance,
      },
    };

    function isValidVin(vin: string): boolean {
      const exes = vin.split("").filter(n => n.toLowerCase() == "x").length;

      if (exes / vin.length > 0.5) {
        return false;
      }

      return true;
    }

    // Fetch car history if we have the required data (to cache it for analysis phase)
    if (
      listing.metadata.vin &&
      listing.metadata.plateNumber &&
      listing.metadata.dataOfFirstRegistration &&
      isValidVin(listing.metadata.vin)
    ) {
      console.log(`Fetching car history: ${i + 1}/${mergedListings.length} - ${listing.metadata.plateNumber}`);

      try {
        const carHistory = await getCarHistory(
          listing.metadata.plateNumber,
          listing.metadata.vin,
          listing.metadata.dataOfFirstRegistration
        );

        if (carHistory && Object.keys(carHistory).length > 0) {
          processed.processed.carHistory = carHistory;
        }

        // Wait between requests to avoid overwhelming gov.pl
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching car history for listing ${listing.metadata.link}:`, error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    processedData.push(processed);

    console.log(`Distance: ${i + 1}/${mergedListings.length}`);

    // Wait if API call was made (not cached)
    if (!distanceData.cashed) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }

  return processedData;
}

function normalizeLocation(location: string): string {
  // First remove parentheses and their contents
  let normalized = location.replace(/\s*\(.*?\)\s*/g, "");

  // Remove trailing commas and extra whitespace
  normalized = normalized.replace(/,\s*$/, "").trim();

  // Remove district/neighborhood info after comma (e.g., "Warszawa, Wawer" -> "Warszawa")
  normalized = normalized.split(",")[0].trim();

  return normalized;
}

function mergeListings(listings: listing[]): listing[] {
  const groupedListings = new Map<string, listing[]>();

  for (const listing of listings) {
    const normalizedLocation = normalizeLocation(listing.metadata.location);
    const key = `${listing.car.year}-${listing.car.mileage}-${listing.metadata.price}-${normalizedLocation}`;

    if (!groupedListings.has(key)) {
      groupedListings.set(key, []);
    }
    groupedListings.get(key)!.push(listing);
  }

  const mergedListings: listing[] = [];

  for (const [key, listings] of groupedListings) {
    if (listings.length === 1) {
      mergedListings.push(listings[0]);
    } else {
      // Merge multiple listings with same year, mileage, and price
      const baseListing = listings[0];

      // Deduplicate and limit the metadata to prevent excessive concatenation
      const uniquePlatforms = [...new Set(listings.map(l => l.metadata.platform))];

      const mergedListing: listing = {
        ...baseListing,
        metadata: {
          ...baseListing.metadata,
          location: normalizeLocation(baseListing.metadata.location),
          platform: uniquePlatforms.join(", "),
        },
      };
      mergedListings.push(mergedListing);
    }
  }

  return mergedListings;
}
