import {useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router';
import type {ApiRecentResponse, ApiSearchResponse} from '../../../src/libs/admin/api_types';
import {taskPath, useApi} from '../api';
import {Empty, Layout, Loading, Note, Warning} from '../ui/Layout';
import {GenerationsTable} from '../ui/GenerationsTable';

function SearchForm({query}: {query: string}) {
    const [value, setValue] = useState(query)
    const [, setSearchParams] = useSearchParams()

    useEffect(() => setValue(query), [query])

    return <form className="search" onSubmit={(event) => {
        event.preventDefault()
        const q = value.trim()
        setSearchParams(q ? {q} : {})
    }}>
        <input type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Task path, or task id…" autoFocus/>
        <button type="submit">Search</button>
    </form>
}

function Recent() {
    const {data, error} = useApi<ApiRecentResponse>('/recent')

    return <>
        <h2>Latest AI generations</h2>
        {error ? <Warning>{error}</Warning> : !data ? <Loading/> : <GenerationsTable rows={data.generations} showTaskDir/>}
    </>
}

function SearchResults({query}: {query: string}) {
    const navigate = useNavigate()
    const {data, error} = useApi<ApiSearchResponse>('/search?q=' + encodeURIComponent(query))

    /* An exact match goes straight to the task page. */
    useEffect(() => {
        if (data && 'task_id' in data) {
            navigate(taskPath(data.task_id), {replace: true})
        }
    }, [data, navigate])

    if (error) {
        return <Warning>{error}</Warning>
    }
    if (!data || 'task_id' in data) {
        return <Loading/>
    }

    return <>
        <Note>No exact match for this task path (looked up {data.quiz_task_id}).</Note>
        <h2>{data.results.length} task(s) matching "{data.query}"</h2>
        {data.results.length
            ? <ul className="results">
                {data.results.map(item => <li key={item.task_id}>
                    <Link to={taskPath(item.task_id)}>{item.task_id}</Link>
                    {' '}<span className="badge tag">{item.kind}</span>
                    {item.task_dir ? <div className="muted">{item.task_dir}</div> : null}
                </li>)}
            </ul>
            : <Empty>No task found.</Empty>}
    </>
}

export default function SearchPage() {
    const [searchParams] = useSearchParams()
    const query = (searchParams.get('q') || '').trim()

    return <Layout title={query ? `Search: ${query}` : 'Search'}>
        <SearchForm query={query}/>
        {query ? <SearchResults key={query} query={query}/> : <Recent/>}
    </Layout>
}
