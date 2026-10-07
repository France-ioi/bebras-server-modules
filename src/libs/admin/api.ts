import express, {NextFunction, Request, Response, Router} from 'express';
import crypto from 'crypto';
import generationsCache, {AdminGenerationRow} from '../../repositories/ai_generations_cache';
import graderData from '../../repositories/grader_data';
import {getTaskInfo, listRegisteredTasks, TaskInfo} from './task_info';
import {AdminError, getCacheElements, getJob, runAction} from './task_cache';
import {JobConflict, jobsForTask} from './jobs';
import {
    ApiCacheResponse,
    ApiGeneration,
    ApiGenerationResponse,
    ApiJobResponse,
    ApiJobsResponse,
    ApiRecentResponse,
    ApiSearchResponse,
    ApiTaskHeading,
    ApiTaskResponse,
} from './api_types';

const SEARCH_LIMIT = 100
const GENERATIONS_LIMIT = 100
const RECENT_LIMIT = 50

/* Header the SPA sends on every call. Requiring it on writes (along with a JSON body) forces a CORS
   preflight, which the public CORS policy does not grant credentials to : Basic Auth can't be ridden cross-site. */
export const ADMIN_REQUEST_HEADER = 'x-requested-with'
export const ADMIN_REQUEST_VALUE = 'bsm-admin'

type Row = AdminGenerationRow & {task_dir?: string|null};

