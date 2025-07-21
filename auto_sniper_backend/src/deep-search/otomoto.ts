import { Browser, Page } from "puppeteer";
import { setupPage, addRandomDelay } from "../utils/puppeteer";
import { parseDateString } from "../utils/parsers/yearParser";

export async function configurePage(page: Page): Promise<void> {
  // Set a realistic user agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  // Set viewport to common resolution
  await page.setViewport({ width: 1366, height: 768 });

  // Set extra headers - removed problematic headers
  await page.setExtraHTTPHeaders({
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    DNT: "1",
    Connection: "keep-alive",
    "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
  });

  // Override the navigator properties
  await page.evaluateOnNewDocument(() => {
    // Override webdriver
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    // Mock languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["pl-PL", "pl", "en-US", "en"],
    });

    // Mock plugins
    Object.defineProperty(navigator, "plugins", {
      get: () => {
        const plugins = [
          {
            name: "Chrome PDF Plugin",
            filename: "internal-pdf-viewer",
            description: "Portable Document Format",
          },
          {
            name: "Chrome PDF Viewer",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            description: "Portable Document Format",
          },
          {
            name: "Native Client",
            filename: "internal-nacl-plugin",
            description: "Native Client Executable",
          },
        ];
        return plugins;
      },
    });

    // Mock hardware concurrency
    Object.defineProperty(navigator, "hardwareConcurrency", {
      get: () => 8,
    });

    // Mock device memory
    Object.defineProperty(navigator, "deviceMemory", {
      get: () => 8,
    });

    // Mock platform
    Object.defineProperty(navigator, "platform", {
      get: () => "Win32",
    });

    // Mock vendor
    Object.defineProperty(navigator, "vendor", {
      get: () => "Google Inc.",
    });

    // Mock screen properties
    Object.defineProperty(screen, "colorDepth", {
      get: () => 24,
    });

    // Add Chrome-specific properties
    (window as any).chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    };

    // Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
            name: parameters.name,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
          } as PermissionStatus)
        : originalQuery(parameters);

    // Mock cookie handling
    Object.defineProperty(document, "cookie", {
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    });
  });

  // Enable JavaScript
  await page.setJavaScriptEnabled(true);

  // Set default timeout
  page.setDefaultTimeout(60000);

  // Set request interception to handle CORS
  await page.setRequestInterception(true);
  page.on("request", request => {
    const headers = request.headers();
    // Remove problematic headers
    delete headers["upgrade-insecure-requests"];
    request.continue({ headers });
  });
}

