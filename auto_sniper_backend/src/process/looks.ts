import { searchQuery } from "../types";
import OpenAI from "openai";
import sharp from "sharp";
import logger from "../utils/logger";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LooksMatchResult {
  score: number;
  isMatch: boolean;
  reasoning: string;
  imageUrl: string;
}

async function convertImageToPng(imageUrl: string): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to PNG and get buffer
    const pngBuffer = await sharp(buffer).png().toBuffer();

    // Convert to base64 data URL
    const base64 = pngBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return dataUrl;
  } catch (error) {
    logger.error("Error converting image to PNG", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      originalUrl: imageUrl,
    });

    // Fallback to original URL if conversion fails
    logger.warn("Falling back to original image URL", { imageUrl });
    return imageUrl;
  }
}

export async function looksMatch(image: string, query: searchQuery): Promise<LooksMatchResult> {
  const prompt = `
  You are a STRICT car image evaluator. You will be given a car image and a specific description.
  Your job is to determine if the car in the image EXACTLY matches the given description.

  Description to match: "${query.description_forlooks}"
  
  IMPORTANT RULES:
  - Be EXTREMELY strict with your evaluation
  - If the description mentions a color (like "red car"), the car MUST be that exact color
  - If it's not the specified color, return 0.0 immediately
  - Only return 1.0 if the car PERFECTLY matches ALL aspects of the description
  - Return 0.5 only if it's close but not perfect (e.g., dark red vs bright red)
  - If the image is not a car at all, return 0.0
  - If any part of the description doesn't match, return 0.0
  
  For color matching:
  - "red car" = only actual red cars get high scores
  - "blue car" = only actual blue cars get high scores
  - etc.
  
  Rate the match on a scale from 0.0 to 1.0:
  - 0.0 = does NOT match the description at all
  - 0.5 = partially matches (close but not exact)
  - 1.0 = PERFECTLY matches the description
  
  Be harsh in your evaluation. Most cars should get 0.0 unless they truly match.
  
  Respond with ONLY a JSON object in this exact format:
  {
    "score": 0.0,
    "reasoning": "Brief explanation of why this score was given"
  }
  `;

  // Convert image URL to PNG format
  const pngImage = await convertImageToPng(image);

  try {
    const requestPayload = {
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: prompt,
            },
            {
              type: "image_url" as const,
              image_url: {
                url: pngImage,
                detail: "low" as const,
              },
            },
          ],
        },
      ],
    };

    const response = await openai.chat.completions.create(requestPayload);

    const content = response.choices[0].message.content;

    if (!content) {
      logger.error("No content in AI response", { response });
      return {
        score: 0,
        isMatch: false,
        reasoning: "No response from AI",
        imageUrl: image,
      };
    }

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Clean the response to extract JSON
      const jsonMatch = content.match(/\{[^}]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      logger.warn("JSON parsing failed, attempting fallback score extraction", {
        parseError: parseError instanceof Error ? parseError.message : parseError,
        originalContent: content,
      });

      // Fallback: try to extract score from text
      const numberMatch = content.match(/\b(0?\.\d+|1\.0?|0)\b/);
      const score = numberMatch ? parseFloat(numberMatch[0]) : 0;

      return {
        score: Math.max(0, Math.min(1, score)),
        isMatch: score >= 0.7,
        reasoning: "Failed to parse JSON, extracted score from text",
        imageUrl: image,
      };
    }

    const score = Math.max(0, Math.min(1, parsedResponse.score || 0));
    const result: LooksMatchResult = {
      score,
      isMatch: score >= 0.7,
      reasoning: parsedResponse.reasoning || "No reasoning provided",
      imageUrl: image,
    };

    return result;
  } catch (error) {
    logger.error("Error in looks matching process", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      imageUrl: image,
      queryDescription: query.description,
    });

    return {
      score: 0,
      isMatch: false,
      reasoning: "Error processing AI response",
      imageUrl: image,
    };
  }
}
