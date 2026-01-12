import Replicate from "replicate";
import fetch from 'isomorphic-fetch';

export async function replicateGenerateImageFromPrompt(prompt: string, model: string, size: string = '512x512'): Promise<string|undefined> {
  const client = new Replicate({
    auth: process.env['REPLICATE_API_TOKEN'],
  });

  console.log("Generating image from Replicate prompt", prompt, process.env['REPLICATE_API_TOKEN']);

  const [width, height] = size.split('x').map(Number); // For Flux 2 Dev
  const megapixels = width*height <= 512*512 ? '0.25' : '1'; // For Flux Schnell

  try {
    if (!model) {
      model = 'black-forest-labs/flux-schnell';
    }

    const input = {
      prompt,
      output_format: 'jpg',
      aspect_ratio: 'black-forest-labs/flux-schnell' === model ? '1:1' : 'custom', // Flux-schnell does not support "custom"
      width,
      height,
      megapixels,
    };

    const output = await client.run(model as `${string}/${string}`|`${string}/${string}:${string}`, {input});
    const url = extractResponseUrl(output);
    const response = await fetch(url.href);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // @ts-ignore
    const buffer = await response.buffer();

    return new Buffer(buffer).toString('base64');
  } catch (e: any) {
    throw e;
  }
}

function extractResponseUrl(response: any) {
  if (response.url) {
    return response.url();
  }

  return response[0].url();
}
