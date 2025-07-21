import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";

export async function setupBrowser(): Promise<Browser> {
  // Check if running in production/server environment
  const isProduction = process.env.NODE_ENV === "production";

  const options: any = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      // Additional args for server environment
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
    timeout: 1200000,
    protocolTimeout: 120000,
  };

  // Use system Chromium if available in production
  if (isProduction) {
    try {
      const { execSync } = require("child_process");
      const chromiumPath = execSync("which chromium-browser").toString().trim();
      if (chromiumPath) {
        options.executablePath = chromiumPath;
      }
    } catch (error) {
      // Chromium not found, will use bundled Chrome
    }
  }

  return await puppeteer.launch(options);
}

export async function setupPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );

  return page;
}

export function addRandomDelay(): Promise<void> {
  return new Promise(r => setTimeout(r, Math.random() * 1000 + 1000));
}
