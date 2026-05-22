import {openAIGenerateImageFromPrompt} from "./dall_e";
import {getOpenAIEmbedding} from "./openai";
import {replicateGenerateImageFromPrompt} from "./replicate";
import {geminiGenerateImageFromPrompt} from "./gemini";
import {createOpenAI} from "@ai-sdk/openai";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import {createAnthropic} from "@ai-sdk/anthropic";
import {Output, jsonSchema as toJsonSchema} from "ai";

export type ImageGenerator = (prompt: string, model: string, size: string) => Promise<string|undefined>;
export type EmbeddingGenerator = (input: string, model: string) => Promise<number[]>;

const availableTextProviders: Record<string, () => any> = {
  openai: () => createOpenAI({ apiKey: process.env['OPENAI_API_KEY'] || ''}),
  gemini: () => createGoogleGenerativeAI({apiKey: process.env['GEMINI_API_KEY'] || ''}),
  anthropic: () => createAnthropic({apiKey: process.env['ANTHROPIC_API_KEY'] || ''}),
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

  public buildGenerateTextOptions(
    prompt: string | any[],
    model: string,
    jsonSchema: object | null = null,
    systemInstructions: string | null = null,
  ) {
    const modelInfo = this.extractModelInfo(model);

    if (!(modelInfo.provider in availableTextProviders)) {
      throw new Error(`This provider is not supported: ${modelInfo.provider}`);
    }

    const provider = availableTextProviders[modelInfo.provider]();
    const llmModel = provider(modelInfo.model);

    const messages = [
      ...(Array.isArray(prompt) ? prompt : [{ role: 'user' as const, content: prompt }]),
    ];

    const output = jsonSchema ? Output.object({ schema: toJsonSchema(jsonSchema) }) : undefined;

    return {
      model: llmModel,
      messages,
      ...(output && { output }),
      ...(systemInstructions && { system: systemInstructions }),
    };
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
