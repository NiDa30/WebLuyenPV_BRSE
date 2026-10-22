import { z } from 'zod'
export const voiceMetadataSchema=z.object({source:z.literal('BROWSER_ASR_REVIEWED'),lang:z.literal('ja-JP'),reviewConfirmed:z.literal(true),mergeMode:z.enum(['REPLACE','APPEND']),confidence:z.number().min(0).max(1).nullable(),captureDurationMs:z.number().min(0).max(120000),reviewedAt:z.number().min(0)}).strict()
export type VoiceMetadata=z.infer<typeof voiceMetadataSchema>
