import { Page } from "puppeteer";

import { Browser } from "puppeteer";
import { car, listing, metadata, partialListing, searchQuery } from "../types";
import { parseMileage } from "../utils/parsers/mileageParser";
import { parsePrice } from "../utils/parsers/priceParser";

/**  Unverified brand and model */
export async function searchOlx(browser: Browser, query: searchQuery, maxPages = Infinity): Promise<partialListing[]> {
  const page = await browser.newPage();

  try {
    const link = `https://www.olx.pl/motoryzacja/samochody/${query.brand.toLowerCase()}/q-${query.brand}-${
      query.model
    }?search[filter_float_year:from]=${query.year}`;

    // https://www.olx.pl/motoryzacja/samochody/chevrolet/q-chevrolet-corvette/?search[filter_float_year:from]=2020

    await page.goto(link, {
      waitUntil: "networkidle0",
    });

    // Wait for listings to load with better timeout handling
    try {
      await page.waitForSelector('[data-testid="listing-grid"]', {});
    } catch (error) {
      console.warn("Listing grid not found, trying alternative selector");
      // Try alternative selector or continue without waiting
    }

    const paginationList = await page.$$("li.pagination-item");
    let maxPage = 1;
    for (const paginationItem of paginationList) {
      try {
        const paginationItemText = await page.evaluate(element => element.textContent, paginationItem);
        const pageNum = parseInt(paginationItemText || "1");
        if (!isNaN(pageNum) && pageNum > maxPage) {
          maxPage = pageNum;
        }
      } catch (error) {
        // Continue if pagination item evaluation fails
        console.warn("Failed to evaluate pagination item:", error);
        continue;
      }
    }

    console.log(`OLX ${query.brand} ${query.model} ${query.year} has ${maxPage} pages`);

    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (error) {
        console.warn("Error closing main page:", error);
      }
    }

    maxPage = Math.min(maxPage, maxPages);

    // Create an array of promises for scraping each page
    const scrapePromises = [];
    const batchSize = 10; // Reduced batch size to avoid overwhelming the server
    for (let i = 1; i <= maxPage; i += batchSize) {
      const batch = [];
      for (let j = i; j < i + batchSize && j <= maxPage; j++) {
        batch.push(scrapeOlxPageWithRetry(browser, link, j));
      }
      const batchResults = await Promise.all(batch);
      scrapePromises.push(...batchResults);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize <= maxPage) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Execute all scrape promises in parallel
    const partialResults = (await Promise.all(scrapePromises)).flat();

    console.log(`OLX ${query.brand} ${query.model} ${query.year} has ${partialResults.length} listings`);

    return partialResults;
  } catch (error) {
    console.error("Error in main OLX search:", error);
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (error) {
        console.warn("Error closing main page:", error);
      }
    }

    return [];
  }
}

