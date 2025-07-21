import OpenAI from "openai";
import fs from "fs";

import puppeteer from "puppeteer";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const car = {
  brand: "Toyota",
  model: "Corolla",
  year: 2024,
  fuel: "Hybrid",
  color: "white",
  equipment: "Dual-zone climate control, 8-inch touchscreen, rearview camera",
};

const searchQuery = {
  brand: car.brand,
  model: car.model,
  year: car.year,
  fuel: car.fuel,
  color: car.color,
};

const AIeval = {
  equipment: car.equipment,
};

const carMarketplaces = [
  "OTOMOTO",
  "OLX",
  "Autoplac.pl",
  "Samochody.pl",
  "AutoCentrum.pl",
  "Gratka.pl",
  "Auto.pl",
  "AutoScout24",
  "GetAuto.pl",
  "Allegro",
];

async function scrapeListings() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://www.otomoto.pl/osobowe?search%5Border%5D=relevance_web", {
    waitUntil: "load",
  });

  const htmlContent = await page.evaluate(() => {
    return document.body.innerHTML;
  });

  // Take screenshot
  await page.screenshot({
    path: "screenshot.png",
    fullPage: false,
  });

  // Read screenshot file
  const imageBuffer = fs.readFileSync("screenshot.png");
  const base64Image = imageBuffer.toString("base64");

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text:
            "Goal: Find listings for Toyota Corolla 2024. Interact with the page **slowly and deliberately, like a human would**. Add pauses between actions if possible. Navigate to the next page if necessary. Current page HTML: " +
            htmlContent,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${base64Image}`,
          },
        },
      ],
    },
  ];

  const tools = [
    {
      type: "function",
      function: {
        name: "execute_javascript",
        description: "Execute javascript code on the current page context.",
        parameters: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The javascript code to execute in the browser page context.",
            },
          },
          required: ["code"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "goal_reached",
        description: "call this function if the goal is reached",
      },
    },
  ];

  try {
    let currentMessages = messages as OpenAI.Chat.ChatCompletionMessageParam[];
    let goalReached = false;

    // Maximum number of iterations to prevent infinite loops
    const maxIterations = 10;
    let iteration = 0;

    while (!goalReached && iteration < maxIterations) {
      iteration++;
      console.log(`\n--- Iteration ${iteration} ---`);

      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano-2025-04-14", // Consider gpt-4o-mini if nano struggles with tool use
        messages: currentMessages,
        tools: tools as OpenAI.Chat.ChatCompletionTool[],
        tool_choice: "auto", // Let the model decide when to use tools
      });

      const responseMessage = response.choices[0].message;
      console.log("OpenAI Response Message:", responseMessage);

      // Add the assistant's response to the message history
      currentMessages.push(responseMessage);

      if (responseMessage.tool_calls) {
        console.log("Tool Calls:", responseMessage.tool_calls);

        // Prepare tool result messages and capture updated state if needed
        const toolResultMessages: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];
        let updatedHtmlContent: string | null = null;
        let updatedBase64Image: string | null = null;

        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          let toolContent = "";

          if (functionName === "execute_javascript") {
            const codeToExecute = functionArgs.code;
            console.log(`Executing JS: ${codeToExecute}`);
            try {
              const result = await page.evaluate(codeToExecute);
              console.log("JS Execution Result:", result);
              toolContent = JSON.stringify(
                result !== undefined ? result : "Script executed successfully, no return value."
              );

              // Capture updated state AFTER successful execution
              console.log("Capturing updated page state...");
              updatedHtmlContent = await page.evaluate(() => document.body.innerHTML);
              await page.screenshot({ path: "screenshot.png", fullPage: false });
              const newImageBuffer = fs.readFileSync("screenshot.png");
              updatedBase64Image = newImageBuffer.toString("base64");
            } catch (e: any) {
              console.error(`Error executing JS: ${e.message}`);
              toolContent = `Error executing script: ${e.message}`;
            }
          } else if (functionName === "goal_reached") {
            console.log("Goal reached acknowledgement requested by model.");
            goalReached = true;
            toolContent = "Goal confirmed as reached.";
            // No break here, process all tool calls in the response
          }

          // Add the result message for this specific tool call
          toolResultMessages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: toolContent,
          });

          if (goalReached) {
            break; // If goal is reached, stop processing further tool calls in this batch and exit the outer loop later
          }
        } // End of loop through tool calls

        // Add all tool results to the message history
        currentMessages.push(...toolResultMessages);

        // If page was updated, add the new user state message AFTER all tool results
        if (updatedHtmlContent !== null && updatedBase64Image !== null) {
          const updatedUserMessage: OpenAI.Chat.ChatCompletionUserMessageParam = {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Here is the updated page content after executing the script. Continue searching for Toyota Corolla 2024, navigate to the next page if there are more listings: " +
                  updatedHtmlContent,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${updatedBase64Image}`,
                },
              },
            ],
          };
          currentMessages.push(updatedUserMessage);
        }

        // If goal was reached during tool processing, break the main while loop
        if (goalReached) {
          console.log("Goal reached! Ending interaction loop.");
          break;
        }

        // Randomized delay between iterations to mimic human browsing speed variation
        const delay = Math.random() * 4000 + 3000; // Delay between 3-7 seconds
        console.log(`Waiting for ${Math.round(delay / 1000)} seconds before next action...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (responseMessage.content) {
        // No tool calls, model provided a text response.
        console.log("Final OpenAI Analysis:", responseMessage.content);
        break; // Exit loop as we have a final answer
      } else {
        // Should not happen with well-defined tools, but handle just in case
        console.log("No content or tool calls received.");
        break;
      }
    }

    if (iteration >= maxIterations) {
      console.warn("Reached maximum interaction iterations.");
    }
  } catch (error) {
    console.error("Error analyzing with OpenAI:", error);
  }

  // Cleanup screenshot
  fs.unlinkSync("screenshot.png");
}

scrapeListings();
