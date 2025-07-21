"use server";

import { SearchPlatform, LocationData } from "@/lib/types";

interface SearchQuery {
  brand: string;
  model: string;
  year: number;
  maxPrice?: number;
  location: LocationData;
  description_forlooks: string | null;
  description_fordescription: string | null;
  description_forgovdata: string | null;
}

interface SearchRequest {
  query: SearchQuery;
  platform: SearchPlatform;
  userEmail: string;
}

export async function submitSearch(requestData: SearchRequest) {
  try {
    console.log("Sending request:", requestData);

    const response = await fetch("http://109.199.102.132:5000/queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Queue response:", result);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
