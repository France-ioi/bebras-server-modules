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

export interface AiGenerationRow {
  id: string;
  task_id: string;
  user_id: string;
  platform_id: string;
  generations: number;
  last_generation_date: string;
  last_generation_id: string;
  last_generation_result: string;
}

export interface TaskObject {
  config: TaskConfig;
  taskHintData: (args: {task: TaskArg}, task_data: any, callback: GenericCallback) => Promise<void>,
  gradeAnswer: (args: {task: TaskArg, answer: {payload: any}}, task_data: any, callback: GenericCallback) => Promise<void>,
  requestHint: (args: {task: TaskArg}, callback: GenericCallback) => Promise<void>,
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
