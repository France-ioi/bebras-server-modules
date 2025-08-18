import {GoogleGenAI} from "@google/genai";

const ai = new GoogleGenAI({});

export async function geminiGenerateTextFromPrompt(input: string, model: string): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: input,
  });

  if (!response.text) {
    throw new Error("AI model returned no text from prompt.");
  }

  return response.text;
}
