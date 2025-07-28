import {GenericCallback, GraderRow, TaskObject} from "../types";
import path from "path";
import fs from "fs";
import db from "./db";
import safeEval from "safe-eval";

//TODO: move to repositories
const file = path.resolve(process.cwd(), 'tasks.json')
const data = fs.existsSync(file) ? require(file) : {}

function getFile(task_id: string) {
  if(!(task_id in data)) {
    return null;
  }
  return path.resolve(process.cwd(), data[task_id])
}


export function loadTask(task_id: string, method: string, callback: GenericCallback<TaskObject>) {
  let file = getFile(task_id)
  if (!file) {
    // Try to load task from graders database
    const sql = 'SELECT `data` FROM `graders` WHERE `task_id`=? LIMIT 1'
    const values = [task_id]
    db.query<GraderRow[]>(sql, values, (rows) => {
      if (rows.length) {
        const data = rows[0].data;
        let innerData: {taskTemplate?: string};
        try {
          innerData = safeEval(data)
        } catch (e) {
          return callback(new Error('Unreadable grader data'));
        }

        if (innerData.taskTemplate) {
          file = getFile(innerData.taskTemplate);
          if (!file) {
            callback(new Error(`Task template not found: ${innerData.taskTemplate}`));
          } else {
            loadTaskFromFile(file, method, (error, data) => {
              if (!error && data) {
                data.loadGraderData(innerData);
              }

              callback(error, data);
            });
          }
        } else {
          callback(new Error('No task template for this task'))
        }
      } else {
        callback(new Error('Task not found'))
      }
    });
  } else {
    loadTaskFromFile(file, method, callback);
  }
}

export function loadTaskFromFile(file: string, method: string, callback: GenericCallback<TaskObject>) {
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
