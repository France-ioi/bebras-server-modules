import React, {ReactNode, useEffect} from 'react';
import {Link} from 'react-router';
import type {ApiTaskHeading} from '../../../src/libs/admin/api_types';

export function Layout({title, children}: {title: string, children: ReactNode}) {
    useEffect(() => {
        document.title = `${title} — AI admin`
    }, [title])

    return <>
        <header><Link to="/">AI admin</Link><span>{title}</span></header>
        <main>{children}</main>
    </>
}

export function Warning({children}: {children: ReactNode}) {
    return <p className="warning">{children}</p>
}

export function Note({children}: {children: ReactNode}) {
    return <p className="note">{children}</p>
}

export function Empty({children}: {children: ReactNode}) {
    return <p className="empty">{children}</p>
}

export function Loading() {
    return <p className="empty">Loading…</p>
}

/* Task dir as the title when known, with the (opaque) task id underneath. */
export function TaskHeading({heading}: {heading: ApiTaskHeading}) {
    return <>
        {heading.task_dir
            ? <><h1>{heading.task_dir}</h1><p className="muted">{heading.task_id}</p></>
            : <h1>{heading.task_id}</h1>}
        {heading.warnings.map((warning, index) => <Warning key={index}>{warning}</Warning>)}
    </>
}

export function KvTable({rows}: {rows: [string, ReactNode][]}) {
    return <table className="kv">
        <tbody>
        {rows.map(([key, value]) => <tr key={key}>
            <th>{key}</th>
            <td>{undefined === value || null === value || '' === value ? <span className="empty">—</span> : value}</td>
        </tr>)}
        </tbody>
    </table>
}
