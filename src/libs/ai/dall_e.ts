import {OpenAI} from "openai";

export async function openAIGenerateImageFromPrompt(prompt: string, model: string, size: string = '512x512'): Promise<string|undefined> {
  const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  console.log("Generating image from prompt", prompt, process.env['OPENAI_API_KEY']);

  try {
    const response = await client.images.generate({
      prompt,
      n: 1,
      // @ts-ignore
      size,
      response_format: 'b64_json',
      model,
    });

    return response.data![0].b64_json;
  } catch (e: any) {
    if ('image_generation_user_error' === e.error?.type) {
      throw new Error("Impossible de générer une image correspondant à votre prompt, veuillez le modifier.");
    }

    throw e;
  }
}
