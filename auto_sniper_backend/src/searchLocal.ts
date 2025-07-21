import { getFilteredListings } from "./analize/filter";
import { processData } from "./process/process";
import { runSearchesForAPI } from "./search";
import { saveSearchResults, db } from "./firestore/firebase";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const maxPages = 20;

import type { SearchPlatform } from "./search";

const request = {
  platform: "otomoto" as SearchPlatform,
  query: {
    brand: "Porsche",
    description_fordescription: "Coupe, termoizolacyjne szyby, benzyna bez hybrydy. Tylko z polskiego salonu",
    description_forgovdata: undefined,
    description_forlooks: undefined,
    location: {
      lat: 50.379001841181235,
      lon: 18.978266453131354,
    },
    maxPrice: 600000,
    model: "Cayenne",
    year: 2024,
    userEmail: "kisiel3141@gmail.com",
  },
};

const run = async () => {
  try {
    const { query, platform } = request;

    // Create cache key from query and platform
    const cacheKey = createHash("md5").update(JSON.stringify({ query, platform, maxPages })).digest("hex");

    const cacheDir = path.join(process.cwd(), "cache");
    const cacheFile = path.join(cacheDir, `search-${cacheKey}.json`);

    // Ensure cache directory exists
    await fs.mkdir(cacheDir, { recursive: true });

    let listings;

    try {
      // Check if cache exists
      const cacheData = await fs.readFile(cacheFile, "utf-8");
      const cached = JSON.parse(cacheData);

      // Check if cache is not older than 1 hour (you can adjust this)
      const cacheAge = Date.now() - cached.timestamp;
      const maxCacheAge = 60 * 60 * 1000; // 1 hour in milliseconds

      if (cacheAge < maxCacheAge) {
        console.log(`Using cached results from ${new Date(cached.timestamp).toISOString()}`);
        listings = cached.data;
      } else {
        console.log("Cache expired, fetching fresh data...");
        throw new Error("Cache expired");
      }
    } catch {
      // Cache doesn't exist or is expired, fetch fresh data
      console.log("Fetching fresh data from API...");
      listings = await runSearchesForAPI(query, platform as SearchPlatform, maxPages);

      // Save to cache
      await fs.writeFile(
        cacheFile,
        JSON.stringify(
          {
            timestamp: Date.now(),
            query,
            platform,
            data: listings,
          },
          null,
          2
        )
      );
      console.log(`Results cached to ${cacheFile}`);
    }

    // Process the data
    const processedListings = await processData(listings, query);

    // Filter the listings
    const filteredListings = await getFilteredListings(processedListings, query);

    // Create job and search IDs with testing_cayenne prefix
    const jobId = `testing_cayenne_all`;
    const searchId = `testing_cayenne_all`;

    // Helper function to recursively remove undefined values from objects
    function removeUndefinedValues(obj: any): any {
      if (obj === null || obj === undefined) {
        return null;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedValues(item));
      }

      if (typeof obj === "object") {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefinedValues(value);
          }
        }
        return cleaned;
      }

      return obj;
    }

    // Clean the query to remove undefined values
    const cleanedQuery = removeUndefinedValues(query);

    // Create job entry in queueJobs collection
    const job = {
      id: jobId,
      searchId,
      query: cleanedQuery,
      platform,
      userEmail: query.userEmail,
      status: "completed",
      createdAt: new Date(),
    };

    await db.collection("queueJobs").doc(jobId).set(job);

    // Create search entry in searches collection
    await db.collection("searches").doc(searchId).set({
      id: searchId,
      query: cleanedQuery,
      platform,
      userEmail: query.userEmail,
      status: "testing",
      createdAt: new Date(),
    });

    // Save results using the existing saveSearchResults function
    await saveSearchResults(searchId, filteredListings);

    console.log(`Saved ${filteredListings.length} filtered listings to searches/${searchId} with job ${jobId}`);
  } catch (error) {
    console.error(`Job  failed:`, error);
  }
};

run();
