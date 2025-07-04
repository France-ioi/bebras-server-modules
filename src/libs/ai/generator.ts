import {openAIGenerateImageFromPrompt} from "./dall_e";

export type ImageGenerator = (prompt: string, model: string) => Promise<string|undefined>;

const availableTextModels = {

};

const availableImageModels: Record<string, ImageGenerator> = {
  'dall-e-2': openAIGenerateImageFromPrompt,
};

class AIGenerator {
  public getAvailableTextModels() {
    return availableTextModels;
  }

  public getAvailableImageModels() {
    return availableImageModels;
  }

  public async generateText(prompt: string, model: string) {

  }

  public async generateImage(prompt: string, model: string) {
    if (!(model in availableImageModels)) {
      throw new Error(`This model is not supported for image generation: ${model}.`);
    }

    const generator = availableImageModels[model];

    return await generator(prompt, model);
  }
}

export default new AIGenerator();
