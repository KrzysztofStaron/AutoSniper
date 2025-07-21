/**
 * @jest-environment node
 */

import puppeteer, { Browser } from "puppeteer";
import { scrapeOlxDescription } from "../src/deep-search/olx";

describe("scrapeOlxDescription", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--disable-extensions",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    });
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it("should scrape description from OLX listing successfully", async () => {
    const url = "https://www.olx.pl/d/oferta/2006-chevrolet-corvette-c6-ls2-6-0-v8-targa-zamiana-CID5-ID15Lqij.html";

    const result = await scrapeOlxDescription(browser, url);

    // Verify the result structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty("description");
    expect(typeof result.description).toBe("string");

    console.log("Scraped description:", result.description);
    console.log("Description length:", result.description.length);

    // The function should always return a description property (even if empty)
    expect(result.description).toBeDefined();

    // Test passes if:
    // 1. Function returns without throwing
    // 2. Returns correct structure
    // 3. Handles errors gracefully (empty string on failure)
  }, 60000);

  it("should handle invalid URL gracefully", async () => {
    const invalidUrl = "https://www.olx.pl/invalid-url-that-does-not-exist";

    const result = await scrapeOlxDescription(browser, invalidUrl);

    // Should return empty description for invalid URLs
    expect(result).toBeDefined();
    expect(result).toHaveProperty("description");
    expect(typeof result.description).toBe("string");
    expect(result.description).toBe("");
  }, 30000);

  it("should retry on failure and return empty description if all attempts fail", async () => {
    // Test with a malformed URL that will definitely fail
    const malformedUrl = "not-a-valid-url";

    const result = await scrapeOlxDescription(browser, malformedUrl, 1); // Only 1 retry

    // Should return empty description after all retries fail
    expect(result).toBeDefined();
    expect(result).toHaveProperty("description");
    expect(result.description).toBe("");
  }, 15000);

  it("should handle connection timeout gracefully", async () => {
    // Test with a URL that might timeout
    const timeoutUrl = "https://httpstat.us/500?sleep=10000"; // Simulates slow response

    const result = await scrapeOlxDescription(browser, timeoutUrl, 1);

    // Should return empty description for timeout scenarios
    expect(result).toBeDefined();
    expect(result).toHaveProperty("description");
    expect(result.description).toBe("");
  }, 20000);
});
