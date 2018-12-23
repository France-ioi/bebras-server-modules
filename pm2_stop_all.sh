#!/bin/sh
pm2 stop bsm-data
pm2 delete bsm-data
pm2 stop bsm-tasks
pm2 delete bsm-tasks
pm2 stop bsm-assets
pm2 delete bsm-assets
pm2 stop bsm-tokens
pm2 delete bsm-tokens
