export const LANES = 3 as const;
export type Lane = 0 | 1 | 2;

export const ROAD_MAX_WIDTH = 420;
export const ROAD_SIDE_PADDING = 16;

export const CAR_WIDTH = 46;
export const CAR_HEIGHT = 72;

export const OBSTACLE_SIZE = 54;
export const ITEM_SIZE = 44;

export const BASE_SPEED_PX_PER_SEC = 280;
export const SPEED_RAMP_PX_PER_SEC_PER_SEC = 3.5;

export const OBSTACLE_SPAWN_MS_START = 950;
export const OBSTACLE_SPAWN_MS_MIN = 360;
export const DIFFICULTY_RAMP_SECONDS = 70;

export const ITEM_SPAWN_MS_MIN = 2200;
export const ITEM_SPAWN_MS_MAX = 3600;

export const HIGH_SCORE_KEY = 'laneSwitchingHighScore:v1';
