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
    admin_versions: AdminVersionSummary[];
    warnings: string[];
}

export interface AdminActionDefinition {
    global?: boolean;
    label?: string;
    /* Asked before running a global action. */
    confirm?: string;
    action: (context: any, params?: any) => any;
}

export interface AdminDefinition {
    getCacheElements?: (context: any) => any;
    actions?: Record<string, AdminActionDefinition>;
    /* Read at runtime by the task (loadTaskCache action of the ai handler) ; may fill the cache first. */
    loaders?: Record<string, (context: any) => any>;
}

export interface AdminVersion {
    version: any;
    admin: AdminDefinition;
}

export interface AdminVersionSummary {
    version_id: string;
    has_cache: boolean;
    global_actions: {id: string, label: string, confirm: string|null}[];
}

/* Each version of the grader data, paired with the template's admin : the template defines the
   cache and its actions, the version brings the task's own prompts (passed as context.version). */
function adminVersions(inner: any, admin: AdminDefinition|null): Record<string, AdminVersion> {
    const versions: Record<string, AdminVersion> = {}
    if (!admin) {
        return versions
    }
    const all = inner && 'object' === typeof inner.versions && inner.versions ? inner.versions : {}

    for (const version_id of Object.keys(all)) {
        if (all[version_id] && 'object' === typeof all[version_id]) {
            versions[version_id] = {version: all[version_id], admin}
        }
    }

    return versions
}

function summarizeAdminVersions(versions: Record<string, AdminVersion>): AdminVersionSummary[] {
    return Object.keys(versions).map(version_id => {
        const {admin} = versions[version_id]
        const actions = admin.actions || {}

        return {
            version_id,
            has_cache: 'function' === typeof admin.getCacheElements,
            global_actions: Object.keys(actions)
                .filter(id => actions[id] && actions[id].global)
                .map(id => ({id, label: actions[id].label || id, confirm: actions[id].confirm || null})),
        }
    })
}

/* The `admin` export of the task template module, if any. */
function templateAdmin(template: string|undefined|null, tasks: Record<string, string>, warnings: string[]): AdminDefinition|null {
    if (!template || !(template in tasks)) {
        return null
    }
    const module = loadModule(tasks[template], warnings)

    return module && module.admin && 'object' === typeof module.admin ? module.admin : null
}

/* Evaluated afresh on each call : the admin functions get the grader data as stored. */
export async function loadAdminVersions(task_id: string): Promise<Record<string, AdminVersion>> {
    const row = await graderData.readByTaskId(task_id)
    if (null === row) {
        return {}
    }
    const inner = safeEval(row.data)

    return adminVersions(inner, templateAdmin(inner && inner.taskTemplate, readTasksJson(), []))
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

function loadModule(file: string, warnings: string[]): any {
    try {
        /* A plain require has no side effect ; loadGraderData (which mutates module-level
           config shared with live requests) is deliberately never called here. */
        return require(path.resolve(process.cwd(), file))
    } catch (e) {
        warnings.push(`Could not load task module ${file}: ${(e as Error).message}`)

        return null
    }
}

function moduleConfig(file: string, warnings: string[]): Partial<TaskConfig>|null {
    const module = loadModule(file, warnings)

    return module ? module.config || null : null
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
            admin_versions: [],
            warnings,
        }
    }

    const row = await graderData.readByTaskId(task_id)
    if (null === row) {
        return {task_id, source: 'unknown', file: null, template: null, config: null, task_dir: null, grader_data: null, admin_versions: [], warnings}
    }
    const raw = row.data

    let inner: {taskTemplate?: string, config?: Partial<TaskConfig>, versions?: any} = {}
    try {
        inner = safeEval(raw)
    } catch (e) {
        warnings.push(`Unreadable grader data: ${(e as Error).message}`)

        return {task_id, source: 'grader', file: null, template: null, config: null, task_dir: row.task_dir, grader_data: raw, admin_versions: [], warnings}
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

    return {
        task_id,
        source: 'grader',
        file: template && tasks[template] ? tasks[template] : null,
        template,
        config,
        task_dir: row.task_dir,
        grader_data: raw,
        admin_versions: summarizeAdminVersions(adminVersions(inner, templateAdmin(template, tasks, []))),
        warnings,
    }
}
