import {AdminGenerationRow} from "../../repositories/ai_generations_cache";

type TableRow = AdminGenerationRow & {task_dir?: string|null};

export const BASE_PATH = '/ai/admin'

/* Everything interpolated into a page goes through this : generation results are raw model output. */
export function esc(value: any): string {
    if (null === value || undefined === value) {
        return ''
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export function taskUrl(task_id: string): string {
    return BASE_PATH + '/task/' + encodeURIComponent(task_id)
}

export function generationUrl(task_id: string, generation_id: string): string {
    return taskUrl(task_id) + '/generation/' + encodeURIComponent(generation_id)
}

function truncate(value: string|null, length: number): string {
    if (!value) {
        return ''
    }
    const flat = value.replace(/\s+/g, ' ').trim()

    return flat.length > length ? flat.slice(0, length) + '…' : flat
}

function formatDate(value: string|null): string {
    if (!value) {
        return '—'
    }
    const date = new Date(value)

    if (isNaN(date.getTime())) {
        return String(value)
    }
    // DATETIME columns are filled with NOW() (server local time) and parsed by
    // the mysql driver as local time: format with local getters, not toISOString (UTC).
    const pad = (n: number) => String(n).padStart(2, '0')

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const STYLE = `
    :root { color-scheme: dark; }
    body { margin: 0; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    header { padding: 12px 24px; background: #1f2933; color: #fff; display: flex; align-items: baseline; gap: 16px; }
    header a { color: #fff; text-decoration: none; font-weight: 600; }
    header span { color: #9aa5b1; font-size: 13px; }
    main { padding: 24px;  }
    h1 { font-size: 20px; margin: 0 0 4px; word-break: break-all; }
    h2 { font-size: 15px; margin: 28px 0 8px; text-transform: uppercase; letter-spacing: .04em; color: #52606d; }
    a { color: #2456a6; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
    th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #d9dee3; vertical-align: top; }
    th { background: #2456a6; font-weight: 600; white-space: nowrap; }
    td.nowrap, th.nowrap { white-space: nowrap; }
    table.kv th { width: 210px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #2a2a2a; border: 1px solid #d9dee3; padding: 12px; border-radius: 4px; max-height: 32em; overflow: auto; }
    form.search { margin-bottom: 20px; display: flex; gap: 8px; }
    form.search input { flex: 1; max-width: 420px; padding: 7px 10px; border: 1px solid #9aa5b1; border-radius: 4px; font-size: 14px; }
    form.search button { padding: 7px 16px; font-size: 14px; }
    .badge { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
    .badge.ok { background: #c6f7e2; color: #147d64; }
    .badge.expired { background: #ffe3e3; color: #ab091e; }
    .badge.tag { background: #e1e7ec; color: #3e4c59; }
    .warning { background: #fff3c4; border: 1px solid #f7c948; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; }
    .empty { color: #7b8794; font-style: italic; }
    .muted { color: #7b8794; font-size: 12px; }
    .scroll { overflow-x: auto; }
    tr.current td { background: rgba(247, 201, 72, .25); }
    tr.current td:first-child { box-shadow: inset 3px 0 0 #f7c948; }
    .note { background: #2a2a2a; border: 1px solid #d9dee3; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; color: #3e4c59; }
    img.result { max-width: 100%; border: 1px solid #d9dee3; }
    ul.results { list-style: none; padding: 0; }
    ul.results li { padding: 7px 0; border-bottom: 1px solid #e4e7eb; }
`

export function layout(title: string, body: string): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — AI admin</title>
<style>${STYLE}</style>
</head>
<body>
<header><a href="${BASE_PATH}">AI admin</a><span>${esc(title)}</span></header>
<main>${body}</main>
</body>
</html>`
}

export function searchForm(query: string): string {
    return `<form class="search" method="get" action="${BASE_PATH}">
    <input type="search" name="q" value="${esc(query)}" placeholder="Task path, or task id…" autofocus>
    <button type="submit">Search</button>
</form>`
}

export function warning(message: string): string {
    return `<p class="warning">${esc(message)}</p>`
}

export function note(message: string): string {
    return `<p class="note">${esc(message)}</p>`
}

export function empty(message: string): string {
    return `<p class="empty">${esc(message)}</p>`
}

export function resultsList(items: {task_id: string, kind: string, task_dir?: string|null}[]): string {
    if (!items.length) {
        return empty('No task found.')
    }

    return `<ul class="results">` + items.map(item => `<li>
    <a href="${taskUrl(item.task_id)}">${esc(item.task_id)}</a>
    <span class="badge tag">${esc(item.kind)}</span>
    ${item.task_dir ? `<div class="muted">${esc(item.task_dir)}</div>` : ''}
</li>`).join('') + `</ul>`
}

/* Platform name, falling back to the raw id when the platform row is gone. */
export function platformLabel(row: AdminGenerationRow): string {
    return row.platform_name || row.platform_id || '—'
}

export function kvTable(rows: [string, any][]): string {
    return `<table class="kv">` + rows.map(([key, value]) => `<tr>
    <th>${esc(key)}</th>
    <td>${undefined === value || null === value || '' === value ? '<span class="empty">—</span>' : esc(value)}</td>
</tr>`).join('') + `</table>`
}

/* The task dir column is only shown on the home page, where rows span several tasks.
   The row matching currentGenerationId, if any, is highlighted. */
export function generationsTable(rows: TableRow[], showTaskDir: boolean = false, currentGenerationId: string|null = null): string {
    if (!rows.length) {
        return empty('No cached generation.')
    }

    const header = `<tr>
    <th class="nowrap">Created</th>
    ${showTaskDir ? '<th>Task dir</th>' : ''}
    <th class="nowrap">Type</th>
    <th>Model</th>
    <th class="nowrap">User / platform</th>
    <th>Prompt</th>
    <th>Output</th>
    <th></th>
</tr>`

    const body = rows.map(row => `<tr${row.generation_id === currentGenerationId ? ' class="current"' : ''}>
    <td class="nowrap">${esc(formatDate(row.created_at))}</td>
    ${showTaskDir ? `<td>${taskDirCell(row)}</td>` : ''}
    <td class="nowrap">${esc(row.generation_type || '—')}</td>
    <td>${esc(row.model || '—')}</td>
    <td class="nowrap">${esc(row.user_id || '—')} / ${esc(platformLabel(row))}</td>
    <td>${esc(truncate(row.prompt, 90)) || '<span class="empty">—</span>'}</td>
    <td>${esc(truncate(row.generation_result, 90)) || '<span class="empty">—</span>'}</td>
    <td class="nowrap"><a href="${generationUrl(row.task_id || '-', row.generation_id)}">view</a></td>
</tr>`).join('')

    return `<div class="scroll"><table>${header}${body}</table></div>`
}

/* Shows the task dir, falling back to the task id, and always links to the task page. */
function taskDirCell(row: TableRow): string {
    if (!row.task_id) {
        return '<span class="empty">unknown task</span>'
    }
    const label = row.task_dir || row.task_id
    const subtitle = row.task_dir ? `<div class="muted">${esc(row.task_id)}</div>` : ''

    return `<a href="${taskUrl(row.task_id)}">${esc(label)}</a>${subtitle}`
}

const IMAGE_URL = /^https?:\/\/[^\s"'<>]+\.(png|jpe?g|webp|gif|svg)(\?[^\s"'<>]*)?$/i

export function renderResult(result: string|null): string {
    if (!result) {
        return empty('Empty result.')
    }

    const trimmed = result.trim()

    if (IMAGE_URL.test(trimmed)) {
        return `<p><a href="${esc(trimmed)}">${esc(trimmed)}</a></p>
<p><img class="result" src="${esc(trimmed)}" alt="Generated image"></p>`
    }

    if (/^[\[{]/.test(trimmed)) {
        try {
            return `<pre>${esc(JSON.stringify(JSON.parse(trimmed), null, 2))}</pre>`
        } catch (e) {
            /* not JSON after all, fall through */
        }
    }

    return `<pre>${esc(result)}</pre>`
}

export function errorPage(title: string, message: string): string {
    return layout(title, `<h1>${esc(title)}</h1>${warning(message)}<p><a href="${BASE_PATH}">Back to search</a></p>`)
}

export {formatDate, truncate}