function formatDate(value: any): string|null {
    if (!value) {
        return null
    }
    const date = new Date(value)

    if (isNaN(date.getTime())) {
        return String(value)
    }
    // DATETIME columns are filled with NOW() (server local time) and parsed by
    // the mysql driver as local time: format with local getters, not toISOString (UTC).
    const pad = (n: number) => String(n).padStart(2, '0')

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function toApiGeneration(row: Row): ApiGeneration {
    return {
        generation_id: row.generation_id,
        generation_result: row.generation_result,
        expires_at: formatDate(row.expires_at),
        expired: row.expires_at ? new Date(row.expires_at).getTime() <= Date.now() : false,
        task_id: row.task_id,
        ...('task_dir' in row ? {task_dir: row.task_dir} : {}),
        user_id: row.user_id,
        /* Platform name, falling back to the raw id when the platform row is gone. */
        platform_label: row.platform_name || row.platform_id || '—',
        prompt: row.prompt,
        model: row.model,
        generation_type: row.generation_type,
        created_at: formatDate(row.created_at),
    }
}

function heading(info: TaskInfo): ApiTaskHeading {
    return {task_id: info.task_id, task_dir: info.task_dir, warnings: info.warnings}
}

function configRows(info: TaskInfo): [string, string|null][] {
    const config: any = info.config || {}

    return [
        ['Task directory', info.task_dir],
        ['Template', info.template],
        ['Task AI quotas', config.ai_quota ? JSON.stringify(config.ai_quota) : null],
    ]
}

/* Quiz task ids are 'quiz-' + md5 of the task path. */
function quizTaskId(taskPath: string): string {
    return 'quiz-' + crypto.createHash('md5').update(taskPath).digest('hex')
}

async function taskExists(task_id: string): Promise<boolean> {
    if (listRegisteredTasks().some(task => task.task_id === task_id)) {
        return true
    }

    return null !== await graderData.readByTaskId(task_id)
}

function json<T>(handler: (req: Request) => Promise<T>, status: number = 200) {
    return function (req: Request, res: Response): void {
        handler(req)
            .then((data) => {
                res.status(status).json(data)
            })
            .catch((error) => {
                const code = error instanceof AdminError ? error.status : (error instanceof JobConflict ? 409 : 500)
                if (500 === code) {
                    console.error('Admin API error', error)
                }
                if (!res.headersSent) {
                    res.status(code).json({error: (error as Error).message || 'Unknown error'})
                }
            })
    }
}

function requireAdminRequest(req: Request, res: Response, next: NextFunction): void {
    if (req.header(ADMIN_REQUEST_HEADER) !== ADMIN_REQUEST_VALUE || !req.is('application/json')) {
        res.status(403).json({error: 'Admin writes must be JSON requests sent by the admin panel.'})
        return
    }
    next()
}

async function recent(): Promise<ApiRecentResponse> {
    return {generations: (await generationsCache.recent(RECENT_LIMIT)).map(toApiGeneration)}
}

async function search(req: Request): Promise<ApiSearchResponse> {
    /* Task paths are stored and hashed without a trailing slash, but a copied folder path often ends with one. */
    const query = 'string' === typeof req.query.q ? req.query.q.trim().replace(/\/+$/, '') : ''
    if (!query) {
        throw new AdminError('Empty search.')
    }

    /* A task path resolves to its quiz id ; a task id pasted as-is is accepted too. */
    for (const candidate of [quizTaskId(query), query]) {
        if (await taskExists(candidate)) {
            return {task_id: candidate}
        }
    }

    /* An exact task dir, as stored by the quiz write action. */
    const byTaskDir = await graderData.findByTaskDir(query)
    if (byTaskDir) {
        return {task_id: byTaskDir.task_id}
    }

    /* Nothing matched exactly : fall back to a substring search over task ids and task dirs. */
    const needle = query.toLowerCase()
    const fromFile = listRegisteredTasks()
        .filter(task => task.task_id.toLowerCase().includes(needle))
        .map(task => ({task_id: task.task_id, kind: 'module', task_dir: null}))
    const registeredIds = new Set(fromFile.map(item => item.task_id))
    const fromDb = (await graderData.search(query, SEARCH_LIMIT))
        .map(row => ({task_id: row.task_id, kind: 'grader', task_dir: row.task_dir}))
        .filter(item => !registeredIds.has(item.task_id))

    return {query, quiz_task_id: quizTaskId(query), results: [...fromFile, ...fromDb]}
}

async function task(req: Request): Promise<ApiTaskResponse> {
    const task_id = req.params.task_id
    const [info, generations, usage] = await Promise.all([
        getTaskInfo(task_id),
        generationsCache.findByTaskId(task_id, GENERATIONS_LIMIT),
        generationsCache.usageForTask(task_id),
    ])

    return {
        heading: heading(info),
        config_rows: configRows(info),
        grader_data: info.grader_data,
        usage: {
            users: Number(usage.users),
            generations: Number(usage.generations),
            last_generation_date: formatDate(usage.last_generation_date),
        },
        generations: generations.map(toApiGeneration),
        admin_versions: info.admin_versions,
    }
}

async function generation(req: Request): Promise<ApiGenerationResponse> {
    const task_id = req.params.task_id
    const generation_id = req.params.generation_id
    const row = await generationsCache.findByGenerationId(generation_id)

    if (!row) {
        throw new AdminError(`No cached generation with id ${generation_id}.`, 404)
    }

    /* Old rows may predate the task/user/platform columns : no set to show then. */
    const hasSet = !!(row.task_id && row.user_id && row.platform_id)
    const [info, sameSet] = await Promise.all([
        getTaskInfo(task_id),
        hasSet ? generationsCache.findBySet(row.task_id!, row.user_id!, row.platform_id!, GENERATIONS_LIMIT) : Promise.resolve(null),
    ])

    return {
        heading: heading(info),
        generation: toApiGeneration(row),
        mismatch: row.task_id && row.task_id !== task_id ? `This generation is recorded under task ${row.task_id}, not ${task_id}.` : null,
        same_set: sameSet ? sameSet.map(toApiGeneration) : null,
    }
}

function versionParam(value: any): string {
    if ('string' !== typeof value || !value) {
        throw new AdminError('Missing version.')
    }

    return value
}

async function cache(req: Request): Promise<ApiCacheResponse> {
    return getCacheElements(req.params.task_id, versionParam(req.query.version))
}

async function action(req: Request): Promise<ApiJobResponse> {
    const body = req.body || {}

    return {job: await runAction(req.params.task_id, versionParam(body.version), req.params.action_id, body.params ?? {})}
}

async function taskJobs(req: Request): Promise<ApiJobsResponse> {
    return {jobs: jobsForTask(req.params.task_id)}
}

async function job(req: Request): Promise<ApiJobResponse> {
    const found = getJob(req.params.job_id)
    if (!found) {
        throw new AdminError('Unknown job (finished jobs are kept for an hour, and lost on restart).', 404)
    }

    return {job: found}
}

export function apiRouter(): Router {
    const router = express.Router()

    router.get('/recent', json(recent))
    router.get('/search', json(search))
    router.get('/task/:task_id', json(task))
    router.get('/task/:task_id/generation/:generation_id', json(generation))
    router.get('/task/:task_id/cache', json(cache))
    router.get('/task/:task_id/jobs', json(taskJobs))
    router.post('/task/:task_id/actions/:action_id', requireAdminRequest, json(action, 202))
    router.get('/jobs/:job_id', json(job))
    router.use((req: Request, res: Response) => {
        res.status(404).json({error: 'Unknown API endpoint.'})
    })

    return router
}
