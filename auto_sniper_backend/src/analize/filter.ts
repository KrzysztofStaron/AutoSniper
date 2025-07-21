import { OpenAI } from "openai";
import { ProcessedListing, searchQuery } from "../types";
import logger from "../utils/logger";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FilterDecision {
  showToUser: boolean;
  score: number;
  explanation: string;
  link: string;
}

/**
 * Uses GPT-4o-mini to filter processed listings based on the user's query and AutoSniper logic
 * @param processedListings Array of processed car listings
 * @param query The search query with user preferences
 * @returns Array of filter decisions for each listing
 */
export async function filterListingsWithAI(
  processedListings: ProcessedListing[],
  query: searchQuery
): Promise<FilterDecision[]> {
  // Process listings in batches to optimize API calls
  const batchSize = 5;
  const results: FilterDecision[] = [];

  for (let i = 0; i < processedListings.length; i += batchSize) {
    const batch = processedListings.slice(i, i + batchSize);
    const batchPromises = batch.map(listing => filterSingleListing(listing, query));

    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    } catch (error) {
      logger.error("Error filtering batch", {
        error,
        batchIndex: i / batchSize,
        batchSize: batch.length,
      });
      // Default to showing listings if filtering fails
      results.push(
        ...batch.map(listing => ({
          showToUser: true,
          score: 50,
          explanation: "Error during filtering - showing by default",
          link: listing.metadata.link,
        }))
      );
    }
  }

  return results;
}

/**
 * Filters a single listing using GPT-4o-mini
 */
async function filterSingleListing(listing: ProcessedListing, query: searchQuery): Promise<FilterDecision> {
  try {
    const systemPrompt = `
    You are AutoSniper, an intelligent car listing filter that helps users find the best deal for a car by automatically searching and analyzing car listings from multiple Polish car marketplaces (OLX, OtoMoto, Samochody.pl, Autoplac, Gratka).

Your role is to determine whether a car listing should be shown to the user based on their preferences and the listing's characteristics.

AutoSniper's purpose:
- Automatically search for cars across multiple platforms
- Filter out irrelevant or poor-quality listings
- Identify potentially good deals that match user preferences
- Save users time by only showing listings worth their attention

Consider these factors when deciding:
1. Price reasonableness (is it suspiciously low or overpriced?)
2. Location/distance relevance
3. Car condition indicators (mileage, year, description quality)
4. Listing quality (does it have enough information?)
5. Red flags (scam indicators, missing crucial info, inconsistencies)
6. Match with user's specific requirements
7. If user wants an 2024 car a 2025 car is a good match, but if user wants a 2025 car a 2024 car is a bad match.
8. If user wants a car with a specific engine, a car with a different engine is a bad match.
9. If user wants a car with a specific fuel type, a car with a different fuel type is a bad match.
10. If user wants a car with a specific transmission, a car with a different transmission is a bad match.
11. Treat user equipment seriously, if user wants a car with a specific equipment, a car without it is a bad match.
12. If user wants a car with something like "termoizolowane szyby" a car without it is a bad match.


Return score from 0 to 100 based on how good the listing is. Make the result as accurate as possible, so you can even do like 86.361.

IMPORTANT: Always provide a clear, concise explanation for your decision. If accepting: explain what makes it a good match. If rejecting: explain the main reason(s) for rejection.

Return a JSON response with ONLY these fields:
{
  "showToUser": true/false,
  "score": number,
  "explanation": "Clear 1-2 sentence explanation of your decision"
}`;

    /////////////////////////////////////////////////////////////////////////////////////
    const userMessage = `
      User is looking for: ${JSON.stringify(query, null, 2)}
      Car listing: ${JSON.stringify(listing, null, 2)}
      Should this listing be shown to the user?
    `;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      logger.error("No response from OpenAI for listing filter");
      return {
        showToUser: false,
        score: 50,
        explanation: "No AI response - hidden by default",
        link: listing.metadata.link,
      }; // Default to showing if no response
    }

    try {
      const decision = JSON.parse(content) as FilterDecision;
      if (typeof decision.showToUser !== "boolean") {
        throw new Error("Invalid response format");
      }

      return { ...decision, link: listing.metadata.link };
    } catch (parseError) {
      logger.error("Failed to parse OpenAI response", {
        content,
        parseError,
        rawContent: JSON.stringify(content),
        listingTitle: listing.metadata.title,
      });
      return {
        showToUser: false,
        score: 50,
        explanation: "Failed to parse AI response - hidden by default",
        link: listing.metadata.link,
      }; // Default to showing if parsing fails
    }
  } catch (error) {
    logger.error("Error filtering listing with AI", {
      error,
      listingId: listing.metadata.link,
      platform: listing.metadata.platform,
    });
    return {
      showToUser: false,
      score: 50,
      explanation: "Error during AI filtering - hidden by default",
      link: listing.metadata.link,
    }; // Default to showing on error
  }
}

/**
 * Filters processed listings and returns only those that should be shown to the user
 */
export async function getFilteredListings(
  processedListings: ProcessedListing[],
  query: searchQuery
): Promise<ProcessedListing[]> {
  const decisions = await filterListingsWithAI(processedListings, query);

  const litingsWithScore = processedListings.map((listing, index) => {
    const decision = decisions[index];
    console.log({
      title: listing.metadata.title,
      showToUser: decision.showToUser,
      score: decision.score / 100,
      explanation: decision.explanation,
      link: decision.link,
    });
    return {
      ...listing,
      fitness: {
        language: decision.score / 100,
      },
    };
  });

  return litingsWithScore.filter((listing, index) => {
    const decision = decisions[index];

    return decision.showToUser;
  });
}
