import {openAIGenerateImageFromPrompt} from "./dall_e";
import {getOpenAIEmbedding} from "./openai";
import {replicateGenerateImageFromPrompt} from "./replicate";
import {geminiGenerateImageFromPrompt} from "./gemini";
import {igniteModel, loadModels, ModelsList} from "multi-llm-ts";
import {callAgent} from "@unified-llm/core";
import {AgentProviderType} from "@unified-llm/core/dist/call-agent";

export type TextGenerator = {providerName: string, apiKey: string};
export type ImageGenerator = (prompt: string, model: string, size: string) => Promise<string|undefined>;
export type EmbeddingGenerator = (input: string, model: string) => Promise<number[]>;

const availableTextProviders: Record<string, TextGenerator> = {
  'openai': {apiKey: process.env['OPENAI_API_KEY'] || '', providerName: 'openai'},
  'gemini': {apiKey: process.env['GEMINI_API_KEY'] || '', providerName: 'google'},
  'anthropic': {apiKey: process.env['ANTHROPIC_API_KEY'] || '', providerName: 'anthropic'},
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
  public async generateText(prompt: string|any[], model: string, jsonSchema: object|null = null, systemInstructions: string|null = null, stream: boolean = false) {
    const modelInfo = this.extractModelInfo(model);
    if (!(modelInfo.provider in availableModelProviders.text)) {
      throw new Error(`This provider is not supported for text generation: ${modelInfo.provider}.`);
    }

    const {apiKey, providerName} = availableModelProviders.text[modelInfo.provider];

    // console.log({jsonSchema, prompt, provider: modelInfo.provider, providerName});

    const config = { apiKey };
    const models = await loadModels(providerName, config);
    const chatModel = models!.chat.find(m => m.id === modelInfo.model);
    if (!chatModel) {
      throw new Error(`Chat model not found: ${modelInfo.model}`);
    }

    // const llmModel = igniteModel(providerName, chatModel, {
    //   apiKey: process.env.OPENAI_API_KEY,
    // })

    // const streamResult = llmModel.generate(Array.isArray(prompt) ? prompt: [{role: 'user', content: prompt}])


    const result = await callAgent({
      apiKey,
      provider: providerName as AgentProviderType,
      model: modelInfo.model,
      ...(jsonSchema ? {
        structuredOutput: {
          format: {
            type: 'json_schema',
            name: 'schema',
            schema: jsonSchema,
          }
        }
      } : {}),
      baseInput: [
        ...(systemInstructions ? [{role: 'system', content: systemInstructions}] : []),
        ...(Array.isArray(prompt) ? prompt: [{role: 'user', content: prompt}]),
      ],
      isStream: stream,
    });

    return result.output as string;

    // console.log({result})
    //
    // if (stream) {
    //   return result;
    // } else {
    //   return result.output as string;
    // }
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
