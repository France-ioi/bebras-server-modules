# bebras-server-modules
Server-side modules to be used by bebras tasks

## Installation

1. Install a recent version of node.js (tested with version 10 ; doesn't work with some older versions)
2. Create a MySQL database for bebras-server-modules
3. Create a `.env` configuration file using `.env.example` as template (check documentation below)
4. `npm install`
5. Install pm2 globally : `npm install pm2 -g`

## Usage

Start the servers :
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

## Commands

* Add task : `node command.js tasks:add TASK_ID TASK_PATH`
* Remove task : `node command.js tasks:remove TASK_ID`
* Show all tasks : `node command.js tasks:list`
* Clear all tasks : `node command.js tasks:clear`
* Clear expired data : `node command.js data:clear`
* Stop all servers : `./pm2_stop_all.sh`
