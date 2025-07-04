import {OpenAI} from "openai";

export async function openAIGenerateImageFromPrompt(prompt: string, model: string): Promise<string|undefined> {
  const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  try {
    console.log("Generating image from prompt", prompt, process.env['OPENAI_API_KEY']);

    const response = await client.images.generate({
      prompt,
      n: 1,
      size: '512x512',
      response_format: 'b64_json',
      model,
    });

    return response.data![0].b64_json;
  } catch (error) {
    console.error(error);
  }
}
