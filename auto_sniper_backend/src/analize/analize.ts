import { AnalizedListing, Fitness, ProcessedListing, listing, searchQuery } from "../types";
import { calculateEnhancedDescriptionScore } from "../process/description";
import { looksMatch } from "../process/looks";
import { analyzeHistoryQuality, analyzeGovDataMatch } from "../process/analyzeHistory";
import { getCarHistory } from "../process/history";

type limits = {
  maxPrice: number;
  minPrice: number;
  maxMileage: number;
  minMileage: number;
  maxDistance: number;
  minDistance: number;
  maxYear: number;
  minYear: number;
};

type FitnessWeights = {
  price: number;
  mileage: number;
  distance: number;
  year: number;
  looks: number;
  description: number;
  govDataMatch: number;
  historyQuality: number;
  language: number;
};

type NormalizedWeights = {
  price: number;
  mileage: number;
  distance: number;
  year: number;
  looks: number;
  description: number;
  govDataMatch: number;
  historyQuality: number;
  language: number;
};

// Default weights - these can be any positive numbers, they'll be normalized automatically
const DEFAULT_WEIGHTS: FitnessWeights = {
  price: 5,
  mileage: 2,
  distance: 1,
  year: 4,
  looks: 6,
  description: 5,
  govDataMatch: 4,
  historyQuality: 5,
  language: 10,
};

// Normalize weights so they work proportionally regardless of their sum
function normalizeWeights(weights: FitnessWeights): NormalizedWeights {
  const totalWeight =
    weights.price +
    weights.mileage +
    weights.distance +
    weights.year +
    weights.looks +
    weights.description +
    weights.govDataMatch +
    weights.historyQuality;

  if (totalWeight === 0) {
    throw new Error("All weights cannot be zero");
  }

  return {
    price: weights.price / totalWeight,
    mileage: weights.mileage / totalWeight,
    distance: weights.distance / totalWeight,
    year: weights.year / totalWeight,
    looks: weights.looks / totalWeight,
    description: weights.description / totalWeight,
    govDataMatch: weights.govDataMatch / totalWeight,
    historyQuality: weights.historyQuality / totalWeight,
    language: weights.language / totalWeight,
  };
}

// Utility function to create weights with easy-to-understand priority levels
export function createWeights(priorities: {
  price?: number;
  mileage?: number;
  distance?: number;
  year?: number;
  looks?: number;
  description?: number;
  govDataMatch?: number;
  historyQuality?: number;
  language?: number;
}): FitnessWeights {
  return {
    price: priorities.price ?? 1,
    mileage: priorities.mileage ?? 1,
    distance: priorities.distance ?? 1,
    year: priorities.year ?? 1,
    looks: priorities.looks ?? 1,
    description: priorities.description ?? 1,
    govDataMatch: priorities.govDataMatch ?? 1,
    historyQuality: priorities.historyQuality ?? 1,
    language: priorities.language ?? 1,
  };
}

export function getLimits(allListingsWithDistance: ProcessedListing[], query: searchQuery): limits {
  // query.maxPric works like a max price, but if there is good offer above that price it's still cool
  const maxPrice = query.maxPrice ? query.maxPrice : Math.max(...allListingsWithDistance.map(l => l.metadata.price));

  const minPrice = Math.min(...allListingsWithDistance.map(l => l.metadata.price));
  const maxMileage = Math.max(...allListingsWithDistance.map(l => l.car.mileage));
  const minMileage = Math.min(...allListingsWithDistance.map(l => l.car.mileage));

  const minYear = Math.min(...allListingsWithDistance.map(l => l.car.year));
  const maxYear = Math.max(...allListingsWithDistance.map(l => l.car.year));

  // Filter out null distances before calculating min/max
  const validDistances = allListingsWithDistance
    .map(l => l.processed.distance)
    .filter(distance => distance !== null) as number[];

  const maxDistance = validDistances.length > 0 ? Math.max(...validDistances) : 0;
  const minDistance = validDistances.length > 0 ? Math.min(...validDistances) : 0;

  return { maxPrice, minPrice, maxMileage, minMileage, maxDistance, minDistance, maxYear, minYear };
}

// Normalize values to 0-1 range for fair comparison
// Used for price, mileage, and distance normalization
export function minMaxScale(value: number, min: number, max: number): number {
  // Avoid division by zero if all values are the same
  if (max === min) {
    return 0;
  }
  return (value - min) / (max - min);
}

