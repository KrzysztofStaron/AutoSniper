import { setupBrowser, setupPage } from "../utils/puppeteer";

type CarHistory = {
  // parsed
  technicalData: {
    engineCapacity: string;
    enginePower: string;
    euroNorm: string;
    fuelType: string;
    totalSeats: number;
    seatingCapacity: number;
    vehicleWeight: string;
    maxLoad: string;
    totalMass: string;
    axlesCount: number;
    maxAxlePressure: string;
  };
  eventSummary: {
    ownersCount: number;
    coOwnersCount: number;
    registrationProvince: string;
    currentInsurance: {
      status: string;
      expirationDate: string;
    };
    currentTechnicalInspection: {
      status: string;
      lastOdometerReading: string;
    };
  };

  // TODO
  documents: {
    documentType: string;
    documentIssueDate: string;
    documentStatus: string;
  };
  productionYear: number;
  firstRegistrationDate: string;
  firstOwnerInPoland: {
    date: string;
    ownerType: string;
  };
  registrationChanges: {
    date: string;
    province: string;
  };
  firstPolandRegistration: {
    date: string;
    nextTechnicalInspection: string;
    technicalInspectionStatus: {
      date: string;
      result: string;
      skpNumber: string;
      odometerReading: string;
    };
  };
};

function parseTechnicalData(text: string) {
  const technicalData = {
    engineCapacity: "",
    enginePower: "",
    euroNorm: "",
    fuelType: "",
    totalSeats: 0,
    seatingCapacity: 0,
    vehicleWeight: "",
    maxLoad: "",
    totalMass: "",
    axlesCount: 0,
    maxAxlePressure: "",
  };

  const engineCapacityMatch = text.match(/Pojemność silnika:\s*([^M]*?)(?=Moc silnika|$)/);
  if (engineCapacityMatch) {
    technicalData.engineCapacity = engineCapacityMatch[1].trim();
  }

  const enginePowerMatch = text.match(/Moc silnika:\s*([^N]*?)(?=Norma euro|$)/);
  if (enginePowerMatch) {
    technicalData.enginePower = enginePowerMatch[1].trim();
  }

  const euroNormMatch = text.match(/Norma euro:\s*([^P]*?)(?=Paliwo|$)/);
  if (euroNormMatch) {
    technicalData.euroNorm = euroNormMatch[1].trim();
  }

  const fuelTypeMatch = text.match(/Paliwo:\s*([^L]*?)(?=Liczba miejsc ogółem|$)/);
  if (fuelTypeMatch) {
    technicalData.fuelType = fuelTypeMatch[1].trim();
  }

  const totalSeatsMatch = text.match(/Liczba miejsc ogółem:\s*(\d+)/);
  if (totalSeatsMatch) {
    technicalData.totalSeats = parseInt(totalSeatsMatch[1]);
  }

  const seatingCapacityMatch = text.match(/Liczba miejsc siedzących:\s*(\d+)/);
  if (seatingCapacityMatch) {
    technicalData.seatingCapacity = parseInt(seatingCapacityMatch[1]);
  }

  const vehicleWeightMatch = text.match(/Masa własna pojazdu:\s*([^D]*?)(?=Dopuszczalna ładowność|$)/);
  if (vehicleWeightMatch) {
    technicalData.vehicleWeight = vehicleWeightMatch[1].trim();
  }

  const maxLoadMatch = text.match(/Dopuszczalna ładowność:\s*([^D]*?)(?=Dopuszczalna masa całkowita|$)/);
  if (maxLoadMatch) {
    technicalData.maxLoad = maxLoadMatch[1].trim();
  }

  const totalMassMatch = text.match(/Dopuszczalna masa całkowita:\s*([^L]*?)(?=Liczba osi|$)/);
  if (totalMassMatch) {
    technicalData.totalMass = totalMassMatch[1].trim();
  }

  const axlesCountMatch = text.match(/Liczba osi:\s*(\d+)/);
  if (axlesCountMatch) {
    technicalData.axlesCount = parseInt(axlesCountMatch[1]);
  }

  const maxAxlePressureMatch = text.match(/Największy dopuszczalny nacisk osi:\s*([^D]*?)(?=Dokumenty|$)/);
  if (maxAxlePressureMatch) {
    technicalData.maxAxlePressure = maxAxlePressureMatch[1].trim();
  }

  return technicalData;
}

