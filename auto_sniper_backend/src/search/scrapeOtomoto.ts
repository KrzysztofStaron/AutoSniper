import { Browser } from "puppeteer";

import { Page } from "puppeteer";
import { listing, partialListing, searchQuery } from "../types";
import { parseMileage } from "../utils/parsers/mileageParser";
import { parsePrice } from "../utils/parsers/priceParser";
import { configurePage } from "../deep-search/otomoto";

// Helper function to scrape a single page on Otomoto
async function scrapeOtomotoPage(browser: Browser, baseUrl: string, pageNum: number): Promise<partialListing[]> {
  let newPage: Page | null = null;
  try {
    newPage = await browser.newPage();
    if (!newPage) {
      console.error(`Failed to create new page for Otomoto page ${pageNum}`);
      return [];
    }

    // Configure page for stealth
    await configurePage(newPage);

    const pageUrl = `${baseUrl}?page=${pageNum}`;
    console.log(`Otomoto: ${pageUrl}`);

    await newPage.goto(pageUrl, {
      waitUntil: "networkidle0",
    });

    // Wait for listings container (keeping original selector)
    await newPage.waitForSelector('div[data-testid="search-results"]');

    // Get all listings from the current page (keeping original selectors)
    const listingsData = await newPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll("article.ooa-16cop2i"));
      return items.map(item => {
        // Explicit return type
        const titleElement = item.querySelector("h2 a");
        const title = titleElement?.textContent?.trim() || "";
        // Cast to HTMLAnchorElement to access href safely
        const link = (titleElement as HTMLAnchorElement)?.href || "";

        const priceElement = item.querySelector("h3");
        const thumbnail = item.querySelector("img")!.src;

        const dirtyPrice = priceElement?.textContent?.trim() || "";

        // Location is usually the first <p> inside the second <dd> of the second <dl>
        const locationElement = item.querySelector("dl.ooa-1o0axny dd p");
        let location = locationElement?.textContent?.trim().split("-")[0] || "";

        const mileageElement = item.querySelector(`dd[data-parameter="mileage"]`);
        const mileageText = mileageElement?.textContent || "";
        const yearText = item.querySelector(`dd[data-parameter="year"]`)?.textContent?.trim() || null;

        return {
          title,
          dirtyPrice,
          location,
          link,
          mileageText,
          yearText,
          thumbnail,
        };
      });
    });

    await newPage.close();

    // Process the data outside of evaluate
    const listingPromises = listingsData.map(async (data): Promise<partialListing | null> => {
      const mileage = await parseMileage(data.mileageText);
      const price = await parsePrice(data.dirtyPrice);

      // Return null if critical data is missing
      if (price === null || mileage === null || !data.yearText) {
        return null;
      }

      return {
        car: {
          year: parseInt(data.yearText),
          mileage: mileage,
        },
        metadata: {
          title: data.title,
          price: price,
          location: data.location,
          link: data.link,
          platform: "otomoto",
          image: data.thumbnail,
        },
      };
    });

    const listingsWithNulls = await Promise.all(listingPromises);
    // Filter out null results to ensure type safety
    const listings: partialListing[] = listingsWithNulls.filter(
      (listing): listing is partialListing => listing !== null
    );

    console.log(`Otomoto ${pageNum} has ${listings.length} listings`);
    return listings;
  } catch (error) {
    console.error(`Error scraping Otomoto page ${pageNum}:`, error);
    if (newPage) {
      await newPage.close();
    }
    return [];
  }
}

/**  Unverified brand and model */
export async function searchOtomoto(
  browser: Browser,
  car: searchQuery,
  maxPages = Infinity
): Promise<partialListing[]> {
  const page = await browser.newPage();

  // Configure page for stealth
  await configurePage(page);

  const link = `https://www.otomoto.pl/osobowe/${car.brand.toLowerCase()}/${car.model.toLowerCase()}/od-${car.year}`;

  console.log(`Otomoto: ${link}`);

  await page.goto(link, {
    waitUntil: "networkidle0",
  });

  // Wait for potential redirect and handle it
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Check if we were redirected and handle accordingly
  const currentUrl = page.url();
  if (currentUrl !== link) {
    console.log(`Otomoto redirected from ${link} to ${currentUrl}`);

    // If redirected to a different page, try to navigate back or handle the redirect
    if (currentUrl.includes("otomoto.pl") && !currentUrl.includes("osobowe")) {
      console.log("Redirected to non-car listing page, attempting to navigate back");
      await page.goto(link, {
        waitUntil: "networkidle0",
      });
    }
  }

  if (page.url() !== link) {
    await page.goto(link, {
      waitUntil: "networkidle0",
    });
  }

  // Get all pagination items (keeping original selector)
  const paginationItem = await page.$(".ooa-1vdlgt7");
  let maxPage = 1;

  if (paginationItem) {
    // Extract page numbers and find the maximum
    for (const item of await paginationItem.$$("li")) {
      const text = await page.evaluate(el => el.textContent, item);
      const pageNum = parseInt(text || "1");
      if (!isNaN(pageNum) && pageNum > maxPage) {
        maxPage = pageNum;
      }
    }
  }

  await page.close();

  console.log(`Otomoto ${car.brand} ${car.model} ${car.year} has ${maxPage} pages`);

  maxPage = Math.min(maxPage, maxPages);

  // Create an array of promises for scraping each page
  const scrapePromises = [];
  const batchSize = 10; // Reduced batch size to be more gentle
  for (let i = 1; i <= maxPage; i += batchSize) {
    const batch = [];

    for (let j = i; j < i + batchSize && j <= maxPage; j++) {
      batch.push(scrapeOtomotoPage(browser, link, j));
    }

    // Execute batch and add results to scrapePromises
    const batchResults = await Promise.all(batch);
    scrapePromises.push(...batchResults);
  }

  // Flatten the array of arrays into a single list of listings
  let partialListings: partialListing[] = scrapePromises.flat();

  console.log(`Otomoto ${car.brand} ${car.model} ${car.year} has ${partialListings.length} listings`);

  return partialListings;
}
