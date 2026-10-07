# bebras-server-modules

Server-side modules to be used by bebras tasks.

Some bebras tasks, for instance [alkindi-task-enigma](https://github.com/France-ioi/alkindi-task-enigma) have both a client side and a server side ; the server side will generate data for the instance of the task, and send to the client side some of that data, hints and grade the answers, without revealing the full data to the user. bebras-server-modules is the intermediate between the client and the server for these tasks ; it handles communication, authentication, data storage and other features for these tasks.

## Installation

1. Install a recent version of node.js (tested with version 10 ; doesn't work with some older versions)
2. Create a MySQL database for bebras-server-modules
3. Create a `.env` configuration file using `.env.example` as template (check documentation below)
4. `yarn install`
5. `yarn build`
6. Install pm2 globally : `yarn global add pm2`

## Usage

You must first add task modules to bebras-server-modules (for instance, the `server-modules` from [alkindi-task-enigma](https://github.com/France-ioi/alkindi-task-enigma). You can do so with :
```
yarn cmd tasks:add TASK_ID TASK_PATH
```
with `TASK_ID` being an unique identifier for the task, and `TASK_PATH` the absolute path to the js file of the module.

You can then start the servers :
```
./pm2_start_all.sh
```

If you kept the default port, the endpoint you will need to make your client tasks point at will be `http://your.server:3101/` ; note that bebras-server-modules doesn't offer any user interface.

## Configuration

Base configuration is done in the `.env` file ; use `.env.example` as template.

* `DEV_MODE` : set `true` for dev purposes only. It will skip the verification of tokens, and allow to send an object as `task` argument instead of a token.
* `DB_` variables : settings to connect to the MySQL database
* `STORAGE` : set to `local` to save files locally, `s3` to save files on S3
* `STORAGE_PATH` : folder in which saved assets will be stored, if you use `STORAGE=local`
* `S3_` variables : settings to access S3, if you use `STORAGE=s3`
* `STORAGE_URL` : URL to access assets stored
* `TOKENS_SERVICE_URL` : URL to access the tokens service of bebras-server-modules
* `TASKS_GRADER_KEY_FILE` : private key to sign tokens, the default demo one can be used for development purposes

## Development

During development, you can use the following command to restart automatically the tasks endpoint of bebras-server-modules each time a file in the task module `tasks/enigma/` is modified :
```
npx pm2 start --no-daemon --watch tasks/enigma/ dist/server.js --name bsm-tasks --interpreter babel-node -- tasks -p=3101
```

Adapt the watched path to the task you're working on.

## AI admin panel

An admin panel to inspect AI tasks, their cached generations and their task cache is served by the
`ai` handler, on the same process and port, under `/ai/admin`. It is a React single-page app
(sources in `admin/`, built by `yarn build` into `dist/admin`) talking to a JSON API under
`/ai/admin/api` :

* `/ai/admin` : search field, and the latest AI generations across all tasks. The search accepts a
  task path (looked up as `quiz-` + md5 of the path), a task id, or a `task_dir` as stored by the
  quiz `write` action ; on an exact match you are redirected straight to the task page, otherwise
  you get the task ids and task dirs matching the query
* `/ai/admin/task/TASK_ID` : task source, resolved template, effective config, quota usage, the
  task cache (see below) and the list of that task's cached generations
* `/ai/admin/task/TASK_ID/generation/GENERATION_ID` : one cached generation — prompt, model,
  user and platform, expiry, and the result (images are rendered inline)

With the default ports, the panel is at `http://your.server:3104/ai/admin`.

It is protected by HTTP Basic Auth, configured with the `ADMIN_USER` and `ADMIN_PASSWORD`
variables of the `.env` file. **If either is missing, the panel answers `503` and serves
nothing** — it never falls back to being open. Write requests must be JSON and carry the
`X-Requested-With: bsm-admin` header sent by the panel, so they can't be forged cross-site.

Since it shares the port with the public `/ai` endpoint, don't expose port 3104 directly if you
would rather keep the panel private ; put it behind a reverse proxy and only expose `/ai`.

To work on the front-end, run the `ai` handler and `yarn admin:dev` (Vite, proxying the API to
`localhost:3104`, or to `ADMIN_API_URL`). The dev server asks for the same Basic Auth credentials
before serving the page or its sources.

### Task cache

A task template module may export an `admin` object, shown in a "Task cache" section of the page of
every task using that template (once per version of its grader data). The template defines the cache
and its actions ; the grader data only brings the task's own prompts, which the actions read from
`context.version.prompts` :

```js
export const admin = {
    async getCacheElements(context) { return {schema, values}; },
    actions: {
        generate: {global: true, label: 'Generate', action: async (context) => { ... }},
        editElement: {action: async (context, {id, value}) => { ... }},
        deleteElement: {action: async (context, {id}) => { ... }},
    },
};
```

* `schema` is a JSON Schema subset describing the elements : its root is an `array` whose `items`
  are rendered as cards, with `type` (`array`, `object`, `string`, `number`, `integer`, `boolean`),
  `items`, `properties`, `title`, and the extra keywords `x-editable: true` (field editable in the
  edit form), `x-hidden: true`, `format: 'image-url'` (thumbnail, full screen on click),
  `format: 'textarea'`, and on the items `x-actions: {edit, delete}` (action ids)
* element actions receive the element `id` (its `id` property, or its index) and, for edits, the
  edited `value`
* global actions are buttons ; they run in the background and may report `progress(percent, message)`
* `context` provides `taskId`, `versionId`, `version`, `getTaskData` / `storeTaskData` /
  `deleteTaskData(key)`, `generateText(prompt, model, {jsonSchema, systemInstructions})`,
  `generateImage(prompt, model, size)` (a data URL), `storeTaskAsset(key, dataUrl)` (returns its
  url), `deleteTaskAsset(key)`, `progress(percent, message)` and `log(message)`.
  Admin generations bypass quotas and the generation cache

The cache is stored task-wide in the `data` and `assets` tables, with `random_seed = 0`. Tasks read
it at runtime by running one of the template's `admin.loaders` with the `loadTaskCache` action of the
`ai` handler (`task`, `version`, `name`). A loader
gets the same context as the actions and decides itself what it reads and whether to generate it
first (e.g. the situations of `ai-template-choices`, generated on the first request when they don't
exist yet) ; concurrent calls of the same loader share a single run.
Jobs are kept in memory : a job still running is lost when the `ai` process restarts, and finished
jobs are forgotten after an hour.

## Commands

* Add task : `yarn cmd tasks:add TASK_ID TASK_PATH`
* Remove task : `yarn cmd tasks:remove TASK_ID`
* Show all tasks : `yarn cmd tasks:list`
* Clear all tasks : `yarn cmd tasks:clear`
* Clear expired data : `yarn cmd data:clear`
* Stop all servers : `./pm2_stop_all.sh`
