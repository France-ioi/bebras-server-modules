import {useCallback, useEffect, useState} from 'react';
import type {ApiJob, ApiJobResponse} from '../../src/libs/admin/api_types';

const API = import.meta.env.BASE_URL + 'api'

/* Must match ADMIN_REQUEST_HEADER / ADMIN_REQUEST_VALUE in src/libs/admin/api.ts. */
const ADMIN_HEADERS = {'X-Requested-With': 'bsm-admin'}

export async function apiGet<T>(path: string): Promise<T> {
    return request<T>(path, {headers: ADMIN_HEADERS})
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
    return request<T>(path, {
        method: 'POST',
        headers: {...ADMIN_HEADERS, 'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    })
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(API + path, init)
    const data = await response.json().catch(() => null)
    if (!response.ok) {
        throw new Error(data && data.error ? data.error : `HTTP ${response.status}`)
    }

    return data as T
}

export function taskPath(taskId: string): string {
    return '/task/' + encodeURIComponent(taskId)
}

export function generationPath(taskId: string, generationId: string): string {
    return taskPath(taskId) + '/generation/' + encodeURIComponent(generationId)
}

/* GET on mount and whenever the path changes. A null path fetches nothing. */
export function useApi<T>(path: string|null): {data: T|null, error: string|null, loading: boolean, reload: () => void} {
    const [state, setState] = useState<{data: T|null, error: string|null, loading: boolean}>({data: null, error: null, loading: !!path})
    const [version, setVersion] = useState(0)

    useEffect(() => {
        if (!path) {
            setState({data: null, error: null, loading: false})
            return
        }
        let alive = true
        setState(previous => ({...previous, loading: true, error: null}))
        apiGet<T>(path).then(
            data => alive && setState({data, error: null, loading: false}),
            error => alive && setState({data: null, error: error.message, loading: false}),
        )

        return () => {
            alive = false
        }
    }, [path, version])

    const reload = useCallback(() => setVersion(v => v + 1), [])

    return {...state, reload}
}

const POLL_INTERVAL = 1000

/* Polls a job until it finishes, reporting each state. Stops early when isAlive() turns false. */
export async function followJob(job: ApiJob, onUpdate: (job: ApiJob) => void, isAlive: () => boolean = () => true): Promise<ApiJob> {
    let current = job
    onUpdate(current)
    while ('running' === current.status && isAlive()) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
        if (!isAlive()) {
            break
        }
        current = (await apiGet<ApiJobResponse>('/jobs/' + encodeURIComponent(current.id))).job
        onUpdate(current)
    }

    return current
}

/* Starts an action and waits for it ; rejects with the action's error. */
export async function runAction(taskId: string, versionId: string, actionId: string, params: any, onUpdate: (job: ApiJob) => void = () => {}, isAlive?: () => boolean): Promise<ApiJob> {
    const {job} = await apiPost<ApiJobResponse>(taskPath(taskId) + '/actions/' + encodeURIComponent(actionId), {version: versionId, params})
    const finished = await followJob(job, onUpdate, isAlive)
    if ('error' === finished.status) {
        throw new Error(finished.error || 'Action failed')
    }

    return finished
}
