import path from "path";
import fs from "fs";
import safeEval from "safe-eval";
import graderData from "../../repositories/grader_data";
import {TaskConfig} from "../../types";

export interface TaskInfo {
    task_id: string;
    /* 'module': registered in tasks.json ; 'grader': a graders row pointing at a template */
    source: 'module'|'grader'|'unknown';
    file: string|null;
    template: string|null;
    config: Partial<TaskConfig>|null;
    task_dir: string|null;
    grader_data: string|null;
    warnings: string[];
}

/* tasks.json is read at require time by libs/tasks.ts too ; re-read it here so the
   panel reflects the file on disk without restarting the process. */
function readTasksJson(): Record<string, string> {
    const file = path.resolve(process.cwd(), 'tasks.json')
    if (!fs.existsSync(file)) {
        return {}
    }
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (e) {
        return {}
    }
}

export function listRegisteredTasks(): {task_id: string, file: string}[] {
    const tasks = readTasksJson()

    return Object.keys(tasks).sort().map(task_id => ({task_id, file: tasks[task_id]}))
}

function moduleConfig(file: string, warnings: string[]): Partial<TaskConfig>|null {
    try {
        /* A plain require has no side effect ; loadGraderData (which mutates module-level
           config shared with live requests) is deliberately never called here. */
        return require(path.resolve(process.cwd(), file)).config || null
    } catch (e) {
        warnings.push(`Could not load task module ${file}: ${(e as Error).message}`)

        return null
    }
}

export async function getTaskInfo(task_id: string): Promise<TaskInfo> {
    const warnings: string[] = []
    const tasks = readTasksJson()

    if (task_id in tasks) {
        return {
            task_id,
            source: 'module',
            file: tasks[task_id],
            template: null,
            config: moduleConfig(tasks[task_id], warnings),
            task_dir: null,
            grader_data: null,
            warnings,
        }
    }

    const row = await graderData.readByTaskId(task_id)
    if (null === row) {
        return {task_id, source: 'unknown', file: null, template: null, config: null, task_dir: null, grader_data: null, warnings}
    }
    const raw = row.data

    let inner: {taskTemplate?: string, config?: Partial<TaskConfig>} = {}
    try {
        inner = safeEval(raw)
    } catch (e) {
        warnings.push(`Unreadable grader data: ${(e as Error).message}`)

        return {task_id, source: 'grader', file: null, template: null, config: null, task_dir: row.task_dir, grader_data: raw, warnings}
    }

    const template = inner.taskTemplate || null
    let config: Partial<TaskConfig>|null = inner.config || null

    if (template) {
        if (template in tasks) {
            const templateConfig = moduleConfig(tasks[template], warnings)
            /* Same merge loadGraderData performs, but computed rather than applied. */
            config = {...(templateConfig || {}), ...(inner.config || {})}
        } else {
            warnings.push(`Task template not found in tasks.json: ${template}`)
        }
    } else {
        warnings.push('No taskTemplate in the grader data')
    }

    return {task_id, source: 'grader', file: template && tasks[template] ? tasks[template] : null, template, config, task_dir: row.task_dir, grader_data: raw, warnings}
}
