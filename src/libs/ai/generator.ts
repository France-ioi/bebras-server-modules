import {openAIGenerateImageFromPrompt} from "./dall_e";
import {openAIGenerateTextFromPrompt, getOpenAIEmbedding} from "./openai";
import {replicateGenerateImageFromPrompt} from "./replicate";

export type TextGenerator = (prompt: string, model: string) => Promise<string|undefined>;
export type ImageGenerator = (prompt: string, model: string, size: string) => Promise<string|undefined>;
export type EmbeddingGenerator = (input: string, model: string) => Promise<number[]>;

const availableTextModels: Record<string, TextGenerator> = {
  'gpt-4o': openAIGenerateTextFromPrompt,
  'gpt-4.1': openAIGenerateTextFromPrompt,
  'gpt-4.1-mini': openAIGenerateTextFromPrompt,
  'gpt-4.1-nano': openAIGenerateTextFromPrompt,
};

const availableImageModels: Record<string, ImageGenerator> = {
  'dall-e-2': openAIGenerateImageFromPrompt,
  'flux-schnell': replicateGenerateImageFromPrompt,
};

const availableEmbeddingModels: Record<string, EmbeddingGenerator> = {
  'text-embedding-3-small': getOpenAIEmbedding,
};

const availableModels = {
  text: availableTextModels,
  image: availableImageModels,
  embeddings: availableEmbeddingModels,
}

class AIGenerator {
  public async generateText(prompt: string, model: string) {
    if (!(model in availableModels.text)) {
      throw new Error(`This model is not supported for text generation: ${model}.`);
    }

    const generator = availableModels.text[model];

    return await generator(prompt, model);
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
