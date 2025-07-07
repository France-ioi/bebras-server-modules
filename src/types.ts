export type GenericCallback<T = any> = (err?: boolean|Error|null|unknown, result?: T) => void;

// Database types
export interface AssetRow {
  id: string;
  task_id: string;
  random_seed: string;
  key: string;
  path: string;
}

export interface PlatformRow {
  id: string;
  name: string;
  public_key: string;
}

export interface GraderRow {
  id: string;
  task_id: string;
  data: string;
}

export interface DataRow {
  id: string;
  task_id: string;
  random_seed: string;
  key: string;
  value: string;
  duration: number;
  updated_at: string;
}

export interface TaskArg {
  id: string;
  random_seed: string;
  hints_requested: number;
  payload: TaskTokenPayload;
}

export interface TaskTokenPayload {
  itemUrl: string;
  randomSeed: string;
  sHintsRequested: string;
  idTask: string;
  idUser: string;
  platformName: string;
}

export interface AnswerTokenPayload extends TaskTokenPayload {
  idUserAnswer: string;
  sAnswer: string;
}

export interface ScoreSettings {
  maxScore: number;
  minScore: number;
  noScore: number;
  questions_info: any;
  score_calculation: any;
}

export interface UserTaskRow {
  id: string;
  task_id: string;
  user_id: string;
  platform_id: string;
  attempts: number;
  last_attempt_date: string;
}

export interface TaskObject {
  config: TaskConfig;
}

export interface TaskConfig {
  cache_task_data: boolean;
  ai_quota: AIQuotaConfig;
}

export interface AIQuotaConfig {
  free_tries: number;
  wait_time: number;
  exponential_factor: number;
}
