import {GenericCallback, TaskArg} from "../types";
import tokens_api from "../libs/tokens_api";
import {loadTask} from "../libs/tasks";
import aiGenerator from "../libs/ai/generator";
import {
    fetchGenerationIdFromCache,
    generateGenerationIdFromPrompt,
    requestNewAIUsage,
    storeAIUsage
} from "../libs/ai";
import storage from "../libs/storage";
import base64parser from "../libs/base64parser";
import uuid from "uuid";

export default {
    path: '/ai',
    validators: {
        task: function(v: string, callback: GenericCallback) {
            tokens_api.verify(v, (error) => {
                if(error) return callback(error)
                tokens_api.decodeTask(v, callback)
            })
        },
        prompt: function(v: string, callback: GenericCallback) {
            const valid = v && v.length
            callback(!valid, v)
        },
        size: function(v: string, callback: GenericCallback) {
            const valid = v && v.length
            callback(!valid, v)
        },
        model: function(v: string, callback: GenericCallback) {
            const valid = v && v.length
            callback(!valid, v)
        },
    },
    params: {
        requestNewAiUsage: ['task'],
        generateText: ['task', 'prompt', 'model'],
        generateImage: ['task', 'prompt', 'model', 'size'],
        getEmbedding: ['task', 'prompt', 'model'],
    },
    actions: {
        requestNewAiUsage: function(args: {task: TaskArg}, callback: GenericCallback) {
            loadTask(args.task.id, 'taskData', async (error, obj) => {
                if (error) return callback(error);

                try {
                    await requestNewAIUsage(args.task.id, args.task.payload, obj!.config.ai_quota);

                    callback(null, {success: true});
                } catch (e) {
                    console.error(e);
                    callback(e);
                }
            });
        },
        generateText: function(args: {task: TaskArg, prompt: string, model: string, jsonSchema?: object, systemInstructions?: string}, callback: GenericCallback) {
            loadTask(args.task.id, 'taskData', async (error, obj) => {
                if (error) return callback(error);

                try {
                    const generationId = generateGenerationIdFromPrompt(JSON.stringify({
                        prompt: args.prompt,
                        model: args.model,
                        jsonSchema: args.jsonSchema,
                        systemInstructions: args.systemInstructions,
                    }));

                    const result = await fetchGenerationIdFromCache(generationId);
                    if (result) {
                        callback(null, result);
                        return;
                    }

                    if (result) {
                        callback(null, result);
                        return;
                    }

                    const text = await aiGenerator.generateText(args.prompt, args.model, args.jsonSchema, args.systemInstructions);
                    if (text) {
                        await storeAIUsage(generationId, text);
                    }

                    callback(null, text);
                } catch (e) {
                    console.error(e);
                    callback(e);
                }
            });
        },
        generateImage: function(args: {task: TaskArg, prompt: string, model: string, size: string}, callback: GenericCallback) {
            loadTask(args.task.id, 'taskData', async (error, obj) => {
                if(error) return callback(error)

                console.log('obj', obj!.config);

                try {
                    const generationId = generateGenerationIdFromPrompt(args.prompt);

                    const result = await fetchGenerationIdFromCache(generationId);
                    if (result) {
                        callback(null, result);
                        return;
                    }

                    let image = await aiGenerator.generateImage(args.prompt, args.model, args.size);
                    console.log({image})

                    if (image) {
                        image = `data:image/jpeg;base64,${image}`;

                        base64parser.createBuffer(image, (error, file) => {
                            if(error || !file) {
                                return callback(error)
                            }

                            const path = args.task.id + '/' + uuid.v4() + '.' + file.ext;
                            console.log({path}, file);

                            storage.write(path, file.buffer, (error: any) => {
                                if (error) {
                                    console.error('error while storing', error);
                                    return callback(error)
                                }

                                const imageUrl = storage.url(path);

                                storeAIUsage(generationId, imageUrl);
                                console.log('ok stored', {path, imageUrl});

                                callback(null, imageUrl);
                            })
                        })
                    } else {
                        throw new Error("No image generated");
                    }
                } catch (e) {
                    console.error(e);
                    callback(e);
                }
            });
        },
        getEmbedding: async function(args: {task: TaskArg, prompt: string, model: string}, callback: GenericCallback) {
            try {
                const result = await aiGenerator.getEmbedding(args.prompt, args.model);
                callback(null, result);
            } catch (e) {
                callback(e);
            }
        }
    }
}