async function scrapeOlxPageWithRetry(
  browser: Browser,
  baseUrl: string,
  pageNum: number,
  maxRetries: number = 2
): Promise<partialListing[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await scrapeOlxPage(browser, baseUrl, pageNum);
      return result;
    } catch (error) {
      console.warn(`Attempt ${attempt}/${maxRetries} failed for OLX page ${pageNum}:`, error);
      if (attempt === maxRetries) {
        console.error(`All attempts failed for OLX page ${pageNum}`);
        return [];
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  return [];
}

async function scrapeOlxPage(browser: Browser, baseUrl: string, pageNum: number): Promise<partialListing[]> {
  let newPage: Page | null = null;
  try {
    newPage = await browser.newPage();
    if (!newPage) {
      console.error(`Failed to create new page for OLX page ${pageNum}`);
      return [];
    }

    // Set user agent to avoid detection
    await newPage.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    const pageUrl = `${baseUrl}&page=${pageNum}`;
    console.log(`OLX: ${pageUrl}`);

    await newPage.goto(pageUrl, {
      waitUntil: "networkidle0",
    });

    // Wait for listings to load with better error handling
    try {
      await newPage.waitForSelector('[data-testid="listing-grid"]', {});
    } catch (error) {
      console.warn(`Listing grid not found on page ${pageNum}, trying to continue`);
    }

    // Try to wait for images, but don't fail if they're not found
    try {
      await newPage.waitForSelector('[data-cy="l-card"] img');
    } catch (error) {
      console.warn(`Images not found on page ${pageNum}, continuing without image hover`);
    }

    // Improved image hover with better error handling
    try {
      const imageSelectors = await newPage.$$('[data-cy="l-card"] img');
      for (let i = 0; i < imageSelectors.length; i++) {
        try {
          const imageElement = imageSelectors[i];

          // Add a small delay to let the page stabilize
          await new Promise(resolve => setTimeout(resolve, 100));

          // Check if element is still attached before interacting
          const isConnected = await newPage.evaluate(el => {
            try {
              return el && el.isConnected && document.contains(el);
            } catch {
              return false;
            }
          }, imageElement);

          if (isConnected) {
            try {
              await imageElement.hover();
            } catch (hoverError) {
              // Specifically handle detached node errors
              if (hoverError instanceof Error && hoverError.message.includes("detached")) {
                // Silently skip detached nodes as this is expected behavior
                continue;
              }
              throw hoverError; // Re-throw other errors
            }
          }
        } catch (error) {
          // Only log warnings for non-detached node errors
          if (error instanceof Error && !error.message.includes("detached")) {
            console.warn(`Failed to hover over image ${i} on page ${pageNum}:`, error.message);
          }
          continue;
        }
      }
    } catch (error: unknown) {
      console.warn(`Failed to process images on page ${pageNum}:`, error);
    }

    // Extract listings data with better error handling
    const listingsData = await newPage.evaluate(() => {
      try {
        const items = Array.from(document.querySelectorAll('[data-cy="l-card"]'));

        return items
          .map(item => {
            try {
              const title = item.querySelector(".css-1g61gc2")?.textContent?.trim() || "";
              let price = item.querySelector('[data-testid="ad-price"]')?.textContent?.trim() || "";
              let negotiable = false;

              if (price.includes("do negocjacji")) {
                negotiable = true;
                price = price.replace("do negocjacji", "").trim();
              }

              const location =
                item.querySelector('[data-testid="location-date"]')?.textContent?.trim().split(" - ")[0] || "";
              const link = (item.querySelector("a") as HTMLAnchorElement)?.href || "";

              const image = item.querySelector("img")?.src || "";

              const yearMileageText = item.querySelector(".css-6as4g5")?.textContent?.trim() || "";
              const yearMileageParts = yearMileageText.split("-");
              const year = parseInt(yearMileageParts[0]?.trim() || "0");
              const dirtyMileage = yearMileageParts[1] || "";

              return {
                title,
                dirtyPrice: price,
                location,
                link,
                image,
                negotiable,
                year: isNaN(year) ? 0 : year,
                dirtyMileage,
              };
            } catch (error) {
              console.warn("Error parsing individual listing:", error);
              return null;
            }
          })
          .filter(item => item !== null);
      } catch (error) {
        console.error("Error in page evaluation:", error);
        return [];
      }
    });

    const listingPromises = listingsData.map(async (data): Promise<partialListing | null> => {
      try {
        const mileage = await parseMileage(data.dirtyMileage);
        const price = await parsePrice(data.dirtyPrice);

        // Return null if critical data is missing
        if (price === null || mileage === null || data.year === 0) {
          return null;
        }

        return {
          car: {
            year: data.year,
            mileage: mileage,
          },
          metadata: {
            title: data.title,
            price: price,
            location: data.location,
            link: data.link,
            negotiable: data.negotiable,
            platform: "olx",
            image: data.image,
          },
        };
      } catch (error) {
        console.warn("Error processing listing data:", error);
        return null;
      }
    });

    const listingsWithNulls = await Promise.all(listingPromises);
    // Filter out null results
    const validListings = listingsWithNulls.filter((listing): listing is partialListing => listing !== null);

    return validListings;
  } catch (error) {
    console.error(`Error during OLX search on page ${pageNum}:`, error);
    throw error; // Re-throw to trigger retry mechanism
  } finally {
    if (newPage && !newPage.isClosed()) {
      try {
        await newPage.close();
      } catch (error) {
        console.warn(`Error closing page ${pageNum}:`, error);
      }
    }
  }
}