function parseEventSummary(text: string) {
  const eventSummary = {
    ownersCount: 0,
    coOwnersCount: 0,
    registrationProvince: "",
    currentInsurance: {
      status: "",
      expirationDate: "",
    },
    currentTechnicalInspection: {
      status: "",
      lastOdometerReading: "",
    },
    currentOwnersCount: 0,
    currentCoOwnersCount: 0,
  };

  const ownersMatch = text.match(/Właściciele[^:]*:\s*(\d+)/);
  if (ownersMatch) {
    eventSummary.ownersCount = parseInt(ownersMatch[1]);
  }

  const coOwnersMatch = text.match(/Współwłaściciele[^:]*:\s*(\d+)/);
  if (coOwnersMatch) {
    eventSummary.coOwnersCount = parseInt(coOwnersMatch[1]);
  }

  const provinceMatch = text.match(/Województwo[^:]*:\s*([^P]*?)(?=Polisa|$)/);
  if (provinceMatch) {
    eventSummary.registrationProvince = provinceMatch[1].trim();
  }

  const insuranceStatusMatch = text.match(/Polisa OC:\s*([^D]*?)(?=Data ważności|$)/);
  if (insuranceStatusMatch) {
    eventSummary.currentInsurance.status = insuranceStatusMatch[1].trim();
  }

  const insuranceExpirationMatch = text.match(/Data ważności polisy:\s*([^B]*?)(?=Badanie|$)/);
  if (insuranceExpirationMatch) {
    eventSummary.currentInsurance.expirationDate = insuranceExpirationMatch[1].trim();
  }

  const technicalInspectionMatch = text.match(/Badanie techniczne:\s*([^O]*?)(?=Ostatni|$)/);
  if (technicalInspectionMatch) {
    eventSummary.currentTechnicalInspection.status = technicalInspectionMatch[1].trim();
  }

  const odometerMatch = text.match(/Ostatni stan licznika:\s*([^L]+?)(?=Liczba|$)/);
  if (odometerMatch) {
    eventSummary.currentTechnicalInspection.lastOdometerReading = odometerMatch[1].trim();
  }

  const currentOwnersMatch = text.match(/Liczba aktualnych właścicieli:\s*(\d+)/);
  if (currentOwnersMatch) {
    eventSummary.currentOwnersCount = parseInt(currentOwnersMatch[1]);
  }

  const currentCoOwnersMatch = text.match(/Liczba aktualnych współwłaścicieli:\s*(\d+)/);
  if (currentCoOwnersMatch) {
    eventSummary.currentCoOwnersCount = parseInt(currentCoOwnersMatch[1]);
  }

  return eventSummary;
}

export async function getCarHistory(
  plate: string,
  vin: string,
  firstRegistration: string
): Promise<Partial<CarHistory>> {
  const browser = await setupBrowser();
  const page = await setupPage(browser);

  await page.goto("https://moj.gov.pl/nforms/engine/ng/index?xFormsAppName=HistoriaPojazdu");

  await page.waitForSelector("#registrationNumber");

  await page.type("#registrationNumber", plate);
  await page.type("#VINNumber", vin);
  await page.type("#firstRegistrationDate", firstRegistration);

  await page.click(".nforms-button");

  await page.waitForSelector("#mat-tab-label-0-0");
  const carInfo = await page.$eval("div.ng-tns-c75-5", el => el.textContent);

  const technicalData = parseTechnicalData(carInfo || "");

  await page.click("#mat-tab-label-0-1");
  await new Promise(resolve => setTimeout(resolve, 500));

  const timelineSummary = await page.$eval("section.nforms-section:nth-child(2)", el => el.textContent);

  await page.click("#mat-tab-label-0-2");
  await page.click("#mat-tab-label-1-0");
  await new Promise(resolve => setTimeout(resolve, 500));

  const risksCarfax = await page.$eval(
    "app-carfax-data.ng-star-inserted > app-foreign-service:nth-child(1) > div:nth-child(1)",
    el => el.textContent
  );

  await browser.close();

  const eventSummary = parseEventSummary(timelineSummary || "");

  return {
    technicalData,
    eventSummary,
  };
}
