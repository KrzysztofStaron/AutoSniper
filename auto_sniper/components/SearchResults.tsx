"use client";

import { Search } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import ListingCard from "./ListingCard";

// Updated to use AnalizedListing type from backend
interface AnalizedListing {
  car: {
    brand: string;
    model: string;
    year: number;
    mileage: number;
  };
  metadata: {
    title: string;
    price: number;
    location: string;
    link: string;
    platform: string;
    image?: string;
  };
  processed: {
    distance: number | null;
  };
  fitness: {
    price: number;
    mileage: number;
    distance: number | null;
    year: number | null;
    looks: number | null;
    description: number | null;
    govDataMatch: number | null;
    historyQuality: number | null;
    total: number;
  };
}

interface SearchResultsData {
  success: boolean;
  query: {
    brand: string;
    model: string;
    year: number;
    location: {
      lat: number;
      lon: number;
    };
  };
  platform: string;
  totalListings: number;
  listings: AnalizedListing[];
  timestamp: string;
}

interface SearchResultsProps {
  results: SearchResultsData;
}

export default function SearchResults({ results }: SearchResultsProps) {
  const { t } = useLanguage();

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlatformName = (platform: string) => {
    const platforms: Record<string, string> = {
      otomoto: "OtoMoto",
      olx: "OLX",
      samochody: "Samochody.pl",
      autoplac: "AutoPlac",
      gratka: "Gratka",
      all: t.allPlatforms,
    };
    return platforms[platform] || platform;
  };

  if (!results.success) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-red-700 mb-2">{t.searchErrorTitle}</h3>
          <p className="text-red-600">{t.searchErrorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-4 sm:mt-8 px-4 sm:px-0">
      {/* Search Summary - Simplified */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <h3 className="text-sm sm:text-base font-medium text-gray-700">
              {results.query.brand} {results.query.model} • {results.listings.length} {t.foundOffers.toLowerCase()}
            </h3>
            <span className="text-xs sm:text-sm text-gray-500">{getPlatformName(results.platform)}</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            {t.lastSearch}: {formatTimestamp(results.timestamp)}
          </div>
        </div>
      </div>

      {/* Car List */}
      {results.listings.length > 0 ? (
        <div className="space-y-3 sm:space-y-3">
          {results.listings.map((listing, index) => (
            <ListingCard key={index} listing={listing} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 sm:p-12 rounded-lg shadow-sm text-center">
          <div className="text-gray-400 mb-4">
            <Search className="h-8 w-8 sm:h-12 sm:w-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">{t.noResultsTitle}</h3>
          <p className="text-sm sm:text-base text-gray-500">{t.noResultsMessage}</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">{t.noResultsHint}</p>
        </div>
      )}

      {/* {hiddenListings.length > 0 && (
        <div className="space-y-3 sm:space-y-3 mt-40">
          <div className="bg-foreground/20 h-1 w-full"></div>
          <h3 className="text-base sm:text-2xl font-medium text-gray-700 mb-2">{t.hiddenListingsTitle}</h3>
          {hiddenListings.map((listing, index) => (
            <ListingCard key={index} listing={listing} index={index} />
          ))}
        </div>
      )} */}
    </div>
  );
}
