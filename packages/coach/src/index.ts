/**
 * @revivex/coach
 * Deterministic daily coach. Inputs: profile, recent history, today's readiness,
 * the date. Output: one DayPlan with plain-language rationale. No network, no LLM.
 */
export * from './types';
export * from './readiness';
export * from './week';
export * from './fatigue';
export * from './strength';
export * from './running';
export * from './hybrid';
export * from './generate';
export * from './convert';
export * from './adjust';
export * from './completion';
