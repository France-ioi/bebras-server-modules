import Replicate from "replicate";

export async function replicateGenerateImageFromPrompt(prompt: string, model: string, size: string = '512x512'): Promise<string|undefined> {
  const client = new Replicate({
    auth: process.env['REPLICATE_API_TOKEN'],
  });

  console.log("Generating image from prompt", prompt, process.env['REPLICATE_API_TOKEN']);

  try {
    const input = {
      prompt,
      output_format: 'jpg',
    };

    const output = await client.run("black-forest-labs/flux-schnell", { input });

    // TODO: get file and send it back
    for (const [index, item] of Object.entries(output)) {
      console.log({item})
    }

    return '';
  } catch (e: any) {
    throw e;
  }
}
