import { OpenAI } from "openai";
import logger from "../utils/logger";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze if the car history is good or not using LLM
 */
export async function analyzeHistoryQuality(carHistory: any): Promise<number | null> {
  if (!carHistory || !carHistory.technicalData || !carHistory.eventSummary) {
    return null;
  }

  try {
    const historyText = JSON.stringify(carHistory, null, 2);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert car mechanic and historian analyzing Polish car history records from gov.pl.
Your task is to evaluate the quality of a car's history on a scale of 0.0 to 1.0, where:
- 1.0 = Excellent history (1 owner, no accidents, regular inspections, well maintained)
- 0.8-0.9 = Very good (minor concerns, 2 owners max, all inspections passed)
- 0.6-0.7 = Good (average history, 3 owners, some gaps but nothing major)
- 0.4-0.5 = Fair (some red flags, many owners, inspection issues)
- 0.2-0.3 = Poor (major concerns, suspicious patterns)
- 0.0-0.1 = Very bad (avoid this car)

Consider:
- Number of owners (właściciele) and co-owners (współwłaściciele)
- Technical inspection status (badanie techniczne)
- Insurance status (polisa OC)
- Odometer readings (stan licznika) - look for rollback patterns
- Registration changes between provinces
- Engine and technical specifications
- Any suspicious patterns or missing data

Respond with ONLY a number between 0.0 and 1.0.`,
      },
      {
        role: "user",
        content: `Analyze this car history and rate its quality:

${historyText}

Quality score (0.0-1.0):`,
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
      logger.error("No response from OpenAI for history quality");
      return null;
    }

    const score = parseFloat(scoreText);
    if (isNaN(score) || score < 0 || score > 1) {
      logger.error("Invalid history quality score from OpenAI", { scoreText, score });
      return null;
    }

    return score;
  } catch (error) {
    logger.error("Error analyzing history quality", { error });
    return null;
  }
}

/**
 * Check how well the car history matches user's gov data description
 */
export async function analyzeGovDataMatch(carHistory: any, userDescription: string): Promise<number | null> {
  if (!carHistory || !userDescription) {
    return null;
  }

  try {
    const historyText = JSON.stringify(carHistory, null, 2);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert at matching car history data with user requirements.
You will be given:
1. User's desired car history/gov data requirements
2. Actual car history from gov.pl

Score how well the history matches user requirements on 0.0 to 1.0 scale:
- 1.0 = Perfect match to all requirements
- 0.8-0.9 = Most requirements met
- 0.6-0.7 = Many requirements met
- 0.4-0.5 = Some requirements met
- 0.2-0.3 = Few requirements met
- 0.0-0.1 = Doesn't match requirements

Consider matching:
- Number of owners requested vs actual
- Specific technical requirements (engine, fuel type, etc)
- Location/province requirements
- Inspection/insurance status requirements
- Any other specific requirements mentioned

Respond with ONLY a number between 0.0 and 1.0.`,
      },
      {
        role: "user",
        content: `User requirements: "${userDescription}"

Actual car history:
${historyText}

Match score (0.0-1.0):`,
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
      logger.error("No response from OpenAI for gov data match");
      return null;
    }

    const score = parseFloat(scoreText);
    if (isNaN(score) || score < 0 || score > 1) {
      logger.error("Invalid gov data match score from OpenAI", { scoreText, score });
      return null;
    }

    return score;
  } catch (error) {
    logger.error("Error analyzing gov data match", { error });
    return null;
  }
}
