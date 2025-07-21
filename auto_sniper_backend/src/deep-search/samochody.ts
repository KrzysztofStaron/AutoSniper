import { Browser } from "puppeteer";

export async function scrapeSamochodyDescription(browser: Browser, url: string) {
  console.log("scraping samochody.pl description");

  const page = await browser.newPage();
  await page.goto(url);

  await page.waitForSelector(".ColumnsCss_column__N6Apn");

  const res = await page.evaluate(() => {
    const basicInfoElement = document.querySelector(".ColumnsCss_column__N6Apn");
    const equipmentElement = document.querySelector(".OfferEquipment_wrapper__FEp4g");
    const descriptionElement = document.querySelector(".OfferDescription_inner__5SYIw");

    const basicInfo = basicInfoElement?.textContent ?? "";
    const equipment = equipmentElement?.textContent ?? "";
    const description2 = descriptionElement?.textContent ?? "";

    const finalData = basicInfo + equipment + description2;

    return {
      description: finalData,
      basicInfo: basicInfo != "",
      equipment: equipment != "",
      description2: description2 != "",
    };
  });

  console.log("samochody.pl description: ", res.basicInfo, res.equipment, res.description2);

  await page.close();

  return res;
}
