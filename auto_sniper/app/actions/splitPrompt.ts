"use server";

export async function splitPrompt(prompt: string) {
  // If prompt is empty, return default values
  if (!prompt || prompt.trim() === "") {
    return {
      look: null,
      description: null,
      history: null,
    };
  }

  const systemPrompt = `You are an assistant that splits a user's car search prompt into 3 categories:
1. requirements about the car's look (e.g. color, body style, aesthetics)
2. requirements about the car's equipment, features and technical data, and metadata (anything found in online listings description even phone numbers)
3. requirements related to car history and technical data.

Include all the information from the user's prompt in the output, if there is no information about a category, set it as null.

exaple:

 red, v8, 6l, less than 3 prevois owners
 
 output: {
  look: "User is looking for a red car",
  description: "User is looking for a car with less than 3 previous owners and v8 6l engine",
  history: "User is looking for a car with less than 3 previous owners and v8 6l engine"
 }


 I'm looking for a brand-new car with a 6-liter engine that gets attention, especially from women
 {
  "look": "User is looking for a brand-new car that gets attention, especially from women",
  "description": "User is looking for a car with a 6-liter engine",
  "history": "brand new car with 6l engine"
}


Return a JSON object with keys: 'look', 'description', 'history'.
If a requirement does not fit any category, set it as null.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check if the response has the expected structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error("Invalid response structure from OpenAI API");
    }

    if (!data.choices[0].message || !data.choices[0].message.content) {
      throw new Error("Missing message content in OpenAI API response");
    }

    console.log(data.choices[0].message.content);
    const parsedContent = JSON.parse(data.choices[0].message.content);

    // Ensure the parsed content has the expected structure
    return {
      look: parsedContent.look || null,
      description: parsedContent.description || null,
      history: parsedContent.history || null,
    };
  } catch (error) {
    console.error("Error in splitPrompt:", error);

    // Return fallback values if API call fails
    return {
      look: null,
      description: prompt, // Use the original prompt as description fallback
      history: null,
    };
  }
}
