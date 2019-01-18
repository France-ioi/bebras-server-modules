# bebras-server-modules

Server-side modules to be used by bebras tasks.

Some bebras tasks, for instance [alkindi-task-enigma](https://github.com/France-ioi/alkindi-task-enigma) have both a client side and a server side ; the server side will generate data for the instance of the task, and send to the client side some of that data, hints and grade the answers, without revealing the full data to the user. bebras-server-modules is the intermediate between the client and the server for these tasks ; it handles communication, authentication, data storage and other features for these tasks.

## Installation

1. Install a recent version of node.js (tested with version 10 ; doesn't work with some older versions)
2. Create a MySQL database for bebras-server-modules
3. Create a `.env` configuration file using `.env.example` as template (check documentation below)
4. `npm install`
5. Install pm2 globally : `npm install pm2 -g`

## Usage

You must first add task modules to bebras-server-modules (for instance, the `server-modules` from [alkindi-task-enigma](https://github.com/France-ioi/alkindi-task-enigma). You can do so with :
```
node command.js tasks:add TASK_ID TASK_PATH
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
npx pm2 start --no-daemon --watch tasks/enigma/ server.js --name bsm-tasks --interpreter babel-node -- tasks -p=3101
```

Adapt the watched path to the task you're working on.

## Commands

* Add task : `node command.js tasks:add TASK_ID TASK_PATH`
* Remove task : `node command.js tasks:remove TASK_ID`
* Show all tasks : `node command.js tasks:list`
* Clear all tasks : `node command.js tasks:clear`
* Clear expired data : `node command.js data:clear`
* Stop all servers : `./pm2_stop_all.sh`
