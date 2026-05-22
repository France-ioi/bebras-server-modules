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
import {Anthropic} from "@anthropic-ai/sdk";
import {generateText} from "ai";

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
        streamTextClaudeFormat: ['task', 'model'],
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
        generateText: function(args: {task: TaskArg, prompt: string, model: string, jsonSchema?: object, systemInstructions?: string, promptCacheKey?: string, stream?: boolean}, callback: GenericCallback) {
            loadTask(args.task.id, 'taskData', async (error, obj) => {
                if (error) return callback(error);

                try {
                    const generationId = generateGenerationIdFromPrompt(JSON.stringify({
                        prompt: args.promptCacheKey ?? args.prompt,
                        model: args.model,
                        jsonSchema: args.jsonSchema,
                        systemInstructions: args.systemInstructions,
                    }));

                    const result = await fetchGenerationIdFromCache(generationId);
                    if (result) {
                        callback(null, result);
                        return;
                    }

                    const generateOptions = aiGenerator.buildGenerateTextOptions(args.prompt, args.model, args.jsonSchema, args.systemInstructions);
                    const generationResult = await generateText(generateOptions);
                    const text = generationResult.text;

                    if (text) {
                        await storeAIUsage(generationId, text, obj!.config.cache_time);
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

                                storeAIUsage(generationId, imageUrl, obj!.config.cache_time);

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
        streamTextClaudeFormat: function(args: {task: TaskArg, messages: any[], model: string, system: any[]}, callback: GenericCallback, res: any) {
            loadTask(args.task.id, 'taskData', async (error, obj) => {
                if (error) return callback(error);

                try {
                    await requestNewAIUsage(args.task.id, args.task.payload, obj!.config.ai_quota);

                    const generationId = generateGenerationIdFromPrompt(JSON.stringify({
                        prompt: args.messages,
                        model: args.model,
                    }));

                    const result = await fetchGenerationIdFromCache(generationId);
                    if (result) {
                        callback(null, result);
                        return;
                    }

                    // @ts-ignore
                    const claudeArgs = {
                        ...args,
                    };
                    // @ts-ignore
                    delete claudeArgs.task;
                    // @ts-ignore
                    delete claudeArgs.action;

                    const client = new Anthropic({
                        apiKey: process.env['ANTHROPIC_API_KEY'],
                    });

                    // @ts-ignore
                    const stream = client.messages.stream(claudeArgs);

                    // const model = 'openai/gpt-4o';
                    // // const model = `anthropic/${args.model}`;
                    // const prompts = args.messages.map(message => {
                    //     return {
                    //         ...message,
                    //         toolCalls: [],
                    //     };
                    // })
                    // const systemInstructions = args.system[0].text;

                    res.writeHead(200, {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    });

                    // const response = await aiGenerator.generateText(prompts, model, null, systemInstructions, true);
                    // console.log({response});

                    const sendEvent = (eventName: string, data: object) => {
                        res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
                    }

                    for await (const event of stream) {
                        console.log('send event');
                        sendEvent(event.type, event);
                    }

                    setTimeout(() => {
                        console.log('end stream');
                        res.end();
                    }, 500);

                    // sendEvent('message_start', {
                    //     type: 'message_start',
                    // });

                    // let acc = '';
                    // for await (const chunk of response) {
                    //     console.log({chunk});
                        // switch (ev.eventType) {
                        //     case 'start':
                        //         sendEvent('content_block_start', {
                        //             type: 'content_block_start',
                        //             index: ev.outputIndex,
                        //             content_block: {
                        //                 type: 'text',
                        //                 text: '',
                        //             },
                        //         });
                        //     break;
                        //     case 'text_delta':
                        //         // ev.delta?.text is the incremental piece; ev.text is the accumulator
                        //         sendEvent('content_block_delta', {
                        //             type: 'content_block_delta',
                        //             index: ev.outputIndex,
                        //             delta: {
                        //                 type: 'text_delta',
                        //                 // @ts-ignore
                        //                 text: ev.delta.text,
                        //             }
                        //         })
                        //         break;
                        //     case 'stop':
                        //         sendEvent('content_block_stop', {
                        //             type: 'content_block_stop',
                        //             index: ev.outputIndex,
                        //         });
                        //         // sendEvent('message_stop', {
                        //         //     type: 'message_stop',
                        //         // });
                        //         res.end();
                        //         // ev.rawResponse contains provider-native final response (or stream data)
                        //         break;
                        //     case 'error':
                        //         console.error('Stream error:', ev.delta);
                        //         break;
                        // }
                    // }

                    // TODO: cache
                    // if (text) {
                    //     await storeAIUsage(generationId, text, obj!.config.cache_time);
                    // }
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


