import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export const analyzeRecipeHelper = async (content: string): Promise<string> => {
    const prompt = `
  Here is a recipe in free-text format:
  ${content}
  
  Please analyze the recipe and provide:
  1. Estimated preparation time in minutes.
  2. Estimated difficulty level (Easy, Medium, Hard).
  3. Number of diners the recipe serves.
  4. Useful preparation tips.
  If any information cannot be inferred, mention it explicitly.
  `;
  
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      });
  
      const result = response.choices[0]?.message?.content;
      if (result) {
        return result;
      } else {
        throw new Error("No response from AI.");
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error("Error analyzing recipe: " + error.message);
      } else {
        throw new Error("Error analyzing recipe: " + String(error));
      }
    }
};

export default analyzeRecipeHelper;