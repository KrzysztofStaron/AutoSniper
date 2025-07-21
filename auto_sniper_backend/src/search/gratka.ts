import { Page } from "puppeteer";

import { Browser } from "puppeteer";
import { car, listing, metadata, partialListing, searchQuery } from "../types";
import { parseMileage } from "../utils/parsers/mileageParser";
import { parsePrice } from "../utils/parsers/priceParser";

/**  Unverified brand and model */
export async function searchGratka(browser: Browser, query: searchQuery, maxPages = Infinity): Promise<listing[]> {
  const page = await browser.newPage();

  const link = `https://gratka.pl/motoryzacja/osobowe/${query.brand.toLowerCase()}/${query.model.toLowerCase()}/od-${
    query.year
  }`;

  console.log(`Gratka: ${link}`);

  await page.goto(link);

  const paginationElement = await page.$("[data-analytics='paginacja']");
  let maxPage = 1;

  if (paginationElement) {
    const paginationLinks = await paginationElement.$$("a");

    for (const link of paginationLinks) {
      const linkText = await page.evaluate(element => element.textContent, link);
      const pageNum = parseInt(linkText || "1");
      if (!isNaN(pageNum) && pageNum > maxPage) {
        maxPage = pageNum;
      }
    }
  }

  await page.close();
  console.log(`Gratka ${query.brand} ${query.model} ${query.year} has ${maxPage} pages`);

  maxPage = Math.min(maxPage, maxPages);

  // Create an array of promises for scraping each page
  const scrapePromises = [];
  const batchSize = 10;
  for (let i = 1; i <= maxPage; i += batchSize) {
    const batch = [];
    for (let j = i; j < i + batchSize && j <= maxPage; j++) {
      batch.push(scrapeGratkaPage(browser, link, j));
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

  console.log(`Gratka ${query.brand} ${query.model} ${query.year} has ${finalListings.length} listings`);

  // Return the listings
  return finalListings;
}

async function scrapeGratkaPage(browser: Browser, baseUrl: string, pageNum: number): Promise<partialListing[]> {
  let newPage: Page | null = null;
  try {
    newPage = await browser.newPage();
    if (!newPage) {
      console.error(`Failed to create new page for Gratka page ${pageNum}`);
      return [];
    }

    const pageUrl = `${baseUrl}?page=${pageNum}`;
    console.log(`Gratka: ${pageUrl}`);
    await newPage.goto(pageUrl);

    const hrefs = await newPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".listing__teaserWrapper"));

      return items.map(item => item.querySelector(".teaserLink")?.getAttribute("href") || "");
    });

    // TUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUTAJ
    const listingsData = await Promise.all(
      hrefs.map(async href => {
        const listingPage = await browser.newPage();
        await listingPage.goto(href);

        let data = await listingPage.evaluate(() => {
          const title = document.querySelector(".sticker__title")?.textContent?.trim() || "";
          const priceElement = document.querySelector(".priceInfo__value");
          const dirtyPrice = priceElement?.textContent?.trim() || "";

          const locationElement = document.querySelector(".parameters__value[data-cy='offerLocation']");
          const location = locationElement?.textContent?.trim().split(",")[0] || "";

          const yearElement = document.querySelector(".parameters__value[data-cy='rok-produkcji']");
          const year = parseInt(yearElement?.textContent || "0");

          const mileageElement = document.querySelector(".parameters__value[data-cy='przebieg']");
          const dirtyMileage = mileageElement?.textContent || "";

          const imageElement = document.querySelector("#image-0 > img:nth-child(1)");
          const image = imageElement?.getAttribute("src") || "";

          const descriptionElement = document.querySelector(".description");
          const description = descriptionElement?.textContent?.trim() || "";

          return {
            title,
            dirtyPrice,
            location,
            link: window.location.href,
            year,
            dirtyMileage,
            image,
            description,
          };
        });

        await listingPage.close();
        return data;
      })
    );

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
          platform: "gratka",
          image: data.image,
          description: data.description,
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
    console.error(`Error during Gratka search on page ${pageNum}:`, error);
    if (newPage) {
      await newPage.close();
    }
    return [];
  }
}
