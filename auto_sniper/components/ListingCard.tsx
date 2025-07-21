"use client";

import { ExternalLink, Calendar, Gauge, MapPin, Target, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";

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

interface ListingCardProps {
  listing: AnalizedListing;
  index: number;
}

export default function ListingCard({ listing, index }: ListingCardProps) {
  const { t } = useLanguage();
  const [expandedFitness, setExpandedFitness] = useState(false);

  const toggleFitnessBreakdown = () => {
    setExpandedFitness(prev => !prev);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pl-PL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat("pl-PL").format(mileage);
  };

  const formatDistance = (distance: number | null) => {
    if (distance === null) return "N/A";
    return `${distance.toFixed(0)} km`;
  };

  const formatFitnessScore = (score: number) => {
    return (score * 100).toFixed(0);
  };

  const getFitnessColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    if (score >= 0.4) return "text-orange-600";
    return "text-red-600";
  };

  // Updated function to use actual scraped thumbnails with fallback
  const getCarImageUrl = (listing: AnalizedListing, index: number) => {
    // Use actual scraped thumbnail if available
    if (listing.metadata.image) {
      return listing.metadata.image;
    }

    // Fallback to placeholder if no real thumbnail is available
    const seed = `${listing.car.brand}-${index}`.toLowerCase().replace(/\s+/g, "-");
    return `https://picsum.photos/seed/${seed}/400/250`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Car Image */}
        <div className="relative w-full h-48 sm:w-72 sm:h-52 flex-shrink-0">
          <Image
            src={getCarImageUrl(listing, index)}
            alt={`${listing.car.brand} ${listing.car.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 288px"
            onError={e => {
              // Fallback to placeholder if scraped image fails to load
              const target = e.target as HTMLImageElement;
              const seed = `${listing.car.brand}-${listing.car.model}-${index}`.toLowerCase().replace(/\s+/g, "-");
              target.src = `https://picsum.photos/seed/${seed}/400/250`;
            }}
          />
          {/* Platform Badge */}
          {listing.fitness.total >= 0.8 && (
            <div className="absolute top-2 left-2">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">{t.featured}</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0">
            <div className="flex-1 sm:pr-4">
              {/* Subtitle */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2 sm:line-clamp-1">{listing.metadata.title}</p>

              {/* Key Details */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{listing.car.year}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gauge className="h-4 w-4 text-gray-400" />
                  <span>{formatMileage(listing.car.mileage)} km</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm mb-3">
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{listing.metadata.location}</span>
                </div>
                {listing.processed.distance !== null && (
                  <span className="text-gray-400 text-xs sm:text-sm">
                    • {formatDistance(listing.processed.distance)}
                  </span>
                )}
              </div>
            </div>

            {/* Price Section */}
            <div className="flex justify-between items-center sm:block sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-0 sm:mb-1">
                {formatPrice(listing.metadata.price)} PLN
              </div>
              <div className="sm:flex sm:justify-end">
                <Button
                  onClick={() => window.open(listing.metadata.link, "_blank")}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 flex items-center gap-1 sm:gap-0"
                >
                  <span className="text-xs sm:hidden">View</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* Fitness Breakdown */}
          <div className="bg-gray-100 p-3 rounded-lg w-full">
            <button
              onClick={toggleFitnessBreakdown}
              className="text-xs text-gray-600 mb-2 flex items-center gap-1 w-full justify-between hover:text-gray-800 transition-colors"
            >
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {t.fitnessScoreBreakdown}
              </div>
              {expandedFitness ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {expandedFitness && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.fitnessPrice}:</span>
                    <span className={`font-medium ${getFitnessColor(listing.fitness.price)}`}>
                      {formatFitnessScore(listing.fitness.price)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.fitnessMileage}:</span>
                    <span className={`font-medium ${getFitnessColor(listing.fitness.mileage)}`}>
                      {formatFitnessScore(listing.fitness.mileage)}%
                    </span>
                  </div>
                  {listing.fitness.distance !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.fitnessDistance}:</span>
                      <span className={`font-medium ${getFitnessColor(listing.fitness.distance)}`}>
                        {formatFitnessScore(listing.fitness.distance)}%
                      </span>
                    </div>
                  )}
                  {listing.fitness.year !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.fitnessYear}:</span>
                      <span className={`font-medium ${getFitnessColor(listing.fitness.year)}`}>
                        {formatFitnessScore(listing.fitness.year)}%
                      </span>
                    </div>
                  )}
                  {listing.fitness.looks !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.fitnessLooks}:</span>
                      <span className={`font-medium ${getFitnessColor(listing.fitness.looks)}`}>
                        {formatFitnessScore(listing.fitness.looks)}%
                      </span>
                    </div>
                  )}
                  {listing.fitness.description !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.fitnessDetails}:</span>
                      <span className={`font-medium ${getFitnessColor(listing.fitness.description)}`}>
                        {formatFitnessScore(listing.fitness.description)}%
                      </span>
                    </div>
                  )}
                  {listing.fitness.govDataMatch !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.fitnessGovData}:</span>
                      <span className={`font-medium ${getFitnessColor(listing.fitness.govDataMatch)}`}>
                        {formatFitnessScore(listing.fitness.govDataMatch)}%
                      </span>
                    </div>
                  )}
                  {listing.fitness.historyQuality !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.fitnessHistory}:</span>
                      <span className={`font-medium ${getFitnessColor(listing.fitness.historyQuality)}`}>
                        {formatFitnessScore(listing.fitness.historyQuality)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-700">{t.totalScore}:</span>
                    <span className={`font-bold ${getFitnessColor(listing.fitness.total)}`}>
                      {formatFitnessScore(listing.fitness.total)}%
                    </span>
                  </div>
                </div>
              </>
            )}
            {!expandedFitness && (
              <div className="flex justify-between font-medium">
                <span className="text-gray-700">{t.totalScore}:</span>
                <span className={`font-bold ${getFitnessColor(listing.fitness.total)}`}>
                  {formatFitnessScore(listing.fitness.total)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
