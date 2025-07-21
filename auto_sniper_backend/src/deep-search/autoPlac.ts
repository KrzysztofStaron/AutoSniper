import { Browser } from "puppeteer";

export async function scrapeAutoPlacDescription(browser: Browser, url: string) {
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  const res = await page.evaluate(() => {
    const tileWrapper = Array.from(document.querySelectorAll(".tile-wrapper")).slice(0, 3);
    const description = tileWrapper.map(tile => tile.querySelector(".tile-description")?.textContent ?? "").join("\n");

    return {
      description,
    };
  });

  await page.close();

  return res;
}
