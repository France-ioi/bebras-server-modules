import {OpenAI} from "openai";

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

export async function getOpenAIEmbedding(input: string, model: string): Promise<number[]> {
  const embedding = await client.embeddings.create({
    model,
    input,
    encoding_format: "float",
  });

  return embedding.data[0].embedding;
}

export async function openAIGenerateTextFromPrompt(input: string, model: string, jsonSchema: object|null): Promise<string> {
  const response = await client.responses.create({
    model,
    input: [
      // { role: "system", content: "You are a helpful math tutor. Guide the user through the solution step by step." },
      { role: "user", content: input }
    ],
    ...(jsonSchema ? {
      text: {
        format: {
          type: "json_schema",
          name: "response",
          schema: jsonSchema as any,
          strict: true,
        }
      },
    } : {}),
  });

  return response.output_text;
}
