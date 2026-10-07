import uuid from 'uuid';
import aiGenerator from '../ai/generator';
import storage from '../storage';
import base64parser from '../base64parser';
import taskData from '../../repositories/task_data';
import assets from '../../repositories/assets';
import {getJob, Job, JobHooks, startJob} from './jobs';
import {AdminVersion, loadAdminVersions} from './task_info';

/* The task-wide cache lives in the `data` and `assets` tables, under this fixed seed. */
export const TASK_CACHE_SEED = 0

export class AdminError extends Error {
    constructor(message: string, public readonly status: number = 400) {
        super(message)
    }
}

function writeFile(path: string, buffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
        storage.write(path, buffer, (error: any) => error ? reject(error) : resolve())
    })
}

function removeFile(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        storage.remove(path, (error: any) => error ? reject(error) : resolve())
    })
}

function parseDataUrl(data: string): Promise<{ext: string|undefined, buffer: Buffer}> {
    return new Promise((resolve, reject) => {
        base64parser.createBuffer(data, (error, file) => error || !file ? reject(error || new Error('Invalid image data')) : resolve(file))
    })
}

const NO_HOOKS: JobHooks = {
    progress() {},
    log() {},
}

/* What the admin functions of the grader data are given. Everything is async. */
export function buildContext(task_id: string, version_id: string, version: any, hooks: JobHooks = NO_HOOKS) {
    async function deleteTaskAsset(key: string): Promise<void> {
        const row = await assets.find(task_id, TASK_CACHE_SEED, key)
        if (!row) {
            return
        }
        await removeFile(row.path)
        await assets.delete(task_id, TASK_CACHE_SEED, key)
    }

    return {
        taskId: task_id,
        versionId: version_id,
        version,

        getTaskData: (key: string) => taskData.readAsync(task_id, TASK_CACHE_SEED, key),
        storeTaskData: (key: string, value: any) => taskData.writeAsync(task_id, TASK_CACHE_SEED, key, value),
        deleteTaskData: (key: string) => taskData.deleteAsync(task_id, TASK_CACHE_SEED, key),

        /* Straight to the providers : no quota, and not stored in the users' generation cache. */
        generateText: async (prompt: string, model: string, options: {jsonSchema?: object, systemInstructions?: string} = {}): Promise<string> => {
            const text = await aiGenerator.generateText(prompt, model, options.jsonSchema || null, options.systemInstructions || null)
            if (!text) {
                throw new Error('No text generated')
            }

            return text
        },
        generateImage: async (prompt: string, model: string, size: string = '512x512'): Promise<string> => {
            const image = await aiGenerator.generateImage(prompt, model, size)
            if (!image) {
                throw new Error('No image generated')
            }

            return `data:image/jpeg;base64,${image}`
        },

        /* Stores a data URL under a key, replacing the previous file for that key. Returns its public url. */
        storeTaskAsset: async (key: string, data: string): Promise<string> => {
            const file = await parseDataUrl(data)
            const path = task_id + '/cache/' + uuid.v4() + '.' + file.ext
            await writeFile(path, file.buffer)
            const previous = await assets.find(task_id, TASK_CACHE_SEED, key)
            await assets.upsert(task_id, TASK_CACHE_SEED, key, path)
            if (previous && previous.path !== path) {
                await removeFile(previous.path).catch((error) => console.error('Could not remove previous asset', error))
            }

            return storage.url(path)
        },
        getTaskAssetUrl: async (key: string): Promise<string|null> => {
            const row = await assets.find(task_id, TASK_CACHE_SEED, key)

            return row ? storage.url(row.path) : null
        },
        deleteTaskAsset,

        progress: (percent: number, message?: string) => hooks.progress(percent, message),
        log: (message: string) => hooks.log(message),
    }
}

async function adminVersion(task_id: string, version_id: string): Promise<AdminVersion> {
    const versions = await loadAdminVersions(task_id)
    const version = versions[version_id]
    if (!version) {
        throw new AdminError(`No version ${version_id} in this task, or its template has no admin section.`, 404)
    }

    return version
}

export interface CacheElements {
    schema: any;
    values: any[];
}

export async function getCacheElements(task_id: string, version_id: string): Promise<CacheElements> {
    const {version, admin} = await adminVersion(task_id, version_id)
    if ('function' !== typeof admin.getCacheElements) {
        throw new AdminError(`Version ${version_id} does not define getCacheElements.`, 404)
    }

    const result = await admin.getCacheElements(buildContext(task_id, version_id, version))
    if (!result || 'object' !== typeof result || !result.schema) {
        throw new AdminError('getCacheElements must return {schema, values}.', 500)
    }
    if ('array' !== result.schema.type) {
        throw new AdminError('The root of the cache schema must be of type "array".', 500)
    }

    return {
        schema: result.schema,
        values: Array.isArray(result.values) ? result.values : [],
    }
}

export async function runAction(task_id: string, version_id: string, action_id: string, params: any): Promise<Job> {
    const {version, admin} = await adminVersion(task_id, version_id)
    const action = admin.actions ? admin.actions[action_id] : undefined
    if (!action || 'function' !== typeof action.action) {
        throw new AdminError(`Unknown action ${action_id} in version ${version_id}.`, 404)
    }

    return startJob(task_id, version_id, action_id, async (hooks) => {
        await action.action(buildContext(task_id, version_id, version, hooks), params)
    })
}

/* Concurrent first requests of a task share the same load (and so the same generation). */
const pendingLoads = new Map<string, Promise<any>>()

export function loadTaskCache(task_id: string, version_id: string, name: string): Promise<any> {
    /* Registered synchronously, before any await, so that no concurrent call can miss it. */
    const id = JSON.stringify([task_id, version_id, name])
    let pending = pendingLoads.get(id)
    if (!pending) {
        pending = runLoader(task_id, version_id, name).finally(() => pendingLoads.delete(id))
        pendingLoads.set(id, pending)
    }

    return pending
}

/* Runs a loader declared by the task template. Only the template decides which keys are read
   and when they get generated : a task token only chooses which loader to run. */
async function runLoader(task_id: string, version_id: string, name: string): Promise<any> {
    const {version, admin} = await adminVersion(task_id, version_id)
    const loader = admin.loaders ? admin.loaders[name] : undefined
    if ('function' !== typeof loader) {
        throw new AdminError(`Unknown task cache loader ${name}.`, 404)
    }

    const prefix = `Task cache ${name} of ${task_id} (version ${version_id}):`
    const hooks: JobHooks = {
        progress: (percent, message) => console.log(prefix, `${Math.round(percent)}%`, message ?? ''),
        log: (message) => console.log(prefix, message),
    }

    return loader(buildContext(task_id, version_id, version, hooks))
}

export {getJob}
