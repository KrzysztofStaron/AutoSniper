import puppeteer, { Page, Browser } from "puppeteer";
import fs from "fs";

import { searchOtomoto } from "./search/scrapeOtomoto";
import { searchOlx } from "./search/olx";
import { searchSamochody } from "./search/samochody";
import { searchAutoplac } from "./search/autoplac";
import { searchGratka } from "./search/gratka";
import { searchQuery, partialListing, listing } from "./types";
import { convertToFullListings } from "./process/scrapeDescription";
import { setupBrowser } from "./utils/puppeteer";

export type SearchPlatform = "otomoto" | "olx" | "all" | "samochody" | "autoplac" | "gratka";

function getPlatformFromArgs(): SearchPlatform {
  const args = process.argv.slice(2);
  console.log(args);
  if (args.includes("--otomoto")) return "otomoto";
  if (args.includes("--olx")) return "olx";
  if (args.includes("--samochody")) return "samochody";
  if (args.includes("--autoplac")) return "autoplac";
  if (args.includes("--gratka")) return "gratka";
  return "all";
}

/**
 * Check if cached data exists for the given query and platform
 * Returns the cached data if found, null otherwise
 */
function checkCache(query: searchQuery, platform: SearchPlatform): partialListing[] | null {
  // Ensure data directory exists
  if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
    return null;
  }

  const timestamp = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
  const filename = `data/${query.brand}-${query.model}-${query.year}-${platform}-${timestamp}.json`;

  if (fs.existsSync(filename)) {
    try {
      const cachedData = fs.readFileSync(filename, "utf-8");
      const listings: partialListing[] = JSON.parse(cachedData);
      console.log(
        `Found cached data for ${query.brand} ${query.model} ${query.year} on ${platform} - ${listings.length} listings`
      );
      return listings;
    } catch (error) {
      console.error(`Error reading cached data from ${filename}:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Save data to cache with the specified filename format
 */
export function saveToCache(query: searchQuery, platform: SearchPlatform, listings: any): void {
  // Ensure data directory exists
  if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
  }

  const timestamp = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
  const filename = `data/${query.brand}-${query.model}-${query.year}-${platform}-${timestamp}.json`;

  try {
    fs.writeFileSync(filename, JSON.stringify(listings, null, 2));
    console.log(`Cached data saved to ${filename}`);
  } catch (error) {
    console.error(`Error saving cache to ${filename}:`, error);
  }
}

/**
 * Perform actual scraping operations
 */
async function performScraping(
  browser: Browser,
  query: searchQuery,
  platform: SearchPlatform,
  maxPages = Infinity
): Promise<partialListing[]> {
  let rawListings: partialListing[] = [];

  console.log(`Starting scraping on platform: ${platform}`);
  const platformsToSearch = [
    { name: "olx", searchFunction: searchOlx },
    { name: "otomoto", searchFunction: searchOtomoto },
    { name: "samochody", searchFunction: searchSamochody },
    { name: "autoplac", searchFunction: searchAutoplac },
    { name: "gratka", searchFunction: searchGratka },
  ];

  const searchPromises = platformsToSearch
    .filter(platformObj => platform === "all" || platformObj.name === platform)
    .map(async platformObj => {
      const result = await platformObj.searchFunction(browser, query, maxPages);

      // Convert listing[] to partialListing[] if needed
      if (result.length > 0 && "metadata" in result[0] && "description" in (result[0] as any).metadata) {
        // This is a listing[], convert to partialListing[]
        const listings = result as listing[];
        return listings.map(
          (listing: listing): partialListing => ({
            car: {
              year: listing.car.year,
              mileage: listing.car.mileage,
            },
            metadata: {
              title: listing.metadata.title,
              price: listing.metadata.price,
              location: listing.metadata.location,
              link: listing.metadata.link,
              negotiable: listing.metadata.negotiable,
              platform: listing.metadata.platform,
              image: listing.metadata.image,
              description: listing.metadata.description || "",
            },
          })
        );
      }

      // This is already partialListing[]
      return result as partialListing[];
    });

  const results = await Promise.all(searchPromises);
  results.forEach(listings => rawListings.push(...listings));

  return rawListings;
}

export async function runSearchesForAPI(
  query: searchQuery,
  platform: SearchPlatform = "all",
  maxPages = Infinity
): Promise<listing[]> {
  // Check cache first
  const cachedData = null; // checkCache(query, platform)

  if (cachedData) {
    console.log(`Using cached data for ${query.brand} ${query.model} ${query.year} on ${platform}`);
    return cachedData;
  }

  const browser = await setupBrowser();

  try {
    const rawListings = await performScraping(browser, query, platform, maxPages);
    console.log(`Found ${rawListings.length} partial listings`);

    const filteredListings = rawListings.filter(listing => listing.metadata.price < (query.maxPrice ?? Infinity));

    // Convert partialListings to full listings with descriptions
    const fullListings = await convertToFullListings(browser, filteredListings, query);
    console.log(`Converted to ${fullListings.length} full listings with descriptions`);

    // Save to cache
    saveToCache(query, platform, fullListings);

    return fullListings;
  } catch (error) {
    console.error("Error running searches:", error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    try {
      await browser.close();
    } catch (closeError) {
      console.warn("Error closing browser:", closeError instanceof Error ? closeError.message : String(closeError));
    }
  }
}
