import {OpenAI} from "openai";

export async function openAIGenerateImageFromPrompt(prompt: string, model: string, size: string = '512x512'): Promise<string|undefined> {
  const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  try {
    console.log("Generating image from prompt", prompt, process.env['OPENAI_API_KEY']);

    //return '';
    const response = await client.images.generate({
      prompt,
      n: 1,
      // @ts-ignore
      size,
      response_format: 'b64_json',
      model,
    });

    return response.data![0].b64_json;
  } catch (error) {
    console.error(error);
  }
}
