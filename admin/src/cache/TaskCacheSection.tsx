import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {ApiAdminVersion, ApiCacheResponse, ApiJob, ApiJobResponse, ApiJobsResponse} from '../../../src/libs/admin/api_types';
import {apiGet, apiPost, followJob, runAction, taskPath, useApi} from '../api';
import {Loading, Warning} from '../ui/Layout';
import {ImageLightbox} from '../ui/ImageLightbox';
import {CacheGrid} from './CacheGrid';
import {ConfirmDialog} from '../ui/Dialog';

export function TaskCacheSection({taskId, versions}: {taskId: string, versions: ApiAdminVersion[]}) {
    return <>
        <h2>Task cache</h2>
        {versions.map(version => <VersionCache key={version.version_id} taskId={taskId} version={version} showVersion={versions.length > 1}/>)}
    </>
}

function useAlive(): () => boolean {
    const alive = useRef(true)
    useEffect(() => {
        alive.current = true

        return () => {
            alive.current = false
        }
    }, [])

    return useCallback(() => alive.current, [])
}

function VersionCache({taskId, version, showVersion}: {taskId: string, version: ApiAdminVersion, showVersion: boolean}) {
    const versionId = version.version_id
    const cache = useApi<ApiCacheResponse>(version.has_cache ? taskPath(taskId) + '/cache?version=' + encodeURIComponent(versionId) : null)
    const reloadCache = cache.reload
    const isAlive = useAlive()
    const [lightbox, setLightbox] = useState<string|null>(null)
    /* Latest job of each global action of this version. */
    const [jobs, setJobs] = useState<Record<string, ApiJob>>({})
    const [startError, setStartError] = useState<string|null>(null)
    /* Global action waiting for the admin's confirmation. */
    const [confirming, setConfirming] = useState<{id: string, label: string, confirm: string}|null>(null)

    const track = useCallback((job: ApiJob) => {
        setJobs(previous => ({...previous, [job.action_id]: job}))
    }, [])

    const follow = useCallback((job: ApiJob) => {
        followJob(job, track, isAlive)
            .then((finished) => {
                if ('running' !== finished.status) {
                    reloadCache()
                }
            })
            .catch((error) => setStartError(error.message))
    }, [track, isAlive, reloadCache])

    /* After a reload, show the last run of each action, and pick up the ones still running. */
    useEffect(() => {
        apiGet<ApiJobsResponse>(taskPath(taskId) + '/jobs').then((response) => {
            const latest: Record<string, ApiJob> = {}
            for (const job of response.jobs) {
                if (job.version_id === versionId && !(job.action_id in latest)) {
                    latest[job.action_id] = job
                }
            }
            for (const action of version.global_actions) {
                const job = latest[action.id]
                if (job) {
                    'running' === job.status ? follow(job) : track(job)
                }
            }
        }, () => {})
    }, [taskId, versionId])

    /* The job's own error shows in its status : only a failure to start lands in startError. */
    const startGlobal = (actionId: string) => {
        setStartError(null)
        apiPost<ApiJobResponse>(taskPath(taskId) + '/actions/' + encodeURIComponent(actionId), {version: versionId, params: {}})
            .then(({job}) => follow(job), (error) => setStartError(error.message))
    }

    const runElementAction = async (actionId: string, params: any) => {
        await runAction(taskId, versionId, actionId, params, () => {}, isAlive)
        reloadCache()
    }

    return <div className="cache-version">
        {showVersion ? <h3>Version {versionId}</h3> : null}

        {version.global_actions.length
            ? <div className="global-actions">
                {version.global_actions.map(action => {
                    const job = jobs[action.id]
                    const running = 'running' === job?.status

                    return <div className="global-action" key={action.id}>
                        <button type="button" className="primary" disabled={running} onClick={() => action.confirm ? setConfirming({id: action.id, label: action.label, confirm: action.confirm}) : startGlobal(action.id)}>
                            {action.label}
                        </button>
                        {job ? <JobStatus job={job}/> : null}
                    </div>
                })}
            </div>
            : null}
        {startError ? <Warning>{startError}</Warning> : null}

        {!version.has_cache
            ? null
            : cache.error
                ? <Warning>Could not read the cache: {cache.error}</Warning>
                : !cache.data
                    ? <Loading/>
                    : <CacheGrid schema={cache.data.schema} values={cache.data.values} runAction={runElementAction} onImage={setLightbox}/>}

        {lightbox ? <ImageLightbox src={lightbox} onClose={() => setLightbox(null)}/> : null}
        {confirming
            ? <ConfirmDialog title={confirming.label} message={confirming.confirm} confirmLabel={confirming.label}
                             busy={false} error={null} onClose={() => setConfirming(null)}
                             onConfirm={() => {
                                 setConfirming(null)
                                 startGlobal(confirming.id)
                             }}/>
            : null}
    </div>
}

/* HH:mm:ss, 24-hour, whatever the browser locale. */
function formatTime(value: string): string {
    const date = new Date(value)
    const pad = (n: number) => String(n).padStart(2, '0')

    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function JobStatus({job}: {job: ApiJob}) {
    const progress = Math.round(job.progress)

    return <div className={`job job-${job.status}`}>
        <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar" style={{width: `${progress}%`}}/>
        </div>
        <div className="job-line">
            <span className={`badge ${'error' === job.status ? 'expired' : 'done' === job.status ? 'ok' : 'tag'}`}>
                {'running' === job.status ? `${progress}%` : job.status}
            </span>
            {job.message ? <span>{job.message}</span> : null}
            <span className="muted">started {formatTime(job.started_at)}</span>
        </div>
        {job.error ? <p className="warning">{job.error}</p> : null}
        {job.log.length
            ? <details><summary>Log ({job.log.length})</summary><pre>{job.log.join('\n')}</pre></details>
            : null}
    </div>
}
