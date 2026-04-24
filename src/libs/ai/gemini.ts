import {GoogleGenAI} from "@google/genai";

const ai = new GoogleGenAI({});

export async function geminiGenerateTextFromPrompt(input: string, model: string, jsonSchema: object|null, systemInstructions: string|null): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: input,
    config: {
      ...(jsonSchema ? {
        responseJsonSchema: jsonSchema,
      } : {}),
      ...(systemInstructions ? {
        systemInstruction: [
          systemInstructions,
        ],
      } : {}),
    },
  });

  if (!response.text) {
    throw new Error("AI model returned no text from prompt.");
  }

  return response.text;
}

export function findClosestAspectRatio(width: number, height: number, aspectRatios: string[]) {
  const targetRatio = width / height;

  let bestMatch = null;
  let smallestDiff = Infinity;

  for (const label of aspectRatios) {
    const [w, h] = label.split(":").map(Number);
    const ratio = w / h;
    const diff = Math.abs(targetRatio - ratio);

    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestMatch = label;
    }
  }

  return bestMatch;
}

export async function geminiGenerateImageFromPrompt(input: string, model: string, size: string = '512x512'): Promise<string|undefined> {
  const [width, height] = size.split('x').map(Number);
  const aspectRatio = findClosestAspectRatio(width, height, [
    "1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"
  ]);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    // model,
    contents: input,
    config: {
      imageConfig: {
        // @ts-ignore
        aspectRatio,
      },
    },
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
