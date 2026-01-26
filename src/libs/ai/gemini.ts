import {GoogleGenAI} from "@google/genai";

const ai = new GoogleGenAI({});

export async function geminiGenerateTextFromPrompt(input: string, model: string, jsonSchema: object|null): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: input,
    config: {
      ...(jsonSchema ? {
        responseJsonSchema: jsonSchema,
      } : {}),
    }
  });

  if (!response.text) {
    throw new Error("AI model returned no text from prompt.");
  }

  return response.text;
}

export async function geminiGenerateImageFromPrompt(input: string, model: string, size: string = '512x512'): Promise<string|undefined> {
  const response = await ai.models.generateContent({
    model,
    contents: input,
  });

  if (response?.candidates?.length && response?.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
  }

  throw new Error("Impossible de générer une image correspondant à votre prompt, veuillez le modifier.");
}
