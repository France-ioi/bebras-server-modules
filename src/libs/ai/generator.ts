import {openAIGenerateImageFromPrompt} from "./dall_e";
import {getOpenAIEmbedding} from "./openai";
import {replicateGenerateImageFromPrompt} from "./replicate";

export type ImageGenerator = (prompt: string, model: string, size: string) => Promise<string|undefined>;
export type EmbeddingGenerator = (input: string, model: string) => Promise<number[]>;

const availableTextModels = {

};

const availableImageModels: Record<string, ImageGenerator> = {
  'dall-e-2': openAIGenerateImageFromPrompt,
  'flux-schnell': replicateGenerateImageFromPrompt,
};

const availableEmbeddingModels: Record<string, EmbeddingGenerator> = {
  'text-embedding-3-small': getOpenAIEmbedding,
};

const availableModels = {
  text: {},
  image: availableImageModels,
  embeddings: availableEmbeddingModels,
}

class AIGenerator {
  public getAvailableTextModels() {
    return availableTextModels;
  }

  public getAvailableImageModels() {
    return availableImageModels;
  }

  public async generateText(prompt: string, model: string) {

  }

  public async getEmbedding(input: string, model: string) {
    if (!(model in availableModels.embeddings)) {
      throw new Error(`This model is not supported for image generation: ${model}.`);
    }

    const generator = availableModels.embeddings[model];

    return await generator(input, model);
  }

  public async generateImage(prompt: string, model: string, size: string) {
    if (!(model in availableModels.image)) {
      throw new Error(`This model is not supported for image generation: ${model}.`);
    }

    const generator = availableModels.image[model];

    return await generator(prompt, model, size);
  }
}

export default new AIGenerator();
