import { z } from 'zod'
const annotation = z.object({
  id:z.string().uuid(),criterionId:z.string().min(1).max(40),utteranceId:z.string().uuid(),transcriptVersion:z.number().int().min(1).max(30),
  quote:z.string().min(1).max(10000),startOffset:z.number().int().min(0),endOffset:z.number().int().positive(),startMs:z.literal(0),endMs:z.number().min(0).max(604800000),
  reason:z.string().min(1).max(1500),suggestion:z.string().min(1).max(1500),certainty:z.literal('MODEL_ASSESSMENT'),
}).strict()
export type AiEvidence=z.infer<typeof annotation>
export const aiFeedbackSchema=z.object({
  source:z.literal('AI_MODEL'),provider:z.literal('openai'),model:z.string().min(1).max(100),rubricVersion:z.string().min(1).max(40),
  utteranceId:z.string().uuid(),transcriptVersion:z.number().int().min(1).max(30),
  criteria:z.array(z.object({criterionId:z.string().min(1).max(40),score:z.number().int().min(0).max(3).nullable(),annotations:z.array(annotation).max(3)}).strict()).length(3),
  followUp:z.object({question:z.string().min(1).max(500),quote:z.string().min(1).max(10000),reason:z.string().min(1).max(1000)}).strict().nullable(),
  limitation:z.string().min(1).max(1500),
}).strict()
export type AiFeedback=z.infer<typeof aiFeedbackSchema>
export const capabilitiesSchema=z.object({aiFeedback:z.object({available:z.boolean(),state:z.enum(['AVAILABLE','NOT_CONFIGURED']),provider:z.literal('openai'),model:z.string(),retentionSeconds:z.number().int().min(1).max(3600)}),externalMedia:z.object({showText:z.literal(false),playAudio:z.literal(false),embedImage:z.literal(false),cache:z.literal(false)})})
