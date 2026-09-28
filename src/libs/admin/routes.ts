import express, {Express, Request, Response, Router} from 'express';
import crypto from 'crypto';
import basicAuth from '../../middleware/basic_auth';
import generationsCache from '../../repositories/ai_generations_cache';
import graderData from '../../repositories/grader_data';
import taskData from '../../repositories/task_data';
import {getTaskInfo, listRegisteredTasks, TaskInfo} from './task_info';
import {
    BASE_PATH,
    empty,
    errorPage,
    esc,
    formatDate,
    generationsTable,
    kvTable,
    layout,
    note,
    platformLabel,
    renderResult,
    resultsList,
    searchForm,
    taskUrl,
    warning,
} from './views';

const TASK_DATA_KEY = '___TASK_DATA'
const SEARCH_LIMIT = 100
const GENERATIONS_LIMIT = 100
const RECENT_LIMIT = 50

class NotFound extends Error {}

class Redirect extends Error {
    constructor(public readonly location: string) {
        super(location)
    }
}

function page(render: (req: Request, res: Response) => Promise<string>) {
    return function (req: Request, res: Response): void {
        render(req, res)
            .then((html) => {
                if (!res.headersSent) {
                    res.type('text/html').send(html)
                }
            })
            .catch((error) => {
                if (error instanceof Redirect) {
                    if (!res.headersSent) {
                        res.redirect(302, error.location)
                    }
                    return
                }
                if (!(error instanceof NotFound)) {
                    throw error
                }
                if (!res.headersSent) {
                    res.status(404).type('text/html').send(errorPage('Not found', error.message))
                }
            })
            .catch((error) => {
                console.error('Admin panel error', error)
                if (!res.headersSent) {
                    res.status(500).type('text/html').send(errorPage('Error', (error as Error).message || 'Unknown error'))
                }
            })
    }
}

function configRows(info: TaskInfo): [string, any][] {
    const config: any = info.config || {}

    return [
        ['Task directory', info.task_dir],
        ['Template', info.template],
        ['Task AI quotas', config.ai_quota ? JSON.stringify(config.ai_quota) : null],
    ]
}

/* Task dir as the title when known, with the (opaque) task id underneath. */
function taskHeading(info: TaskInfo): string {
    const title = info.task_dir
        ? `<h1>${esc(info.task_dir)}</h1><p class="muted">${esc(info.task_id)}</p>`
        : `<h1>${esc(info.task_id)}</h1>`

    return title + info.warnings.map(warning).join('')
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

async function homePage(req: Request): Promise<string> {
    const query = 'string' === typeof req.query.q ? req.query.q.trim() : ''

    if (!query) {
        const recent = await generationsCache.recent(RECENT_LIMIT)

        return layout('Search', searchForm('')
            + `<h2>Latest AI generations</h2>`
            + generationsTable(recent, true))
    }

    /* A task path resolves to its quiz id ; a task id pasted as-is is accepted too. */
    for (const candidate of [quizTaskId(query), query]) {
        if (await taskExists(candidate)) {
            throw new Redirect(taskUrl(candidate))
        }
    }

    /* An exact task dir, as stored by the quiz write action. */
    const byTaskDir = await graderData.findByTaskDir(query)
    if (byTaskDir) {
        throw new Redirect(taskUrl(byTaskDir.task_id))
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

    return layout(`Search: ${query}`, searchForm(query)
        + note(`No exact match for this task path (looked up ${quizTaskId(query)}).`)
        + `<h2>${fromFile.length + fromDb.length} task(s) matching "${esc(query)}"</h2>`
        + resultsList([...fromFile, ...fromDb]))
}

async function taskPage(req: Request): Promise<string> {
    const task_id = req.params.task_id
    const [info, generations, usage, dataRows] = await Promise.all([
        getTaskInfo(task_id),
        generationsCache.findByTaskId(task_id, GENERATIONS_LIMIT),
        generationsCache.usageForTask(task_id),
        taskData.listByTaskId(task_id, TASK_DATA_KEY, 50),
    ])

    const usageBlock = kvTable([
        ['Users with at least 1 generation', usage.users],
        ['Total generations', usage.generations],
        ['Last generation', formatDate(usage.last_generation_date)],
    ])

    const graderBlock = info.grader_data
        ? `<details><summary style="cursor: pointer">Grader data</summary><pre>${esc(info.grader_data)}</pre></details>`
        : ''

    return layout(info.task_dir || task_id, taskHeading(info)
        + `<p><a href="${BASE_PATH}">← Back to search</a></p>`
        + `<h2>Configuration</h2>` + kvTable(configRows(info)) + graderBlock
        + `<h2>AI quota usage</h2>` + usageBlock
        + `<h2>Cached generations</h2>` + generationsTable(generations))
}

async function generationPage(req: Request): Promise<string> {
    const task_id = req.params.task_id
    const generation_id = req.params.generation_id
    const row = await generationsCache.findByGenerationId(generation_id)

    if (!row) {
        throw new NotFound(`No cached generation with id ${generation_id}.`)
    }

    /* Old rows may predate the task/user/platform columns : no set to show then. */
    const hasSet = !!(row.task_id && row.user_id && row.platform_id)
    const [info, sameSet] = await Promise.all([
        getTaskInfo(task_id),
        hasSet ? generationsCache.findBySet(row.task_id!, row.user_id!, row.platform_id!, GENERATIONS_LIMIT) : Promise.resolve([]),
    ])
    const mismatch = row.task_id && row.task_id !== task_id
        ? warning(`This generation is recorded under task ${row.task_id}, not ${task_id}.`)
        : ''
    const expired = row.expires_at ? new Date(row.expires_at).getTime() <= Date.now() : false

    const meta = kvTable([
        ['Task directory', info.task_dir],
        ['Generation id', row.generation_id],
        ['Type', row.generation_type],
        ['Model', row.model],
        ['First generated by (user / platform)', `${row.user_id || '—'} / ${platformLabel(row)}`],
        ['Created at', formatDate(row.created_at)],
        ['Expires at', row.expires_at ? `${formatDate(row.expires_at)} (${expired ? 'expired' : 'valid'})` : 'never'],
    ])

    return layout(`Generation ${generation_id}`, taskHeading(info)
        + `<p><a href="${taskUrl(task_id)}">← Back to task</a></p>`
        + mismatch
        + `<h2>Generation</h2>` + meta
        + `<h2>Prompt</h2>` + (row.prompt ? `<pre>${esc(row.prompt)}</pre>` : empty('Not recorded (generation cached before the prompt column existed).'))
        + `<h2>Result</h2>` + renderResult(row.generation_result)
        + `<h2>All generations by this user on this task</h2>`
        + (hasSet ? generationsTable(sameSet, false, row.generation_id) : empty('User or platform not recorded for this generation.')))
}

export function adminRouter(): Router {
    const router = express.Router()

    router.use(basicAuth())
    router.get('/', page(homePage))
    router.get('/task/:task_id', page(taskPage))
    router.get('/task/:task_id/generation/:generation_id', page(generationPage))

    return router
}

export default function registerAdminRoutes(app: Express): void {
    app.use(BASE_PATH, adminRouter())
}
