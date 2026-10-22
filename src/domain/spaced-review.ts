import {z} from 'zod'
export const dayMs=86_400_000
export const grades=['AGAIN','HARD','GOOD','EASY'] as const
export type Grade=typeof grades[number]
export const gradeLabels:Record<Grade,string>={AGAIN:'Chưa nhớ',HARD:'Khó',GOOD:'Nhớ',EASY:'Dễ'}
export const maxReviewTime=8_000_000_000_000_000
export function nextInterval(previous:number,grade:Grade){return grade==='AGAIN'?0:Math.min(180,grade==='HARD'?Math.max(1,Math.round(previous*1.2)):grade==='GOOD'?Math.max(3,previous*2):Math.max(7,previous*3))}
export function replayReviews(events:{grade:Grade;at:number}[]){let days=0,dueAt=0;for(const event of events){days=nextInterval(days,event.grade);dueAt=event.at+(days?days*dayMs:60_000)}return {days,dueAt}}
export const scheduleSchema=z.object({policy:z.literal('FIXED_INTERVAL_V1'),contentVersion:z.number().int().positive(),events:z.array(z.object({grade:z.enum(grades),at:z.number().int().min(0).max(maxReviewTime)}).strict()).min(1).max(100)}).strict().superRefine((s,ctx)=>{
 let days=0,dueAt=0
 for(const e of s.events){if(e.at<dueAt)ctx.addIssue({code:'custom',message:'Lượt ôn trước hạn hoặc sai thứ tự.'});days=nextInterval(days,e.grade);dueAt=e.at+(days?days*dayMs:60_000);if(dueAt>maxReviewTime)ctx.addIssue({code:'custom',message:'Lịch ôn vượt giới hạn thời gian.'})}
})
export type Schedule=z.infer<typeof scheduleSchema>
