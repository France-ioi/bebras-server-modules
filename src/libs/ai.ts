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

export function generateGenerationIdFromPrompt(prompt: string) {
  let h1 = murmurhash3_32_gc(prompt, 0);

  return String(h1) + String(murmurhash3_32_gc(h1 + prompt, 0)).slice(0, 7); // Extend the hash
}

/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */

function murmurhash3_32_gc(key: string, seed: number) {
  var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

  remainder = key.length & 3; // key.length % 4
  bytes = key.length - remainder;
  h1 = seed;
  c1 = 0xcc9e2d51;
  c2 = 0x1b873593;
  i = 0;

  while (i < bytes) {
    k1 =
      ((key.charCodeAt(i) & 0xff)) |
      ((key.charCodeAt(++i) & 0xff) << 8) |
      ((key.charCodeAt(++i) & 0xff) << 16) |
      ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
    h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
  }

  k1 = 0;

  switch (remainder) {
    // @ts-ignore
    case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
    // @ts-ignore
    case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
    case 1: k1 ^= (key.charCodeAt(i) & 0xff);

      k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
      h1 ^= k1;
  }

  h1 ^= key.length;

  h1 ^= h1 >>> 16;
  h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}
