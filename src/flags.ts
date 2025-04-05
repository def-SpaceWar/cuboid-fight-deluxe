import { GLColor } from "./render.ts";

/** The amount of previous dts to sample for FPS */
export const FPS_SAMPLE_AMOUNT = 25;

/** The amount of previous dts to sample for TPS */
export const TPS_SAMPLE_AMOUNT = 25;

/** Maximum 󰇂t (used for when clicking off screen) */
export const MIN_DT = 0.04; // 25 FPS/TPS

/** Ticks per second (faster to make more realistic, slower for better networking) */
export const TPS = 60;
export const DT = 1 / TPS;
export const MAX_SAVED_TICKS = 600;

/** Render hitboxes */
export let DEBUG_HITBOXES = false;
export const toggleHitboxes = () => DEBUG_HITBOXES = !DEBUG_HITBOXES;

/**
 * Each texture pixel results in N in-game pixels
 * (only repeated textures like backgrounds/tiles/platforms)
 */
export const TEX_TO_SCREEN_RATIO = 4;

/** Render circles as N-gons */
export const CIRCLE_ACCURACY = 32;

/** Amount of steps to animate a color pulse */
export const PULSE_ANIM_STEPS = 3;

/** Color for damage */
export const DAMAGE_COLOR: GLColor = [1.5, 0.3, 0.5, 1];

/** Color for healing */
export const HEAL_COLOR: GLColor = [0.5, 1.5, 0.3, 1];

/** How long in seconds someone can get kill credit after hitting a player */
export const KILL_CREDIT_TIME = 15;