async function getFitness(
  listing: ProcessedListing,
  limits: limits,
  query: searchQuery,
  weights: FitnessWeights = DEFAULT_WEIGHTS
): Promise<Fitness> {
  // Calculate looks fitness on-demand if description_forlooks is provided
  let looksFitness: number | null = null;
  if (query.description_forlooks && listing.metadata.image) {
    try {
      const looksResult = await looksMatch(listing.metadata.image, query);
      looksFitness = looksResult.score;
    } catch (error) {
      console.error(`Error calculating looks fitness for ${listing.metadata.link}:`, error);
      looksFitness = null;
    }
  }

  const priceFitness = 1 - minMaxScale(listing.metadata.price, limits.minPrice, limits.maxPrice);
  const mileageFitness = 1 - minMaxScale(listing.car.mileage, limits.minMileage, limits.maxMileage);

  const distanceFitness =
    listing.processed.distance !== null
      ? 1 - minMaxScale(listing.processed.distance, limits.minDistance, limits.maxDistance)
      : null;

  const yearFitness =
    limits.minYear === limits.maxYear ? 1 : minMaxScale(listing.car.year, limits.minYear, limits.maxYear);

  // Calculate description fitness on-demand
  let descriptionFitness: number | null = null;
  if (query.description_fordescription && listing.metadata.description && false) {
    try {
      descriptionFitness = await calculateEnhancedDescriptionScore(
        query.description_fordescription,
        listing.metadata.description
      );
    } catch (error) {
      console.error(`Error calculating description fitness for ${listing.metadata.link}:`, error);
      descriptionFitness = null;
    }
  }

  // Calculate gov data fitness on-demand
  let govDataMatchFitness: number | null = null;
  let historyQualityFitness: number | null = null;

  // First, check if we have the required data for history lookup
  if (listing.metadata.vin && listing.metadata.plateNumber && listing.metadata.dataOfFirstRegistration) {
    try {
      // Get car history if not already present
      let carHistory = listing.processed.carHistory;

      if (carHistory == null) {
        carHistory = await getCarHistory(
          listing.metadata.plateNumber,
          listing.metadata.vin,
          listing.metadata.dataOfFirstRegistration
        );

        listing.processed.carHistory = carHistory;
      }
      if (carHistory && Object.keys(carHistory).length > 0) {
        // Calculate history quality
        historyQualityFitness = await analyzeHistoryQuality(carHistory);

        // Calculate gov data match if description provided
        if (query.description_forgovdata) {
          govDataMatchFitness = await analyzeGovDataMatch(carHistory, query.description_forgovdata);
        }
      }
    } catch (error) {
      console.error(`Error calculating gov data fitness for ${listing.metadata.link}:`, error);
      govDataMatchFitness = null;
      historyQualityFitness = null;
    }
  }

  // Get normalized weights
  const normalizedWeights = normalizeWeights(weights);

  // Calculate weighted total fitness using normalized weights
  let weightedSum = 0;
  let totalWeight = 0;

  // Price fitness (always included)
  weightedSum += priceFitness * normalizedWeights.price;
  totalWeight += normalizedWeights.price;

  // Mileage fitness (always included)
  weightedSum += mileageFitness * normalizedWeights.mileage;
  totalWeight += normalizedWeights.mileage;

  // Year fitness (always included)
  weightedSum += yearFitness * normalizedWeights.year;
  totalWeight += normalizedWeights.year;

  // Distance fitness (only if available)
  if (distanceFitness !== null) {
    weightedSum += distanceFitness * normalizedWeights.distance;
    totalWeight += normalizedWeights.distance;
  }

  // Looks fitness (only if available)
  if (looksFitness !== null) {
    weightedSum += looksFitness * normalizedWeights.looks;
    totalWeight += normalizedWeights.looks;
  }

  // Description fitness (only if available)
  if (descriptionFitness !== null) {
    weightedSum += descriptionFitness * normalizedWeights.description;
    totalWeight += normalizedWeights.description;
  }

  // Gov data match fitness (only if available)
  if (govDataMatchFitness !== null) {
    weightedSum += govDataMatchFitness * normalizedWeights.govDataMatch;
    totalWeight += normalizedWeights.govDataMatch;
  }

  // History quality fitness (only if available)
  if (historyQualityFitness !== null) {
    weightedSum += historyQualityFitness * normalizedWeights.historyQuality;
    totalWeight += normalizedWeights.historyQuality;
  }

  // Language fitness (only if available)
  if (listing.processed.language !== undefined) {
    weightedSum += listing.processed.language * normalizedWeights.language;
    totalWeight += normalizedWeights.language;
  }

  // Since we're using normalized weights, totalWeight should equal 1 (or close to it when distance is excluded)
  const totalFitness = weightedSum / totalWeight;

  return {
    price: priceFitness,
    mileage: mileageFitness,
    distance: distanceFitness,
    year: yearFitness,
    looks: looksFitness,
    description: descriptionFitness,
    govDataMatch: govDataMatchFitness,
    historyQuality: historyQualityFitness,
    language: listing.processed.language ?? null,
    total: totalFitness,
  };
}

export async function analizeListings(listings: ProcessedListing[], query: searchQuery): Promise<AnalizedListing[]> {
  const limits = getLimits(listings, query);

  console.log(limits);

  const analizedListings = await Promise.all(
    listings.map(async listing => {
      const fitness = await getFitness(listing, limits, query, DEFAULT_WEIGHTS);
      return {
        ...listing,
        fitness,
      };
    })
  );

  return analizedListings;
}
