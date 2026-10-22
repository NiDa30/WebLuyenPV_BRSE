import type { Attempt, Config, TimelineEvent } from './model'
import { emptyResult } from './model'
export function event(a: Attempt, kind: TimelineEvent['kind'], now: number, elapsedMs: number, label = '', plannedMs: number | null = null) {
  a.events.push({id: crypto.randomUUID(), sectionId: a.config.sections[a.index]!.id, kind, wall: now, elapsedMs, label, plannedMs})
}
export function createAttempt(config: Config, material: string, difficulty: string, now: number): Attempt {
  const a: Attempt = { id: crypto.randomUUID(), config: structuredClone(config), material, difficulty, mode: 'STRATEGY_PRACTICE', createdAt: now,
    status: 'RUNNING', index: 0, startedWall: now, accruedMs: 0, elapsed: config.sections.map(() => 0), results: config.sections.map(emptyResult), events: [], flags: [] }
  event(a, 'SECTION_START', now, 0)
  return a
}
export function elapsed(a: Attempt, now: number): number {
  const budget = a.config.sections[a.index]!.budgetMs
  return Math.min(budget, Math.max(0, a.accruedMs + (a.status === 'RUNNING' ? Math.max(0, now - a.startedWall!) : 0)))
}
export function finishSection(a: Attempt, now: number, expectedIndex: number, early = false) {
  if (a.index !== expectedIndex || !['RUNNING','PAUSED'].includes(a.status)) return
  if (!early && elapsed(a, now) < a.config.sections[a.index]!.budgetMs) return
  const used = elapsed(a, now)
  a.accruedMs = used; a.elapsed[a.index] = used; a.startedWall = null
  event(a, 'SECTION_END', now, used, early ? 'MANUAL_EARLY' : 'TIME_LIMIT')
  if (a.index === a.config.sections.length - 1) { a.status = 'COMPLETED'; event(a, 'EXAM_END', now, used) }
  else a.status = 'BETWEEN'
}
export function nextSection(a: Attempt, now: number) {
  if (a.status !== 'BETWEEN') return
  a.index++; a.accruedMs = 0; a.startedWall = now; a.status = 'RUNNING'
  event(a, 'SECTION_START', now, 0)
}
export function pause(a: Attempt, now: number) {
  if (a.status !== 'RUNNING') return
  finishSection(a, now, a.index)
  if (a.status !== 'RUNNING') return
  a.accruedMs = elapsed(a, now); a.startedWall = null; a.status = 'PAUSED'
  if (!a.flags.includes('PRACTICE_PAUSED')) a.flags.push('PRACTICE_PAUSED')
  event(a, 'PAUSE', now, a.accruedMs)
}
export function resume(a: Attempt, now: number) {
  if (a.status !== 'PAUSED') return
  a.startedWall = now; a.status = 'RUNNING'; event(a, 'RESUME', now, a.accruedMs)
}
export function checkpoint(a: Attempt, now: number, label: string, plannedMs: number | null) {
  if (a.status !== 'RUNNING' || !label.trim()) return
  finishSection(a, now, a.index)
  if (a.status !== 'RUNNING') return
  const used = elapsed(a, now)
  const last = a.events.at(-1)
  if (last?.kind === 'CHECKPOINT' && last.label === label.trim() && used - last.elapsedMs < 500) return
  event(a, 'CHECKPOINT', now, used, label.trim().slice(0,200), plannedMs)
}
export function recover(a: Attempt, wall: number) {
  if (a.status !== 'RUNNING') return
  if (!a.flags.includes('RELOAD_RECOVERY')) a.flags.push('RELOAD_RECOVERY')
  if (wall < a.startedWall!) markSkew(a, wall)
  a.accruedMs = elapsed(a, wall); a.startedWall = wall
  event(a, 'RECOVERED', wall, a.accruedMs, 'WALL_TIME_RECOVERY')
  finishSection(a, wall, a.index)
}
export function markSkew(a: Attempt, now: number) {
  if (!a.flags.includes('CLOCK_SKEW')) { a.flags.push('CLOCK_SKEW'); event(a, 'CLOCK_SKEW', now, elapsed(a, now), 'Thời gian khôi phục có thể không chính xác.') }
}
// Monotonic time drives in-tab timing; Date.now is used only for recovery.
export class RuntimeClock {
  private wall = Date.now()
  private mono = performance.now()
  now() { return this.wall + Math.max(0, performance.now() - this.mono) }
  skewed() { return Math.abs(Date.now() - this.now()) > 5000 }
}
