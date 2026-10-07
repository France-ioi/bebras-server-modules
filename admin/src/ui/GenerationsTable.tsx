import {Link} from 'react-router';
import type {ApiGeneration} from '../../../src/libs/admin/api_types';
import {generationPath, taskPath} from '../api';
import {Empty} from './Layout';

function truncate(value: string|null, length: number): string {
    if (!value) {
        return ''
    }
    const flat = value.replace(/\s+/g, ' ').trim()

    return flat.length > length ? flat.slice(0, length) + '…' : flat
}

function Dash({value}: {value: string|null|undefined}) {
    return value ? <>{value}</> : <span className="empty">—</span>
}

/* Shows the task dir, falling back to the task id, and always links to the task page. */
function TaskDirCell({row}: {row: ApiGeneration}) {
    if (!row.task_id) {
        return <span className="empty">unknown task</span>
    }

    return <>
        <Link to={taskPath(row.task_id)}>{row.task_dir || row.task_id}</Link>
        {row.task_dir ? <div className="muted">{row.task_id}</div> : null}
    </>
}

/* The task dir column is only shown on the home page, where rows span several tasks.
   The row matching currentGenerationId, if any, is highlighted. */
export function GenerationsTable({rows, showTaskDir = false, currentGenerationId = null}: {rows: ApiGeneration[], showTaskDir?: boolean, currentGenerationId?: string|null}) {
    if (!rows.length) {
        return <Empty>No cached generation.</Empty>
    }

    return <div className="scroll">
        <table>
            <thead>
            <tr>
                <th className="nowrap">Created</th>
                {showTaskDir ? <th>Task dir</th> : null}
                <th className="nowrap">Type</th>
                <th>Model</th>
                <th className="nowrap">User / platform</th>
                <th>Prompt</th>
                <th>Output</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            {rows.map(row => <tr key={row.generation_id} className={row.generation_id === currentGenerationId ? 'current' : undefined}>
                <td className="nowrap">{row.created_at || '—'}</td>
                {showTaskDir ? <td><TaskDirCell row={row}/></td> : null}
                <td className="nowrap">{row.generation_type || '—'}</td>
                <td>{row.model || '—'}</td>
                <td className="nowrap">{row.user_id || '—'} / {row.platform_label}</td>
                <td><Dash value={truncate(row.prompt, 90)}/></td>
                <td><Dash value={truncate(row.generation_result, 90)}/></td>
                <td className="nowrap"><Link to={generationPath(row.task_id || '-', row.generation_id)}>view</Link></td>
            </tr>)}
            </tbody>
        </table>
    </div>
}
