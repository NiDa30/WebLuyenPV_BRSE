import {z} from 'zod'
import type {Interview,InterviewSession} from './interview'
export const minuteKinds={SCOPE:'Phạm vi',DECISION:'Quyết định',ACTION:'Hành động',OPEN_QUESTION:'Câu hỏi còn mở'} as const
const reference=z.object({attemptId:z.string().uuid(),version:z.number().int().positive()}).strict()
export const minuteEntrySchema=z.object({
  id:z.string().uuid(),kind:z.enum(['SCOPE','DECISION','ACTION','OPEN_QUESTION']),
  text:z.string().trim().min(1).max(1000),owner:z.string().trim().max(120),due:z.string().trim().max(120),
  confirmation:z.enum(['PROPOSED','CONFIRMED','UNKNOWN']),
  evidence:reference.extend({source:z.enum(['CANDIDATE','CUSTOMER']),quote:z.string().min(1).max(10000),startOffset:z.number().int().nonnegative(),endOffset:z.number().int().positive()}).strict(),
}).strict().superRefine((e,ctx)=>{if(e.kind==='ACTION'&&(!e.owner||!e.due))ctx.addIssue({code:'custom',message:'Hành động cần người phụ trách và mốc phản hồi; có thể ghi rõ chưa xác nhận.'})})
export const minutesSchema=z.object({status:z.enum(['DRAFT','REVIEWED']),entries:z.array(minuteEntrySchema).max(12),reviewedVersions:z.array(reference).max(3)}).strict().superRefine((m,ctx)=>{
  if(new Set(m.entries.map(e=>e.id)).size!==m.entries.length)ctx.addIssue({code:'custom',message:'Mục biên bản bị trùng ID.'})
  if(m.status==='REVIEWED'&&(!m.entries.length||m.reviewedVersions.length!==3))ctx.addIssue({code:'custom',message:'Biên bản đã rà soát cần chứng cứ và ba version hội thoại.'})
  if(m.status==='DRAFT'&&m.reviewedVersions.length)ctx.addIssue({code:'custom',message:'Bản nháp không giữ dấu đã rà soát.'})
})
export type MinuteEntry=z.infer<typeof minuteEntrySchema>
export type Minutes=z.infer<typeof minutesSchema>
export function validateMinutesReferences(m:Minutes,session:InterviewSession,attempts:Interview[]){
  const issues:string[]=[]
  for(const e of m.entries){const a=attempts.find(a=>a.id===e.evidence.attemptId),r=a?.revisions.find(r=>r.version===e.evidence.version)
    const source=e.evidence.source==='CUSTOMER'?a?.prompt:r?.text
    if(!session.attemptIds.includes(e.evidence.attemptId)||!r||!source||source.slice(e.evidence.startOffset,e.evidence.endOffset)!==e.evidence.quote)issues.push('Chứng cứ biên bản không khớp nguồn/version/đoạn trích.')
  }
  m.reviewedVersions.forEach((ref,i)=>{if(ref.attemptId!==session.attemptIds[i]||!attempts.find(a=>a.id===ref.attemptId)?.revisions.some(r=>r.version===ref.version))issues.push('Version rà soát biên bản không thuộc đúng thứ tự phiên.')})
  return issues
}
export function minutesState(m:Minutes,session:InterviewSession,attempts:Interview[]){
  const turns=session.attemptIds.map(id=>attempts.find(a=>a.id===id))
  const conversationCurrent=turns.every((a,i)=>a?.status==='REVIEWED'&&a.scenarioContext?.length===i&&turns.slice(0,i).every((p,j)=>p?.status==='REVIEWED'&&a.scenarioContext?.[j]?.attemptId===p.id&&a.scenarioContext?.[j]?.version===p.revisions.at(-1)?.version))
  const staleIds=m.entries.filter(e=>{const a=attempts.find(a=>a.id===e.evidence.attemptId);return !a||a.status!=='REVIEWED'||a.revisions.at(-1)?.version!==e.evidence.version}).map(e=>e.id)
  const reviewedCurrent=m.reviewedVersions.every((ref,i)=>ref.attemptId===session.attemptIds[i]&&turns[i]?.revisions.at(-1)?.version===ref.version)
  const current=conversationCurrent&&staleIds.length===0&&validateMinutesReferences(m,session,attempts).length===0&&reviewedCurrent
  return {current,staleIds,exportable:m.status==='REVIEWED'&&m.entries.length>0&&m.reviewedVersions.length===3&&current}
}
export function exportMinutesText(m:Minutes,session:InterviewSession,attempts:Interview[]){
  if(!minutesState(m,session,attempts).exportable)throw new Error('Biên bản chưa rà soát hoặc nguồn đã thay đổi. Không xuất bản đã rà soát cũ.')
  const confirmation={PROPOSED:'Đề xuất',CONFIRMED:'Đã xác nhận (người học tự khai)',UNKNOWN:'Chưa xác định'}
  return ['BIÊN BẢN TỰ LUYỆN BRSE — KHÔNG PHẢI XÁC NHẬN CỦA KHÁCH',`Kịch bản: ${session.scenarioId}; phiên: ${session.id}`,'Nội dung và mức xác nhận do người học nhập; trích dẫn đúng không chứng minh diễn giải đúng. Không tự gửi cho khách.',...m.entries.map((e,i)=>`\n${i+1}. ${minuteKinds[e.kind]} — ${confirmation[e.confirmation]}\n${e.text}\nPhụ trách: ${e.owner||'Chưa xác định'} | Mốc: ${e.due||'Chưa xác định'}\nNguồn ${e.evidence.source} · ${e.evidence.attemptId} · v${e.evidence.version} · ký tự ${e.evidence.startOffset}–${e.evidence.endOffset}\nTrích dẫn: ${e.evidence.quote}`)].join('\n')
}
