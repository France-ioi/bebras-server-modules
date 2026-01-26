import {openAIGenerateImageFromPrompt} from "./dall_e";
import {openAIGenerateTextFromPrompt, getOpenAIEmbedding} from "./openai";
import {replicateGenerateImageFromPrompt} from "./replicate";
import {geminiGenerateImageFromPrompt, geminiGenerateTextFromPrompt} from "./gemini";

export type TextGenerator = (prompt: string, model: string, jsonSchema: object|null) => Promise<string|undefined>;
export type ImageGenerator = (prompt: string, model: string, size: string) => Promise<string|undefined>;
export type EmbeddingGenerator = (input: string, model: string) => Promise<number[]>;

const availableTextProviders: Record<string, TextGenerator> = {
  'openai': openAIGenerateTextFromPrompt,
  'gemini': geminiGenerateTextFromPrompt,
};

const availableImageProviders: Record<string, ImageGenerator> = {
  'openai': openAIGenerateImageFromPrompt,
  'gemini': geminiGenerateImageFromPrompt,
  'replicate': replicateGenerateImageFromPrompt,
};

const availableEmbeddingProviders: Record<string, EmbeddingGenerator> = {
  'openai': getOpenAIEmbedding,
};

const availableModelProviders = {
  text: availableTextProviders,
  image: availableImageProviders,
  embeddings: availableEmbeddingProviders,
}

class AIGenerator {
  public extractModelInfo(model: string): {provider: string, model: string} {
    const [provider, ...providerModel] = model.split('/');

    return {
      provider,
      model: providerModel.join('/'),
    };
  }
  public async generateText(prompt: string, model: string, jsonSchema: object|null = null) {
    const modelInfo = this.extractModelInfo(model);
    if (!(modelInfo.provider in availableModelProviders.text)) {
      throw new Error(`This provider is not supported for text generation: ${modelInfo.provider}.`);
    }

    const generator = availableModelProviders.text[modelInfo.provider];

    return await generator(prompt, modelInfo.model, jsonSchema);
  }

  public async getEmbedding(input: string, model: string) {
    const modelInfo = this.extractModelInfo(model);
    if (!(modelInfo.provider in availableModelProviders.embeddings)) {
      throw new Error(`This provider is not supported for embedding generation: ${modelInfo.provider}.`);
    }

    const generator = availableModelProviders.embeddings[modelInfo.provider];

    return await generator(input, modelInfo.model);
  }

  public async generateImage(prompt: string, model: string, size: string) {
    const modelInfo = this.extractModelInfo(model);
    if (!(modelInfo.provider in availableModelProviders.image)) {
      throw new Error(`This provider is not supported for image generation: ${modelInfo.provider}.`);
    }

    const generator = availableModelProviders.image[modelInfo.provider];

    return await generator(prompt, modelInfo.model, size);
  }
}

export default new AIGenerator();
