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
}

export interface TaskTokenPayload {
  itemUrl: string;
  randomSeed: string;
  sHintsRequested: string;
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
