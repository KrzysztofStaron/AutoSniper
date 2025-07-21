import { Browser, Page } from "puppeteer";
import { car, listing, partialListing, searchQuery } from "../types";
import { setupBrowser, setupPage } from "../utils/puppeteer";
import { parseMileage } from "../utils/parsers/mileageParser";
import { parsePrice } from "../utils/parsers/priceParser";

interface RawListingData {
  title: string;
  dirtyPrice: string;
  location: string;
  link: string;
  year: number;
  dirtyMileage: string;
  image: string;
}

export async function searchSamochody(browser: Browser, query: searchQuery, maxPages = Infinity): Promise<listing[]> {
  const page = await setupPage(browser);

  const baseUrl = `https://samochody.pl/samochody-osobowe/${query.brand}/${query.model}?rocznik-od=${query.year}`;

  await page.goto(baseUrl);

  const pagonationButtonsContainer = await page.$(".Pagination_buttons__COgfV .Pagination_center__YIgty");
  let maxPage = 1;

  if (pagonationButtonsContainer != null) {
    const pagonationButtons = await pagonationButtonsContainer.$$("a");
    for (const button of pagonationButtons) {
      const buttonText = await page.evaluate(button => button.textContent, button);
      const pageNumber = parseInt(buttonText || "1");
      if (!isNaN(pageNumber) && pageNumber > maxPage) {
        maxPage = pageNumber;
      }
    }
  }

  console.log(`Samochody.pl ${query.brand} ${query.model} ${query.year} has ${maxPage} pages`);

  maxPage = Math.min(maxPage, maxPages);

  // Create an array of promises for scraping each page
  const scrapePromises = [];
  const batchSize = 10;
  for (let i = 1; i <= maxPage; i += batchSize) {
    const batch = [];
    for (let j = i; j < i + batchSize && j <= maxPage; j++) {
      batch.push(scrapeSamochodyPage(browser, baseUrl, j));
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

  console.log(`Samochody.pl ${query.brand} ${query.model} ${query.year} has ${finalListings.length} listings`);

  return finalListings;
}

async function scrapeSamochodyPage(browser: Browser, baseUrl: string, pageNum: number): Promise<partialListing[]> {
  let newPage: Page | null = null;
  try {
    newPage = await browser.newPage();
    if (!newPage) {
      console.error(`Failed to create new page for Samochody.pl page ${pageNum}`);
      return [];
    }

    const pageUrl = pageNum > 1 ? `${baseUrl}&strona=${pageNum}` : baseUrl;
    console.log(`Samochody.pl: ${pageUrl}`);
    await newPage.goto(pageUrl, {
      waitUntil: "networkidle0",
    });

    const listingsData = await newPage.evaluate(() => {
      const items = document.querySelectorAll(".OfferListItemNew_grid-item__Qcv6M");

      return Array.from(items).map(item => {
        const titleElement = item.querySelector(".OfferListItemNew_title__6UZdH span");
        const priceElement = item.querySelector(".OfferListItemNew_price__QUyqP h4");
        const featureElements = item.querySelectorAll(".OfferFeatureGrid_grid__knu5Y span");
        const locationElement = item.querySelector(".OfferListItemNew_location__0f6cm");
        const linkElement = item.closest("a") as HTMLAnchorElement;
        const imageElement = item.querySelector("img");

        const title = titleElement?.textContent?.trim() || "";
        let price = priceElement?.textContent?.trim() || "";
        const location = locationElement?.textContent?.replace("location_on", "").trim() || "";
        const link = linkElement?.href || "";

        const year = parseInt(featureElements[0]?.textContent?.replace(/[^0-9]/g, "") || "0");
        const dirtyMileage = featureElements[3]?.textContent?.trim() || "";

        return {
          title,
          dirtyPrice: price,
          location,
          link,
          year,
          dirtyMileage,
          image: imageElement?.src || "",
        };
      });
    });

    const listingPromises = listingsData.map(async (data: RawListingData): Promise<partialListing | null> => {
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
          image: data.image,
          platform: "samochody.pl",
        },
      };
    });

    const listingsWithNulls = await Promise.all(listingPromises);
    // Filter out null results to ensure type safety
    const listings: partialListing[] = listingsWithNulls.filter(
      (listing): listing is partialListing => listing !== null
    );

    await newPage.close();
    return listings;
  } catch (error) {
    console.error(`Error during Samochody.pl search on page ${pageNum}:`, error);
    if (newPage) {
      await newPage.close();
    }
    return [];
  }
}
