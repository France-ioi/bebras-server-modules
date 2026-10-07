/* Shapes exchanged between the admin JSON API and the admin SPA (admin/).
   Kept free of server imports so the SPA can import it as-is.
   Dates are pre-formatted by the server ("YYYY-MM-DD HH:MM:SS", server local time). */

export interface ApiGeneration {
    generation_id: string;
    generation_result: string|null;
    expires_at: string|null;
    expired: boolean;
    task_id: string|null;
    task_dir?: string|null;
    user_id: string|null;
    platform_label: string;
    prompt: string|null;
    model: string|null;
    generation_type: string|null;
    created_at: string|null;
}

export interface ApiTaskHeading {
    task_id: string;
    task_dir: string|null;
    warnings: string[];
}

export interface ApiAdminVersion {
    version_id: string;
    has_cache: boolean;
    global_actions: {id: string, label: string, confirm: string|null}[];
}

export interface ApiSearchResult {
    task_id: string;
    kind: string;
    task_dir: string|null;
}

export type ApiSearchResponse =
    | {task_id: string}
    | {query: string, quiz_task_id: string, results: ApiSearchResult[]};

export interface ApiRecentResponse {
    generations: ApiGeneration[];
}

export interface ApiTaskResponse {
    heading: ApiTaskHeading;
    config_rows: [string, string|null][];
    grader_data: string|null;
    usage: {users: number, generations: number, last_generation_date: string|null};
    generations: ApiGeneration[];
    admin_versions: ApiAdminVersion[];
}

export interface ApiGenerationResponse {
    heading: ApiTaskHeading;
    generation: ApiGeneration;
    mismatch: string|null;
    same_set: ApiGeneration[]|null;
}

/* JSON Schema subset describing one cache element, plus the x-* keywords of the admin. */
export interface CacheSchema {
    type?: 'array'|'object'|'string'|'number'|'integer'|'boolean';
    title?: string;
    description?: string;
    format?: 'image-url'|'textarea'|string;
    items?: CacheSchema;
    /* Closed list of values with their labels : edited as a select. */
    oneOf?: {const: any, title?: string}[];
    properties?: Record<string, CacheSchema>;
    'x-editable'?: boolean;
    'x-hidden'?: boolean;
    'x-actions'?: {edit?: string, delete?: string};
}

export interface ApiCacheResponse {
    schema: CacheSchema;
    values: any[];
}

export interface ApiJob {
    id: string;
    task_id: string;
    version_id: string;
    action_id: string;
    status: 'running'|'done'|'error';
    progress: number;
    message: string|null;
    log: string[];
    error: string|null;
    started_at: string;
    finished_at: string|null;
}

export interface ApiJobResponse {
    job: ApiJob;
}

export interface ApiJobsResponse {
    jobs: ApiJob[];
}
