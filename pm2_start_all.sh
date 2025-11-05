#!/bin/sh
pm2 start dist/server.js --name bsm-data -- data -p=3100
pm2 start dist/server.js --name bsm-tasks -- tasks -p=3101
pm2 start dist/server.js --name bsm-assets -- assets -p=3102
pm2 start dist/server.js --name bsm-tokens -- tokens -p=3103
