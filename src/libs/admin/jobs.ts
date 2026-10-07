import uuid from 'uuid';

export type JobStatus = 'running'|'done'|'error';

export interface Job {
    id: string;
    task_id: string;
    version_id: string;
    action_id: string;
    status: JobStatus;
    progress: number;
    message: string|null;
    log: string[];
    error: string|null;
    started_at: string;
    finished_at: string|null;
}

export interface JobHooks {
    progress(percent: number, message?: string): void;
    log(message: string): void;
}

/* Finished jobs stay visible for a while, so a reload still shows how the last run ended. */
const FINISHED_JOB_TTL = 3600 * 1000
const MAX_LOG_LINES = 500

/* In memory : the admin lives in the single `ai` process. Running jobs are lost on restart. */
const jobs = new Map<string, Job>()

export class JobConflict extends Error {}

function prune(): void {
    const limit = Date.now() - FINISHED_JOB_TTL
    for (const [id, job] of jobs) {
        if (job.finished_at && new Date(job.finished_at).getTime() < limit) {
            jobs.delete(id)
        }
    }
}

export function startJob(task_id: string, version_id: string, action_id: string, run: (hooks: JobHooks) => Promise<any>): Job {
    prune()

    for (const job of jobs.values()) {
        if ('running' === job.status && job.task_id === task_id && job.version_id === version_id && job.action_id === action_id) {
            throw new JobConflict(`Action ${action_id} is already running for this task.`)
        }
    }

    const job: Job = {
        id: uuid.v4(),
        task_id,
        version_id,
        action_id,
        status: 'running',
        progress: 0,
        message: null,
        log: [],
        error: null,
        started_at: new Date().toISOString(),
        finished_at: null,
    }
    jobs.set(job.id, job)

    const hooks: JobHooks = {
        progress(percent: number, message?: string) {
            const value = Number(percent)
            if (!isNaN(value)) {
                job.progress = Math.max(0, Math.min(100, value))
            }
            if (undefined !== message) {
                job.message = null === message ? null : String(message)
            }
        },
        log(message: string) {
            job.log.push(String(message))
            if (job.log.length > MAX_LOG_LINES) {
                job.log.splice(0, job.log.length - MAX_LOG_LINES)
            }
        },
    }

    /* Deferred so a synchronous throw in the action is reported on the job, not to the caller. */
    Promise.resolve()
        .then(() => run(hooks))
        .then(() => {
            job.status = 'done'
            job.progress = 100
        })
        .catch((error) => {
            console.error(`Admin action ${action_id} failed on task ${task_id}`, error)
            job.status = 'error'
            job.error = error && error.message ? error.message : String(error)
        })
        .finally(() => {
            job.finished_at = new Date().toISOString()
        })

    return job
}

export function getJob(id: string): Job|null {
    return jobs.get(id) || null
}

export function jobsForTask(task_id: string): Job[] {
    prune()

    return [...jobs.values()]
        .filter(job => job.task_id === task_id)
        .sort((a, b) => b.started_at.localeCompare(a.started_at))
}
