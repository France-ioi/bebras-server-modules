import {Link, useParams} from 'react-router';
import type {ApiTaskResponse} from '../../../src/libs/admin/api_types';
import {taskPath, useApi} from '../api';
import {KvTable, Layout, Loading, TaskHeading, Warning} from '../ui/Layout';
import {GenerationsTable} from '../ui/GenerationsTable';
import {TaskCacheSection} from '../cache/TaskCacheSection';

export default function TaskPage() {
    const taskId = useParams().taskId!
    const {data, error} = useApi<ApiTaskResponse>(taskPath(taskId))

    if (error || !data) {
        return <Layout title={taskId}>{error ? <Warning>{error}</Warning> : <Loading/>}</Layout>
    }

    return <Layout title={data.heading.task_dir || taskId}>
        <TaskHeading heading={data.heading}/>
        <p><Link to="/">← Back to search</Link></p>

        <h2>Configuration</h2>
        <KvTable rows={data.config_rows}/>
        {data.grader_data
            ? <details><summary style={{cursor: 'pointer'}}>Grader data</summary><pre>{data.grader_data}</pre></details>
            : null}

        <h2>AI quota usage</h2>
        <KvTable rows={[
            ['Users with at least 1 generation', data.usage.users],
            ['Total generations', data.usage.generations],
            ['Last generation', data.usage.last_generation_date || '—'],
        ]}/>

        {data.admin_versions.length
            ? <TaskCacheSection taskId={taskId} versions={data.admin_versions}/>
            : null}

        <h2>Cached generations</h2>
        <GenerationsTable rows={data.generations}/>
    </Layout>
}
