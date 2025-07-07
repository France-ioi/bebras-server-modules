import {GenericCallback, TaskArg} from "../types";
import tokens_api from "../libs/tokens_api";
import {loadTask} from "../libs/tasks";
import aiGenerator from "../libs/ai/generator";
import {requestNewAIUsage} from "../libs/ai";

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
        generationId: function(v: string, callback: GenericCallback) {
            const valid = v && v.length
            callback(!valid, v)
        },
        model: function(v: string, callback: GenericCallback) {
            const valid = v && v.length
            callback(!valid, v)
        },
    },
    params: {
        generateImage: ['task', 'prompt', 'generationId', 'model'],
    },
    actions: {
        generateImage: function(args: {task: TaskArg, prompt: string, generationId: string, model: string}, callback: GenericCallback) {
            console.log('generate', args);
            loadTask(args.task.id, 'taskData', async (error, obj) => {
                if(error) return callback(error)

                console.log('obj', obj!.config);

                try {
                    const result = await requestNewAIUsage(args.task.id, args.task.payload, obj!.config.ai_quota, args.generationId);
                    if (result) {
                        callback(null, result);
                        return;
                    }


                    const image = await aiGenerator.generateImage(args.prompt, args.model);
                    console.log({image})
                    // TODO: store the results in S3

                    callback(null, image);
                } catch (e) {
                    callback(e);
                }
            })
        },
    }
}
