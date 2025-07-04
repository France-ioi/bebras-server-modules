import {GenericCallback} from "../types";
import path from "path";
import fs from "fs";

//TODO: move to repositories
const file = path.resolve(process.cwd(), 'tasks.json')
const data = fs.existsSync(file) ? require(file) : {}

function getFile(task_id: string) {
  if(!(task_id in data)) {
    return null;
  }
  return path.resolve(process.cwd(), data[task_id])
}


export function loadTask(task_id: string, method: string, callback: GenericCallback) {
  const file = getFile(task_id)
  if(!file) {
    return callback(new Error('Task not found'))
  }

  function obj() {
    const obj = require(file!)
    if(method in obj) {
      return callback(false, obj)
    }
    return callback(new Error(`Task does not support ${method} method`))
  }

  const id = require.resolve(file)
  if(require.cache[id]) {
    return obj()
  }

  fs.access(file, (fs.constants || fs).R_OK, (error) => {
    if(error) {
      return callback(new Error('Task file not found'))
    }
    obj()
  })
}