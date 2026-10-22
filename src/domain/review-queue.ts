import {z} from 'zod'
import type {Interview,InterviewSession} from './interview'
const evidence=z.object({quote:z.string().min(1).max(10000),startOffset:z.number().int().nonnegative(),endOffset:z.number().int().positive(),score:z.number().int().min(0).max(3).nullable(),reason:z.string().min(1).max(1500)}).strict()
const snapshot=z.discriminatedUnion('source',[
  evidence.extend({source:z.literal('SELF_REVIEW'),score:z.number().int().min(0).max(3)}).strict(),
  evidence.extend({source:z.literal('AI_MODEL'),provider:z.literal('openai'),model:z.string().min(1).max(120)}).strict(),
])
export const reviewItemSchema=z.object({
  id:z.string().uuid(),attemptId:z.string().uuid(),version:z.number().int().positive(),criterionId:z.string().min(1).max(40),createdAt:z.number().finite().nonnegative(),
  snapshot,nextStep:z.string().trim().min(1).max(1000),priority:z.enum(['NORMAL','HIGH']),status:z.enum(['OPEN','DONE']),doneAt:z.number().finite().nonnegative().nullable(),
  retries:z.array(z.object({attemptId:z.string().uuid(),sessionId:z.string().uuid().nullable()}).strict()).max(10),
}).strict().superRefine((item,ctx)=>{if((item.status==='OPEN'&&item.doneAt!==null)||(item.status==='DONE'&&(item.doneAt===null||item.doneAt<item.createdAt||!item.retries.length)))ctx.addIssue({code:'custom',message:'Trạng thái hàng đợi không khớp lượt luyện.'})})
export type ReviewItem=z.infer<typeof reviewItemSchema>
export function queueKey(item:Pick<ReviewItem,'attemptId'|'version'|'criterionId'|'snapshot'>){return `${item.attemptId}:${item.version}:${item.criterionId}:${item.snapshot.source}`}
export function validateQueueReferences(items:ReviewItem[],attempts:Interview[],sessions:InterviewSession[]){
  const issues:string[]=[],ids=new Set<string>(),keys=new Set<string>()
  for(const item of items){
    if(ids.has(item.id)||keys.has(queueKey(item)))issues.push('Mục hàng đợi bị trùng.');ids.add(item.id);keys.add(queueKey(item))
    const a=attempts.find(a=>a.id===item.attemptId),r=a?.revisions.find(r=>r.version===item.version),e=item.snapshot
    const criteria=a?.track==='JOB'?['intent','specificity','structure']:['clarify','impact','actions']
    if(!a||!r||!criteria.includes(item.criterionId)||r.text.slice(e.startOffset,e.endOffset)!==e.quote||item.createdAt<r.submittedAt)issues.push('Chứng cứ hàng đợi không khớp transcript/tiêu chí/version.')
    const seen=new Set<string>()
    for(const retry of item.retries){const target=attempts.find(a=>a.id===retry.attemptId),session=retry.sessionId?sessions.find(s=>s.id===retry.sessionId):undefined
      if(seen.has(retry.attemptId))issues.push('Liên kết luyện lại bị trùng.');seen.add(retry.attemptId)
      if(!target||target.parentId!==item.attemptId||target.parentTranscriptVersion!==item.version||target.questionId!==a?.questionId||target.mode==='INITIAL')issues.push('Lượt luyện lại không khớp nguồn hàng đợi.')
      const sourceSession=sessions.find(s=>s.attemptIds.includes(item.attemptId))
      if(sourceSession?.scenarioId){if(!session||session.parentId!==sourceSession.id||session.scenarioId!==sourceSession.scenarioId||session.attemptIds[sourceSession.attemptIds.indexOf(item.attemptId)]!==retry.attemptId)issues.push('Retry kịch bản thiếu phiên tương ứng.')}
      else if(retry.sessionId!==null)issues.push('Retry riêng lẻ không mang phiên kịch bản.')
    }
    if(item.status==='DONE'&&!attempts.find(a=>a.id===item.retries.at(-1)?.attemptId)?.revisions.length)issues.push('Mục đã luyện chưa có transcript retry.')
  }
  return issues
}
// Context freshness is derived, preserving archived snapshots instead of rewriting quotes.
function current(a:Interview|undefined,sessions:InterviewSession[],attempts:Interview[]){
  if(!a||a.status!=='REVIEWED')return false
  const session=sessions.find(s=>s.attemptIds.includes(a.id));if(!session?.scenarioId)return true
  const index=session.attemptIds.indexOf(a.id)
  return session.attemptIds.slice(0,index+1).every((id,i)=>{const turn=attempts.find(a=>a.id===id);return turn?.status==='REVIEWED'&&turn.scenarioContext?.length===i&&session.attemptIds.slice(0,i).every((prior,j)=>{const p=attempts.find(a=>a.id===prior);return turn.scenarioContext?.[j]?.attemptId===prior&&turn.scenarioContext?.[j]?.version===p?.revisions.at(-1)?.version})})
}
export function queueState(item:ReviewItem,attempts:Interview[],sessions:InterviewSession[]){
  const source=attempts.find(a=>a.id===item.attemptId),stale=!current(source,sessions,attempts)||source?.revisions.at(-1)?.version!==item.version
  const retry=item.retries.at(-1),target=attempts.find(a=>a.id===retry?.attemptId),targetSession=retry?.sessionId?sessions.find(s=>s.id===retry.sessionId):undefined
  const retryComplete=!!target&&current(target,sessions,attempts)&&(!targetSession||targetSession.attemptIds.every(id=>current(attempts.find(a=>a.id===id),sessions,attempts)))
  return {stale,retryComplete,canFinish:!stale&&retryComplete,source,target,targetSession}
}
