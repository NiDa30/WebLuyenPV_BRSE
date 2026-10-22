import { z } from 'zod'
export const scoreKinds = ['RAW_CORRECT_COUNT', 'MOCK_ESTIMATED', 'OFFICIAL_SCALED', 'PERCENT_ACCURACY'] as const
const count = z.number().int().min(0).max(10000).nullable()
export const resultSchema = z.object({
  total: count, answered: count, correct: count,
  scoreKind: z.enum(scoreKinds), score: z.number().min(0).max(10000).nullable(),
  max: z.number().positive().max(10000).nullable(),
  provenance: z.enum(['SELF_REPORTED', 'MOCK_PROVIDER', 'OFFICIAL_SCORE_SHEET']),
}).strict().superRefine((r, ctx) => {
  const error = (message: string) => ctx.addIssue({ code: 'custom', message })
  if (r.answered !== null && r.total !== null && r.answered > r.total) error('Số câu đã làm không được vượt tổng câu.')
  if (r.correct !== null && r.answered !== null && r.correct > r.answered) error('Số câu đúng không được vượt số câu đã làm.')
  if (r.correct !== null && r.total !== null && r.correct > r.total) error('Số câu đúng không được vượt tổng câu.')
  if (r.score !== null && r.max === null) error('Cần khai báo thang điểm khi nhập điểm.')
  if (r.score !== null && r.max !== null && r.score > r.max) error('Điểm không được vượt thang điểm.')
  if (r.scoreKind === 'PERCENT_ACCURACY' && r.max !== null && r.max !== 100) error('Thang phần trăm phải là 100.')
  if (r.scoreKind === 'RAW_CORRECT_COUNT' && (r.score !== null || r.max !== null)) error('Điểm thô dùng đúng/đã làm/tổng; hãy để điểm báo cáo và thang điểm trống.')
})
export type Result = z.infer<typeof resultSchema>
export const emptyResult = (): Result => ({ total: null, answered: null, correct: null, scoreKind: 'RAW_CORRECT_COUNT', score: null, max: null, provenance: 'SELF_REPORTED' })
export const configSchema = z.object({
  exam: z.enum(['JLPT', 'NAT_TEST', 'BJT']), level: z.string().min(1).max(20),
  year: z.number().int().min(2000).max(2100), version: z.string().min(1).max(100),
  sourceUrl: z.string().url().refine(s => s.startsWith('https://')),
  sourceStatus: z.literal('UNVERIFIED'), verifiedAt: z.null(),
  sections: z.array(z.object({ id: z.string().min(1).max(50), name: z.string().min(1).max(100),
    budgetMs: z.number().int().min(1000).max(14400000), fixedAudio: z.boolean() }).strict()).min(1).max(10),
}).strict().superRefine((c, ctx) => {
  if (new Set(c.sections.map(s => s.id)).size !== c.sections.length) ctx.addIssue({ code: 'custom', message: 'Section ID trùng.' })
})
export type Config = z.infer<typeof configSchema>
const eventSchema = z.object({ id: z.string().uuid(), sectionId: z.string(), kind: z.enum(['SECTION_START','CHECKPOINT','SECTION_END','PAUSE','RESUME','RECOVERED','CLOCK_SKEW','EXAM_END']), wall: z.number().finite(), elapsedMs: z.number().min(0), label: z.string().max(200), plannedMs: z.number().min(0).nullable() }).strict()
export type TimelineEvent = z.infer<typeof eventSchema>
export const attemptSchema = z.object({
  id: z.string().uuid(), config: configSchema, mode: z.literal('STRATEGY_PRACTICE'), material: z.string().min(1).max(120),
  difficulty: z.string().max(80), createdAt: z.number().finite(), status: z.enum(['RUNNING','PAUSED','BETWEEN','COMPLETED']),
  index: z.number().int().min(0), startedWall: z.number().finite().nullable(), accruedMs: z.number().min(0),
  elapsed: z.array(z.number().min(0)), results: z.array(resultSchema), events: z.array(eventSchema).max(5000),
  flags: z.array(z.enum(['PRACTICE_PAUSED','RELOAD_RECOVERY','CLOCK_SKEW'])).max(3),
}).strict().superRefine((a, ctx) => {
  const bad = (message: string) => ctx.addIssue({ code: 'custom', message })
  const n = a.config.sections.length
  if (a.index >= n || a.elapsed.length !== n || a.results.length !== n) { bad('Cấu trúc phần thi không khớp.'); return }
  if ((a.status === 'RUNNING') !== (a.startedWall !== null)) bad('Mốc bắt đầu không khớp trạng thái.')
  if (a.accruedMs > a.config.sections[a.index]!.budgetMs) bad('Elapsed vượt ngân sách.')
  a.elapsed.forEach((v, i) => { if (v > a.config.sections[i]!.budgetMs) bad('Thời lượng phần vượt ngân sách.') })
  if (new Set(a.events.map(e => e.id)).size !== a.events.length) bad('Event ID trùng.')
  a.events.forEach(e => { if (!a.config.sections.some(s => s.id === e.sectionId)) bad('Event tham chiếu phần không tồn tại.') })
})
export type Attempt = z.infer<typeof attemptSchema>
export const backupSchema = z.object({ format: z.literal('BRSE_EXAM_BACKUP'), schemaVersion: z.literal(1), attempts: z.array(attemptSchema).max(500) }).strict().superRefine((b, ctx) => {
  if (new Set(b.attempts.map(a => a.id)).size !== b.attempts.length) ctx.addIssue({ code: 'custom', message: 'Attempt ID trùng.' })
  if (b.attempts.filter(a => a.status !== 'COMPLETED').length > 1) ctx.addIssue({ code: 'custom', message: 'Chỉ cho phép một phiên đang làm.' })
})
export function parseBackup(text: string) {
  if (text.length > 5_000_000) throw new Error('Backup vượt giới hạn 5 MB.')
  return backupSchema.parse(JSON.parse(text))
}
