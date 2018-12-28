# bebras-server-modules
Server-side modules to be used by bebras tasks

## Installation

1. Install a recent version of node.js (tested with version 10 ; doesn't work with some older versions)
2. Create a MySQL database for bebras-server-modules
3. Create a `.env` configuration file using `.env.example` as template
4. `npm install`
5. Install pm2 globally : `npm install pm2 -g`

## Usage

Start the servers :
```
./pm2_start_all.sh
```

The tasks server will be accessible at http://localhost:3101/.

## Configuration

Base configuration is done in the `.env` file ; use `.env.example` as template.

* `DEV_MODE` : set `true` for dev purposes only. It will skip the verification of tokens, and allow to send an object as `task` argument instead of a token.

## Commands

* Add task : `node command.js tasks:add TASK_ID TASK_PATH`
* Remove task : `node command.js tasks:remove TASK_ID`
* Show all tasks : `node command.js tasks:list`
* Clear all tasks : `node command.js tasks:clear`
* Clear expired data : `node command.js data:clear`
* Stop all servers : `./pm2_stop_all.sh`
