import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeRecipeHelper = async (content: string): Promise<string> => {
  try{
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined");
    }
    const genAI = new GoogleGenerativeAI(apiKey); 
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
  Here is a recipe in free-text format:
  ${content}
  
  Please analyze the recipe and provide - keep it short please and please write without using bold in your reply:
  1. Estimated preparation time in minutes.
  2. Estimated difficulty level (Easy, Medium, Hard).
  3. Cuisine the recipe fits into.
  4. Useful preparation tips.
  If any information cannot be inferred, mention it explicitly.
  `;
  
  const result = await model.generateContent(prompt);
  console.log("Gemini AI sent a response");
  return result.response.text();
} catch (error) {
  console.error("Error fetching response from Gemini:", error);
  throw new Error("Failed to fetch AI response");
}
};
export default analyzeRecipeHelper;
