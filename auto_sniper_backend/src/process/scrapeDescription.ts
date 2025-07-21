import { Browser } from "puppeteer";
import { listing, partialListing, searchQuery } from "../types";
import { scrapeOlxDescription } from "../deep-search/olx";
import { scrapeOtomotoDescription } from "../deep-search/otomoto";
import { scrapeSamochodyDescription } from "../deep-search/samochody";
import { scrapeAutoPlacDescription } from "../deep-search/autoPlac";

/**
 * Unified description scraping function that decides which scraper to use based on the platform/URL
 */

// Add this type for internal batching
type IndexedPartialListing = partialListing & { originalIndex: number };

async function scrapeDescriptions(
  browser: Browser,
  partialListings: partialListing[]
): Promise<{ description: string; plateNumber?: string | null; dataOfFirstRegistration?: string; vin?: string }[]> {
  const descriptions: {
    description: string;
    plateNumber?: string | null;
    dataOfFirstRegistration?: string;
    vin?: string;
  }[] = Array(partialListings.length).fill({ description: "" });
  const batchSize = 4; // Batch size to avoid overwhelming servers

  // Group listings by platform
  const platformMap: { [platform: string]: IndexedPartialListing[] } = {};

  partialListings.forEach((listing, index) => {
    let platform = "unknown";

    if (listing.metadata.link.includes("olx")) {
      platform = "olx";
    } else if (listing.metadata.link.includes("otomoto")) {
      platform = "otomoto";
    } else if (listing.metadata.link.includes("samochody.pl")) {
      platform = "samochody.pl";
    } else if (listing.metadata.link.includes("autoplac")) {
      platform = "autoplac";
    }

    if (!platformMap[platform]) {
      platformMap[platform] = [];
    }
    // Use the new type for batching
    platformMap[platform].push({ ...listing, originalIndex: index });
  });

  // Define platform-specific scraper functions
  const platformScrapers: {
    [platform: string]: (
      link: string
    ) => Promise<{ description: string; plateNumber?: string; dataOfFirstRegistration?: string; vin?: string }>;
  } = {
    olx: (link: string) => scrapeOlxDescription(browser, link),
    otomoto: (link: string) => scrapeOtomotoDescription(browser, link),
    "samochody.pl": (link: string) => scrapeSamochodyDescription(browser, link),
    autoplac: (link: string) => scrapeAutoPlacDescription(browser, link),
    unknown: async () => ({ description: "" }),
  };

  // Create an array of promises for each platform
  const platformPromises = Object.entries(platformMap).map(async ([platform, listings]) => {
    const scraper = platformScrapers[platform] || platformScrapers["unknown"];

    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      // batch is now IndexedPartialListing[]
      const batchPromises = batch.map(listing => {
        return scraper(listing.metadata.link).then(result => ({
          index: listing.originalIndex,
          description: result.description,
          plateNumber: result.plateNumber,
          dataOfFirstRegistration: result.dataOfFirstRegistration,
          vin: result.vin,
        }));
      });

      try {
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ index, description, plateNumber, dataOfFirstRegistration, vin }) => {
          descriptions[index] = { description, plateNumber, dataOfFirstRegistration, vin };
        });

        console.log(
          `Processed description batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            listings.length / batchSize
          )} for platform ${platform}`
        );
      } catch (error) {
        console.error(`Error processing description batch for platform ${platform} starting at index ${i}:`, error);
        // Assign empty descriptions for failed batch
        batch.forEach(listing => {
          descriptions[listing.originalIndex] = { description: "" };
        });
      }
    }
  });

  try {
    await Promise.all(platformPromises);
  } catch (error) {
    console.error(`Error processing platforms:`, error);
  }

  // Ensure descriptions array matches partialListings length
  while (descriptions.length < partialListings.length) {
    descriptions.push({ description: "" });
  }

  return descriptions;
}

/**
 * Convert partialListings to full listings by scraping descriptions
 */
export async function convertToFullListings(
  browser: Browser,
  partialListings: partialListing[],
  query: searchQuery
): Promise<listing[]> {
  console.log(`Converting ${partialListings.length} partial listings to full listings...`);

  // Scrape descriptions
  const descriptions = await scrapeDescriptions(browser, partialListings);

  // Convert to full listings
  const finalListings: listing[] = partialListings.map((partialListing, index) => {
    const description =
      partialListing.metadata.platform === "gratka"
        ? partialListing.metadata.description || ""
        : descriptions[index]?.description || "";

    return {
      car: {
        brand: query.brand,
        model: query.model,
        year: partialListing.car.year!,
        mileage: partialListing.car.mileage!,
      },
      metadata: {
        ...partialListing.metadata,
        description,
        vin: descriptions[index]?.vin || undefined,
        plateNumber: descriptions[index]?.plateNumber || undefined,
        dataOfFirstRegistration: descriptions[index]?.dataOfFirstRegistration || undefined,
      },
    };
  });

  console.log(`Successfully converted ${finalListings.length} listings with descriptions`);
  return finalListings;
}