export async function scrapeOtomotoDescription(browser: Browser, url: string, maxRetries: number = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let page;
    try {
      page = await setupPage(browser);
      await configurePage(page);

      // Set cookies before navigation
      await page.setCookie({
        name: "onetrust-accept",
        value: "true",
        domain: ".otomoto.pl",
        path: "/",
      });

      await page.goto(url, {
        waitUntil: "networkidle0",
      });

      // Wait for the main content to load
      try {
        await page.waitForSelector('[data-testid="main-details-section"]');
      } catch (error) {
        console.log("Error waiting for main details section:", error);
      }

      // Accept cookies if the button exists
      const acceptButton = await page.$("#onetrust-accept-btn-handler");
      if (acceptButton) {
        await acceptButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cookie acceptance to take effect
      }

      try {
        await page.waitForSelector('[data-testid="main-details-section"]');
      } catch (error) {
        console.log("Error even after waiting:", error);
      }

      // Extract car details in a structured format
      const carDetails = await page.evaluate(() => {
        const details = document.querySelector('[data-testid="main-details-section"]');
        const detailElements = details?.querySelectorAll('[data-testid="detail"]');

        const detailsMap: Record<string, string> = {};

        detailElements?.forEach(element => {
          const label = element.querySelector(".ez0zock3")?.textContent?.trim();
          const value = element.querySelector(".ez0zock2")?.textContent?.trim();
          if (label && value) {
            detailsMap[label] = value;
          }
        });

        return detailsMap;
      });

      // Extract the actual description text from the listing
      const descriptionText = await page.evaluate(() => {
        // Look for the description section
        const descriptionSection = document.querySelector('[data-testid="content-description-section"]');
        if (descriptionSection) {
          // Find the description content inside
          const descriptionDiv = descriptionSection.querySelector(".ooa-unlmzs.e11t9j224");
          if (descriptionDiv) {
            return descriptionDiv.textContent?.trim() || "";
          }
        }

        // Fallback selectors
        const descriptionSelectors = [
          '[data-testid="description"]',
          ".offer-description",
          ".description",
          ".description-text",
          ".description-content",
        ];

        for (const selector of descriptionSelectors) {
          const element = document.querySelector(selector);
          if (element?.textContent?.trim()) {
            return element.textContent.trim();
          }
        }
        return "";
      });

      // Extract seller information
      const sellerInfo = await page.evaluate(() => {
        try {
          // Look for the seller section
          const sellerSection = document.querySelector('[data-testid="content-seller-area-section"]');
          if (sellerSection) {
            // Get seller name
            const sellerName = sellerSection.querySelector(".e7ttpes2")?.textContent?.trim() || "";
            // Get seller type (e.g., "Firma")
            const sellerType = sellerSection.querySelector(".eme06u1 p")?.textContent?.trim() || "";
            return [sellerName, sellerType].filter(Boolean).join(" - ");
          }

          // Fallback
          const sellerElement =
            document.querySelector('[data-testid="seller-info"]') ||
            document.querySelector(".seller-info") ||
            document.querySelector(".dealer-info");
          return sellerElement?.textContent?.trim() || "";
        } catch {
          return "";
        }
      });

      // Combine all available information into a comprehensive description
      const details = Object.entries(carDetails)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");

      const fullDescription = [details, descriptionText, sellerInfo].filter(text => text && text.trim()).join(". ");

      // Extract additional car details from the details section
      const additionalDetails = await page.evaluate(() => {
        const result: Record<string, string> = {};

        // Extract basic details
        const basicDetailsFields = [
          { testId: "make", key: "make" },
          { testId: "model", key: "model" },
          { testId: "version", key: "version" },
          { testId: "year", key: "year" },
          { testId: "mileage", key: "mileage" },
          { testId: "vin", key: "vin" },
          { testId: "color", key: "color" },
          { testId: "generation", key: "generation" },
          { testId: "date_registration", key: "date_registration" },
          { testId: "registration", key: "registration" },
        ];

        basicDetailsFields.forEach(field => {
          const element = document.querySelector(`[data-testid="${field.testId}"]`);
          if (element) {
            const value = element.querySelector(".eur4qwl9")?.textContent?.trim();
            if (value) {
              result[field.key] = value;
            }
          }
        });

        return result;
      });

      // Check if there's a VIN button to click
      let vin = additionalDetails.vin;
      if (!vin) {
        // Try to find and click the VIN reveal button
        const vinSection = await page.$('[data-testid="vin"]');
        if (vinSection) {
          const vinButton = await vinSection.$("button.ooa-1hkppo4");
          if (vinButton) {
            await vinButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Re-extract VIN after clicking
            vin = await page.evaluate(() => {
              const vinElement = document.querySelector('[data-testid="advert-vin"] p.ed2m2uu0');
              return vinElement?.textContent?.trim() || "";
            });
          }
        }
      }

      // Extract equipment/features
      const equipment = await page.evaluate(() => {
        const equipmentSection = document.querySelector('[data-testid="content-equipments-section"]');
        if (!equipmentSection) return [];

        const features: string[] = [];
        const featureElements = equipmentSection.querySelectorAll(".ooa-1k83q4c.e1jq34to2");
        featureElements.forEach(element => {
          const feature = element.querySelector(".e1jq34to3")?.textContent?.trim();
          if (feature) {
            features.push(feature);
          }
        });

        return features;
      });

      // Add equipment to description if available
      const equipmentText = equipment.length > 0 ? `Wyposażenie: ${equipment.join(", ")}` : "";

      // Combine everything into the full description
      const enhancedDescription = [
        fullDescription,
        equipmentText,
        additionalDetails.generation ? `Generacja: ${additionalDetails.generation}` : "",
        additionalDetails.color ? `Kolor: ${additionalDetails.color}` : "",
      ]
        .filter(text => text && text.trim())
        .join(". ");

      const plateNumber = ""; // Plate number doesn't seem to be in the provided HTML
      const dataOfFirstRegistration = ""; // No registration date available in current HTML structure

      // If we only have a year, we'll include it in the description instead
      const yearInfo = additionalDetails.year ? `Rok produkcji: ${additionalDetails.year}` : "";

      // Update the enhanced description to include year info
      const finalDescription = [enhancedDescription, yearInfo].filter(text => text && text.trim()).join(". ");

      console.log({
        description: finalDescription.slice(0, 50) + "..." + finalDescription.slice(-50),
        plateNumber: plateNumber,
        dataOfFirstRegistration: dataOfFirstRegistration,
        vin: vin || undefined,
      });

      return {
        description: finalDescription,
        plateNumber: plateNumber,
        dataOfFirstRegistration: dataOfFirstRegistration,
        vin: vin || undefined,
      };
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed for Otomoto description scraping:`, error);
      if (attempt === maxRetries) {
        console.error(`All attempts failed for Otomoto description: ${url}`);
        return { description: "" }; // Return empty description instead of throwing
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
    } finally {
      if (page && !page.isClosed()) {
        try {
          await page.close();
        } catch (error) {
          console.warn("Error closing page in scrapeOtomotoDescription:", error);
        }
      }
    }
  }

  return { description: "", plateNumber: "", dataOfFirstRegistration: "", vin: "" }; // Fallback return
}
