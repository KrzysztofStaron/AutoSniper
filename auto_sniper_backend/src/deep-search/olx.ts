import { Browser } from "puppeteer";
import { setupPage } from "../utils/puppeteer";

export async function scrapeOlxDescription(browser: Browser, url: string, maxRetries: number = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let page;
    try {
      page = await setupPage(browser);

      await page.goto(url, {
        waitUntil: "networkidle0",
      });

      const title = await page.evaluate(() => {
        return document.querySelector('[data-testid="ad_title"]')?.textContent;
      });

      const price = await page.evaluate(() => {
        return document.querySelector('[data-testid="ad-price-container"]')?.textContent;
      });

      const details = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="ad-parameters-container"]');
        if (!container) {
          return "";
        }

        const nodes = Array.from(container.querySelectorAll("p"));
        if (!nodes || nodes.length === 0) {
          return "";
        }

        const detailsMap: Record<string, string> = {};

        nodes.forEach(node => {
          if (!node.textContent) return;
          const pair = node.textContent.split(":");
          if (pair.length >= 2) {
            detailsMap[pair[0].trim()] = pair[1].trim();
          }
        });

        return Object.entries(detailsMap)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
      });

      const location = await page.evaluate(() => {
        return document.querySelector(".css-1q7h1ph")?.textContent;
      });

      const image = await page.evaluate(() => {
        return document.querySelector(".css-1bmvjcs")?.getAttribute("src");
      });

      const description = await page.evaluate(() => {
        return document.querySelector(".css-19duwlz")?.textContent;
      });

      return {
        description: details + (description || ""),
      };
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed for OLX description scraping:`, error);
      if (attempt === maxRetries) {
        console.error(`All attempts failed for OLX description: ${url}`);
        return { description: "" }; // Return empty description instead of throwing
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    } finally {
      if (page && !page.isClosed()) {
        try {
          await page.close();
        } catch (error) {
          console.warn("Error closing page in scrapeOlxDescription:", error);
        }
      }
    }
  }

  return { description: "" }; // Fallback return
}
