# bebras-server-modules
Server-side modules to be used by bebras tasks

Installation:
1. create database bebras-server-modules
2. create .env file using .env.example as template
3. >npm install

Maintenance:

Add task
>node command.js tasks:add TASK_ID TASK_PATH
Remove task
>node command.js tasks:remove TASK_ID
Show all tasks
>node command.js tasks:list
Clear all tasks
>node command.js tasks:clear

Clear expired data
>node command.js data:clear