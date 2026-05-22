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
