import config from "../config";
import db from "./db";
import {AIQuotaConfig, PlatformRow, UserTaskRow} from "../types";
import platforms from "../repositories/platforms";

class ExceededQuotaError extends Error {
  public timeToWait: number;

  constructor(message: string, timeToWait: number) {
    super(message);
    this.timeToWait = timeToWait;
  }
}

export async function requestNewAIUsage(taskId: string, tokenPayload: {idUser: string, platformName: string}, aiQuotaConfig: AIQuotaConfig) {
  let {idUser: userId, platformName} = tokenPayload;
  if (!userId || !platformName) {
    if (config.server.dev_mode) {
      userId = config.server.dev_user_id!;
      platformName = config.server.dev_platform_name!;
    } else {
      throw new Error(`User ID or platform name are mandatory`);
    }
  }

  const platform = await new Promise<PlatformRow|undefined>((resolve, reject) => {
    platforms.getByName(platformName, (error: any, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  })

  if (!platform) {
    throw new Error(`Platform ${platform} not found`);
  }

  const sql = `SELECT * FROM user_task WHERE \`task_id\` = ? AND \`user_id\` = ? AND \`platform_id\` = ? LIMIT 1`
  const values = [taskId, userId, platform.id];

  const rows = await db.queryAsync<UserTaskRow[]>(sql, values);
  if (0 === rows.length) {
    const sql = 'INSERT INTO `user_task`\
            (`task_id`, `user_id`, `platform_id`, `attempts`, `last_attempt_date`)\
            VALUES\
            (?, ?, ?, 1, NOW())';
    const values = [taskId, userId, platform.id];

    await db.queryAsync(sql, values);
  } else {
    const userTask = rows[0];
    checkUserAllowed(userTask, aiQuotaConfig);

    const sql = 'UPDATE `user_task` SET attempts = attempts + 1, last_attempt_date = NOW()\
            WHERE id = ?';
    const values = [userTask.id];

    await db.queryAsync(sql, values);
  }
}

export function checkUserAllowed(userTask: UserTaskRow, aiQuotaConfig: AIQuotaConfig): void {
  if (aiQuotaConfig.free_tries && userTask.attempts + 1 <= aiQuotaConfig.free_tries) {
    return;
  }

  const timeSinceLastAttempt = ((new Date()).getTime() - (new Date(userTask.last_attempt_date)).getTime()) / 1000; // seconds
  const minTime = aiQuotaConfig.wait_time * Math.pow(aiQuotaConfig.exponential_factor, userTask.attempts - aiQuotaConfig.free_tries);

  if (timeSinceLastAttempt < minTime) {
    const timeToWait = Math.ceil(minTime - timeSinceLastAttempt);

    throw new ExceededQuotaError(`You have to wait ${timeToWait} secs before you can make another AI generation`, timeToWait);
  }
}
