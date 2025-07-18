import config from "../config";
import db from "./db";
import {AIQuotaConfig, PlatformRow, AiGenerationRow} from "../types";
import platforms from "../repositories/platforms";

class ExceededQuotaError extends Error {
  public timeToWait: number;

  constructor(message: string, timeToWait: number) {
    super(message);
    this.timeToWait = timeToWait;
  }
}

export async function getUsageParameters(tokenPayload: {idUser: string; platformName: string}) {
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

  return {userId, platform};
}

export async function requestNewAIUsage(taskId: string, tokenPayload: {idUser: string, platformName: string}, aiQuotaConfig: AIQuotaConfig, generationId: string): Promise<void> {
  let {userId, platform} = await getUsageParameters(tokenPayload);

  await checkGenerationIdUsage(generationId, taskId, userId, platform.id);

  const sql = `SELECT * FROM ai_generations WHERE \`task_id\` = ? AND \`user_id\` = ? AND \`platform_id\` = ? LIMIT 1`
  const values = [taskId, userId, platform.id];
  const rows = await db.queryAsync<AiGenerationRow[]>(sql, values);
  if (0 === rows.length) {
    const sql = 'INSERT INTO `ai_generations`\
            (`task_id`, `user_id`, `platform_id`, `generations`, `last_generation_date`, `last_generation_id`)\
            VALUES\
            (?, ?, ?, 1, NOW(), ?)';
    const values = [taskId, userId, platform.id, generationId];

    await db.queryAsync(sql, values);
  } else {
    const aiGenerationRow = rows[0];


    checkUserAllowed(aiGenerationRow, aiQuotaConfig);

    const sql = 'UPDATE `ai_generations` SET generations = generations + 1, last_generation_date = NOW(), last_generation_id = ?\
            WHERE id = ?';
    const values = [generationId, aiGenerationRow.id];

    await db.queryAsync(sql, values);
  }
}

export async function fetchGenerationIdFromCache(generationId: string): Promise<string|null> {
  const sql = `SELECT generation_result FROM ai_generations_cache WHERE \`generation_id\` = ? LIMIT 1`
  const values = [generationId];
  const rows = await db.queryAsync<{generation_result: string}[]>(sql, values);
  if (0 === rows.length) {
    return null;
  }

  return rows[0].generation_result;
}

export async function storeAIUsage(generationId: string, result: string): Promise<void> {
  const sql = 'INSERT INTO `ai_generations_cache`\
            (`generation_id`, `generation_result`)\
            VALUES\
            (?, ?)\
            ON DUPLICATE KEY UPDATE\
            `generation_result` = ?'
  const values = [generationId, result, result];

  await db.queryAsync(sql, values);
}

function checkUserAllowed(aiGenerationRow: AiGenerationRow, aiQuotaConfig: AIQuotaConfig): void {
  if (aiQuotaConfig.free_tries && aiGenerationRow.generations + 1 <= aiQuotaConfig.free_tries) {
    return;
  }

  const timeSinceLastGeneration = ((new Date()).getTime() - (new Date(aiGenerationRow.last_generation_date)).getTime()) / 1000; // seconds
  const minTime = aiQuotaConfig.wait_time * Math.pow(aiQuotaConfig.exponential_factor, aiGenerationRow.generations - aiQuotaConfig.free_tries);

  if (timeSinceLastGeneration < minTime) {
    const timeToWait = Math.ceil(minTime - timeSinceLastGeneration);

    throw new ExceededQuotaError(`Vous avez déjà fait plusieurs essais. Réfléchissez bien, pendant au moins ${timeToWait} secondes avant de faire votre prochain essai.`, timeToWait);
  }
}

export async function checkGenerationIdUsage(generationId: string, taskId: string, userId: string, platformId: string) {
  const sql = `SELECT task_id, user_id, platform_id FROM ai_generations WHERE \`last_generation_id\` = ? LIMIT 1`
  const values = [generationId];
  const rows = await db.queryAsync<AiGenerationRow[]>(sql, values);
  if (0 === rows.length) {
    return;
  }

  const aiGenerationRow = rows[0];
  if (aiGenerationRow.task_id !== taskId || String(aiGenerationRow.user_id) !== userId || aiGenerationRow.platform_id !== platformId) {
    throw new Error("This generation id does not belong to you");
  }
}
