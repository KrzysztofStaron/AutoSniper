import { OpenAI } from "openai";
import logger from "../utils/logger";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function calculateDescriptionScore(
  userDescription?: string,
  carDescription?: string
): Promise<number | null> {
  if (!userDescription || !carDescription) {
    return null;
  }

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert at matching car descriptions. You will be given two descriptions:
1. User's desired car description (what they are looking for)
2. Car listing description (actual car being sold)

Your task is to score how well the car listing matches the user's requirements on a scale of 0.0 to 1.0, where:
- 1.0 = Perfect match, the car listing exactly matches what the user wants
- 0.8-0.9 = Very good match, most requirements are met
- 0.6-0.7 = Good match, many requirements are met
- 0.4-0.5 = Moderate match, some requirements are met
- 0.2-0.3 = Poor match, few requirements are met
- 0.0-0.1 = No match, car doesn't meet user's needs

Consider factors like:
- Fuel type (benzyna, diesel, LPG, hybrid, electric)
- Transmission (manual, automatic)
- Car body type (sedan, hatchback, kombi, SUV, etc.)
- Features and equipment (klimatyzacja, nawigacja, skóra, alufelgi, etc.)
- Condition (bezwypadkowy, serwisowany, garażowany)
- Any specific requirements mentioned

Respond with ONLY a number between 0.0 and 1.0, nothing else.`,
      },
      {
        role: "user",
        content: `User wants: "${userDescription}"

Car listing: "${carDescription}"

Score (0.0-1.0):`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.1,
      max_tokens: 10,
    });

    const scoreText = response.choices[0]?.message?.content?.trim();

    if (!scoreText) {
      logger.error("No response content from OpenAI API", { response });
      return null;
    }

    const score = parseFloat(scoreText);

    if (isNaN(score) || score < 0 || score > 1) {
      logger.error("Invalid score from OpenAI", {
        scoreText,
        parsedScore: score,
        isNaN: isNaN(score),
        outOfRange: score < 0 || score > 1,
      });
      return null;
    }

    return score;
  } catch (error) {
    logger.error("Error calculating description score", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      userDescriptionLength: userDescription.length,
      carDescriptionLength: carDescription.length,
    });
    return null;
  }
}

/**
 * Enhanced description matching with GPT and fallback to basic matching
 */
export async function calculateEnhancedDescriptionScore(
  userDescription?: string,
  carDescription?: string
): Promise<number | null> {
  if (!carDescription) {
    console.error("No car description provided");
    return null;
  }

  const gptScore = await calculateDescriptionScore(userDescription, carDescription);

  if (gptScore !== null) {
    return gptScore;
  }

  const basicScore = calculateBasicDescriptionScore(userDescription, carDescription);

  return basicScore;
}

/**
 * Fallback basic description matching (original word-based approach)
 */
function calculateBasicDescriptionScore(userDescription?: string, carDescription?: string): number | null {
  if (!userDescription || !carDescription) {
    logger.warn("Missing descriptions for basic scoring", {
      userDescription: !!userDescription,
      carDescription: !!carDescription,
    });
    return null;
  }

  const cleanUserDesc = normalizeText(userDescription);
  const cleanCarDesc = normalizeText(carDescription);

  if (cleanUserDesc.length === 0 || cleanCarDesc.length === 0) {
    logger.warn("Empty descriptions after normalization", {
      cleanUserDescLength: cleanUserDesc.length,
      cleanCarDescLength: cleanCarDesc.length,
    });
    return null;
  }

  // Extract keywords from user description
  const userKeywords = extractKeywords(cleanUserDesc);
  const carKeywords = extractKeywords(cleanCarDesc);

  if (userKeywords.length === 0) {
    logger.warn("No keywords extracted from user description", {
      cleanUserDesc: cleanUserDesc.substring(0, 100),
    });
    return null;
  }

  // Calculate keyword match score
  const keywordScore = calculateKeywordMatchScore(userKeywords, carKeywords);

  // Calculate semantic similarity (simple word overlap)
  const semanticScore = calculateSemanticSimilarity(cleanUserDesc, cleanCarDesc);

  // Weighted average (60% keyword matching, 40% semantic similarity)
  const finalScore = keywordScore * 0.6 + semanticScore * 0.4;
  const clampedScore = Math.min(Math.max(finalScore, 0), 1);

  return clampedScore;
}

/**
 * Normalizes text by removing special characters, converting to lowercase, and trimming
 */
function normalizeText(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace special chars with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();

  return normalized;
}

/**
 * Extracts meaningful keywords from text, filtering out common stop words
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "i",
    "me",
    "my",
    "myself",
    "we",
    "our",
    "ours",
    "ourselves",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
    "he",
    "him",
    "his",
    "himself",
    "she",
    "her",
    "hers",
    "herself",
    "it",
    "its",
    "itself",
    "they",
    "them",
    "their",
    "theirs",
    "themselves",
    "what",
    "which",
    "who",
    "whom",
    "this",
    "that",
    "these",
    "those",
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "having",
    "do",
    "does",
    "did",
    "doing",
    "a",
    "an",
    "the",
    "and",
    "but",
    "if",
    "or",
    "because",
    "as",
    "until",
    "while",
    "of",
    "at",
    "by",
    "for",
    "with",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "up",
    "down",
    "in",
    "out",
    "on",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "very",
    "can",
    "will",
    "just",
    "should",
    "now",
    "oraz",
    "lub",
    "ale",
    "tylko",
    "też",
    "także",
    "gdzie",
    "kiedy",
    "jak",
    "dlaczego",
    "który",
    "która",
    "które",
    "jest",
    "są",
    "był",
    "była",
    "było",
    "byli",
    "były",
    "będzie",
    "będą",
    "ma",
    "mają",
    "miał",
    "miała",
    "miało",
    "mieli",
    "miały",
  ]);

  const words = text.split(" ");

  const filteredWords = words
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates

  return filteredWords;
}

/**
 * Calculates keyword match score based on how many user keywords appear in car description
 */
function calculateKeywordMatchScore(userKeywords: string[], carKeywords: string[]): number {
  if (userKeywords.length === 0) {
    logger.warn("No user keywords provided for matching");
    return 0;
  }

  const carKeywordSet = new Set(carKeywords);
  const matchedKeywords = userKeywords.filter(keyword => carKeywordSet.has(keyword));

  const score = matchedKeywords.length / userKeywords.length;

  return score;
}

/**
 * Calculates semantic similarity using simple word overlap
 */
function calculateSemanticSimilarity(userDesc: string, carDesc: string): number {
  const userWords = new Set(userDesc.split(" "));
  const carWords = new Set(carDesc.split(" "));

  const intersection = new Set([...userWords].filter(word => carWords.has(word)));
  const union = new Set([...userWords, ...carWords]);

  if (union.size === 0) {
    logger.warn("No words in union set, returning similarity score of 0");
    return 0;
  }

  const similarity = intersection.size / union.size;

  return similarity;
}
