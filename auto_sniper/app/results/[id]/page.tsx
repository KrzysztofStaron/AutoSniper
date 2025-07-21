"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { initializeApp } from "firebase/app";
import { collection, doc, getDoc, getFirestore } from "firebase/firestore";
import SearchResults from "@/components/SearchResults";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLOgWVDbW7esSbZyuACQn5AcfeSMdD-XI",

  authDomain: "autosniper-f715f.firebaseapp.com",

  projectId: "autosniper-f715f",

  storageBucket: "autosniper-f715f.firebasestorage.app",

  messagingSenderId: "597364766186",

  appId: "1:597364766186:web:8ead796423a1a0f4f2ee93",

  measurementId: "G-JD8YK4E910",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkIfExists(id: string) {
  const searchDoc = await getDoc(doc(db, "queueJobs", id));
  return searchDoc.exists();
}

interface SearchData {
  id: string;
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
  userEmail: string;
  status: string;
  createdAt: any;
  results?: {
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
    listings: any[];
    timestamp: string;
  };
  completedAt?: any;
  error?: string;
}

export default function Page() {
  const params = useParams();
  const id = params.id as string;
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    checkIfExists(id).then(exists => {
      setExists(exists);
    });

    async function fetchSearchResults() {
      if (!id) {
        console.error("No search ID provided");
        setError("No search ID provided");
        setLoading(false);
        return;
      }

      console.log("Fetching search results for ID:", id);

      try {
        console.log("Attempting to connect to Firestore...");
        console.log("Firebase config:", firebaseConfig);

        // Test Firebase connection first
        console.log("Testing Firestore connection...");
        const testDoc = doc(db, "test", "connection");
        console.log("Firestore instance created successfully");

        const searchDoc = await getDoc(doc(db, "searches", id));

        console.log("Document exists:", searchDoc.exists());

        if (!searchDoc.exists()) {
          console.error("Search document not found for ID:", id);
          setError("Search results not found");
          setLoading(false);
          return;
        }

        const data = searchDoc.data() as SearchData;
        console.log("Retrieved search data:", data);
        console.log("Search status:", data.status);
        console.log("Has results:", !!data.results);

        // Check if the data structure is different (direct results array vs results object)
        if (data.results && Array.isArray(data.results)) {
          console.log("Found direct results array, transforming data structure...");
          // Transform the data to match SearchResults component expectations
          const transformedData = {
            success: true,
            query: data.query,
            platform: data.platform,
            totalListings: data.results.length,
            listings: data.results,
            timestamp: data.completedAt
              ? new Date(data.completedAt.seconds * 1000).toISOString()
              : new Date().toISOString(),
          };

          console.log("Transformed data:", transformedData);
          setSearchData({
            ...data,
            results: transformedData,
          });
        } else if (data.results && typeof data.results === "object" && data.results.success !== undefined) {
          console.log("Found structured results object");
          setSearchData(data);
        } else {
          console.error("Unexpected data structure:", data);
          setError("Invalid data structure received");
        }

        if (data.status === "failed") {
          console.error("Search failed with error:", data.error);
          setError(data.error || "Search failed");
        }
      } catch (err) {
        console.error("Error fetching search results:", err);
        console.error("Error details:", {
          name: (err as Error).name,
          message: (err as Error).message,
          stack: (err as Error).stack,
        });

        // Check if it's a Firebase-specific error
        if ((err as any).code) {
          console.error("Firebase error code:", (err as any).code);
        }

        setError(`Failed to load search results. Error: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchSearchResults();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-4 sm:mt-8 px-4 sm:px-6">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">Loading search results...</h3>
          <p className="text-sm sm:text-base text-gray-500">Please wait while we fetch your results</p>
          <p className="text-xs text-gray-400 mt-2 break-all">Search ID: {id}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-4 sm:mt-8 px-4 sm:px-6">
        <div className="bg-red-50 border border-red-200 p-4 sm:p-6 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-red-700 mb-2">Error Loading Results</h3>
          <p className="text-sm sm:text-base text-red-600 mb-2">{error}</p>
          <p className="text-xs text-gray-500 break-all">Search ID: {id}</p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!searchData?.results) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-4 sm:mt-8 px-4 sm:px-6">
        <div className="bg-yellow-50 border border-yellow-200 p-4 sm:p-6 rounded-lg text-center">
          <h3 className="text-base sm:text-lg font-semibold text-yellow-700 mb-2">
            {searchData?.status === "processing" ? "Processing Search" : "No Results Available"}
          </h3>
          <p className="text-sm sm:text-base text-yellow-600 mb-2">
            {searchData?.status === "processing"
              ? "Your search is still being processed. Please check back in a few minutes."
              : "No results available yet."}
          </p>
          <p className="text-xs text-gray-500 break-all">Search ID: {id}</p>
          <p className="text-xs text-gray-500">Status: {searchData?.status || "Unknown"}</p>
          {searchData?.status === "processing" && (
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded hover:bg-yellow-700 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  console.log("Rendering SearchResults with data:", searchData.results);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        <SearchResults
          results={{
            ...searchData.results,
            listings: searchData.results.listings.sort((a, b) => b.fitness.total - a.fitness.total),
          }}
        />
      </div>
    </div>
  );
}
