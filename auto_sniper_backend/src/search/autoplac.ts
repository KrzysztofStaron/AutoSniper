import { Page } from "puppeteer";

import { Browser } from "puppeteer";
import { car, listing, metadata, partialListing, searchQuery } from "../types";
import { parseMileage } from "../utils/parsers/mileageParser";
import { parsePrice } from "../utils/parsers/priceParser";

/**  Unverified brand and model */
export async function searchAutoplac(browser: Browser, query: searchQuery, maxPages = Infinity): Promise<listing[]> {
  const page = await browser.newPage();

  let link = `https://autoplac.pl/oferty/samochody-osobowe/${query.brand.toLowerCase()}/${query.model.toLowerCase()}?yearFrom=${
    query.year
  }`;

  console.log(`Autoplac: ${link}`);

  await page.goto(link);

  const paginationList = await page.$$(".custom-paginator__link");
  let maxPage = 1;
  for (const paginationItem of paginationList) {
    const paginationItemText = await page.evaluate(element => element.textContent, paginationItem);
    const pageNum = parseInt(paginationItemText || "1");

    console.log(`Autoplac page ${pageNum}`);

    if (!isNaN(pageNum) && pageNum > maxPage) {
      maxPage = pageNum;
    }
  }

  await page.close();
  console.log(`Autoplac ${query.brand} ${query.model} ${query.year} has ${maxPage} pages`);

  maxPage = Math.min(maxPage, maxPages);

  // Create an array of promises for scraping each page
  const scrapePromises = [];
  const batchSize = 10;
  for (let i = 1; i <= maxPage; i += batchSize) {
    const batch = [];
    for (let j = i; j < i + batchSize && j <= maxPage; j++) {
      batch.push(scrapeAutoplacPage(browser, link, j));
    }
    const batchResults = await Promise.all(batch);
    scrapePromises.push(...batchResults);
  }

  // Execute all scrape promises in parallel
  const partialResults = (await Promise.all(scrapePromises)).flat();

  const finalListings: listing[] = partialResults.map(partialListing => ({
    car: {
      brand: query.brand,
      model: query.model,
      year: partialListing.car.year!,
      mileage: partialListing.car.mileage!,
    },
    metadata: partialListing.metadata,
  }));

  console.log(`Autoplac ${query.brand} ${query.model} ${query.year} has ${finalListings.length} listings`);

  // Return the listings
  return finalListings;
}

async function scrapeAutoplacPage(browser: Browser, baseUrl: string, pageNum: number): Promise<partialListing[]> {
  let newPage: Page | null = null;
  try {
    newPage = await browser.newPage();
    if (!newPage) {
      console.error(`Failed to create new page for Autoplac page ${pageNum}`);
      return [];
    }

    const pageUrl = `${baseUrl}&p=${pageNum}`;
    console.log(`Autoplac: ${pageUrl}`);
    await newPage.goto(pageUrl);

    await newPage.waitForSelector(".offer-thumbnail__image", {});

    const listingsData = await newPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll("nwa-offer-card-unified"));

      return items.map(item => {
        const title = item.querySelector(".content__name")?.textContent?.trim() || "";
        const price = item.querySelector(".price-info__main")?.textContent?.trim() || "";
        const location = item.querySelector(".localization__city")?.textContent?.trim() || "";
        const link = "https://autoplac.pl" + (item.querySelector("a")?.getAttribute("href") || "");

        // Extract year and mileage from details
        const detailSpans = Array.from(item.querySelectorAll(".details span"));
        const year = parseInt(
          detailSpans.find(span => /^\d{4}$/.test(span.textContent?.trim() || ""))?.textContent || "0"
        );
        const dirtyMileage = detailSpans.find(span => span.textContent?.includes("km"))?.textContent || "";

        const imageElement = item.querySelector(".offer-thumbnail__image");
        const image = imageElement?.getAttribute("src") || "";

        return {
          title,
          dirtyPrice: price,
          location,
          link,
          year,
          dirtyMileage,
          image,
        };
      });
    });

    await newPage.close();

    const listingPromises = listingsData.map(async (data): Promise<partialListing | null> => {
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
          platform: "autoplac",
          image: data.image,
        },
      };
    });

    const listingsWithNulls = await Promise.all(listingPromises);
    // Filter out null results to ensure type safety
    const listings: partialListing[] = listingsWithNulls.filter(
      (listing): listing is partialListing => listing !== null
    );

    return listings;
  } catch (error) {
    console.error(`Error during OLX search on page ${pageNum}:`, error);
    if (newPage) {
      await newPage.close();
    }
    return [];
  }
}
