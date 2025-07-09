import Replicate from "replicate";
import fetch from 'isomorphic-fetch';

export async function replicateGenerateImageFromPrompt(prompt: string, model: string, size: string = '512x512'): Promise<string|undefined> {
  const client = new Replicate({
    auth: process.env['REPLICATE_API_TOKEN'],
  });

  console.log("Generating image from Replicate prompt", prompt, process.env['REPLICATE_API_TOKEN']);

  try {
    const input = {
      prompt,
      output_format: 'jpg',
    };

    const output = await client.run("black-forest-labs/flux-schnell", { input });
    for (const item of Object.values(output)) {
      const response = await fetch(item.url().href);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // @ts-ignore
      const buffer = await response.buffer();

      return new Buffer(buffer).toString('base64');
    }
  } catch (e: any) {
    throw e;
  }
}
