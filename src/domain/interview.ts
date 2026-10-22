import { z } from 'zod'
import {technicalDrills} from './technical'
import {reviewItemSchema,validateQueueReferences} from './review-queue'
import csvScenario from '../../shared/brse-scenario.json'
import {scenarios,scenarioIds,scenarioById,isScenarioQuestion} from './scenarios'
import {minutesSchema,validateMinutesReferences} from './minutes'
import { aiFeedbackSchema } from './ai-feedback'
import {voiceMetadataSchema} from './voice-metadata'
export const tracks = { JOB: 'Phỏng vấn IT / SE / BrSE', BRSE: 'Role-play khách hàng Nhật' } as const
export type Track = keyof typeof tracks
export interface Criterion { id: string; name: string; weight: number; hint: string }
export const rubrics: Record<Track, { version: string; criteria: Criterion[] }> = {
  JOB: { version:'job-text-v1', criteria:[
    {id:'intent',name:'Đúng trọng tâm',weight:30,hint:'Câu nào trực tiếp trả lời điều người phỏng vấn hỏi?'},
    {id:'specificity',name:'Vai trò & chứng cứ cụ thể',weight:40,hint:'Nêu việc chính bạn làm, bối cảnh và kết quả thật; không bịa trách nhiệm.'},
    {id:'structure',name:'Cấu trúc & súc tích',weight:30,hint:'Ý chính → ví dụ thật → kết quả/bài học. Chỉ tự chấm nếu có đoạn chứng minh.'},
  ] },
  BRSE: { version:'brse-text-v1', criteria:[
    {id:'clarify',name:'Làm rõ yêu cầu',weight:35,hint:'Câu hỏi làm rõ mục tiêu, điều kiện hoặc điều chưa biết là gì?'},
    {id:'impact',name:'Xác nhận tác động',weight:30,hint:'Nêu tác động kỹ thuật/phạm vi cần xác minh; không tự hứa điều chưa được nhóm đồng ý.'},
    {id:'actions',name:'Chốt bước tiếp theo',weight:35,hint:'Ai làm gì, khi nào phản hồi và cần khách xác nhận điều gì?'},
  ] },
}
export interface Question { id: string; track: Track; title: string; japanese: string; variant: string; intent: string; hints: string[]; followUp: string; topic: string }
export const questions: Question[] = [
  {id:'job-role-v1',track:'JOB',title:'Vai trò trong dự án',topic:'Dự án',japanese:'現在のプロジェクトでは、どの工程を担当していますか。',variant:'直近のプロジェクトで、ご自身が担当した作業を具体的に説明してください。',intent:'Làm rõ công đoạn và đóng góp cá nhân, không chỉ mô tả sản phẩm của cả nhóm.',hints:['Tên/bối cảnh dự án nếu được phép chia sẻ.','Công đoạn và việc cụ thể do bạn thực hiện.','Một ví dụ về xử lý khó khăn và kết quả có căn cứ.'],followUp:'その作業で難しかった点と、ご自身の対応を教えてください。'},
  {id:'job-motivation-v1',track:'JOB',title:'Lý do làm việc tại Nhật',topic:'Motivation',japanese:'日本で働きたい理由を教えてください。',variant:'日本での仕事を通じて、何を実現したいですか。',intent:'Liên kết mục tiêu nghề nghiệp với kế hoạch thực tế, không yêu cầu một động cơ mẫu.',hints:['Mục tiêu nghề nghiệp thật của bạn.','Vì sao môi trường công việc tại Nhật liên quan tới mục tiêu đó.','Một hành động chuẩn bị và kế hoạch tiếp theo.'],followUp:'その目標に向けて、今どのような準備をしていますか。'},
  {id:'job-api-v1',track:'JOB',title:'Giải thích UI → API → DB',topic:'Kỹ thuật',japanese:'画面からAPI、データベースまでの処理の流れを説明してください。',variant:'ユーザーが保存ボタンを押した後、データはどのように処理されますか。',intent:'Giải thích luồng kỹ thuật, ranh giới trách nhiệm và xử lý lỗi từ trải nghiệm thật.',hints:['Sự kiện UI và request gửi đi.','Validation/API/DB và response.','Xử lý lỗi và phần bạn thực sự làm.'],followUp:'APIがエラーを返した場合、画面ではどう対応しますか。'},
  {id:'brse-scope-v1',track:'BRSE',title:'Khách yêu cầu đổi phạm vi',topic:'Scope',japanese:'この機能を今週中に追加できますか。',variant:'急ぎの追加機能ですが、今週のリリースに含められますか。',intent:'Làm rõ nội dung trước khi cam kết, giải thích tác động và chốt thời điểm phản hồi.',hints:['Hỏi mục tiêu, phạm vi và mức độ ưu tiên.','Nêu điều cần kiểm tra với nhóm về ảnh hưởng và lịch.','Chốt người phụ trách và thời điểm phản hồi, không hứa tùy tiện.'],followUp:'もし今週に間に合わない場合、どのような代案がありますか。'},
  {id:'brse-bug-v1',track:'BRSE',title:'Tiếp nhận lỗi từ khách',topic:'Lỗi',japanese:'本番環境でエラーが発生しています。すぐに確認してください。',variant:'お客様から、本番画面が動かないとの連絡がありました。どう対応しますか。',intent:'Xác nhận ảnh hưởng và dữ kiện, phân biệt điều đã biết/chưa biết, thống nhất cập nhật.',hints:['Xác nhận màn hình, thời điểm, tái hiện và mức ảnh hưởng.','Nêu bước kiểm tra/giảm ảnh hưởng, không bịa nguyên nhân.','Chốt đầu mối và mốc cập nhật tiếp theo.'],followUp:'まだ原因が分からない段階で、お客様に何を報告しますか。'},
  {id:'brse-requirement-v1',track:'BRSE',title:'Làm rõ yêu cầu chưa cụ thể',topic:'Yêu cầu',japanese:'検索をもっと使いやすくしてほしいです。',variant:'今の検索機能が使いにくいので、改善をお願いできますか。',intent:'Chuyển yêu cầu mơ hồ thành điều kiện có thể xác nhận và nghiệm thu.',hints:['Hỏi tình huống sử dụng và khó khăn cụ thể.','Xác nhận điều kiện tìm kiếm, dữ liệu và giới hạn cần kiểm tra.','Tóm tắt hiểu biết, đề xuất bước xác nhận và tiêu chí nghiệm thu.'],followUp:'改善できたかどうか、どのような条件で確認しますか。'},
]
export const scenario=csvScenario
questions.push(...scenarios.flatMap(s=>s.turns) as Question[])
questions.push(...technicalDrills.map(({referencePoints,stack,level,...q})=>q) as Question[])
export function sessionQuestionIds(track:Track,scenarioId?:string){
  if(scenarioId){if(track!=='BRSE')throw new Error('Kịch bản không được hỗ trợ.');return scenarioById(scenarioId).turns.map(q=>q.id)}
  return track==='JOB'?['job-role-v1','job-motivation-v1','job-api-v1']:['brse-scope-v1','brse-bug-v1','brse-requirement-v1']
}
export function questionById(id: string) { const q=questions.find(q=>q.id===id); if(!q) throw new Error('Câu hỏi không được hỗ trợ.');return q }
const finiteTime=z.number().finite().min(0)
const reviewSchema=z.object({ criterionId:z.string().max(40), score:z.number().int().min(0).max(3), quote:z.string().min(1).max(10000), startOffset:z.number().int().min(0), note:z.string().trim().min(1).max(1000) }).strict()
export type Review = z.infer<typeof reviewSchema>
const annotationSchema=z.object({id:z.string().uuid(),criterionId:z.string(),utteranceId:z.string().uuid(),transcriptVersion:z.number().int().positive(),quote:z.string().min(1).max(10000),startOffset:z.number().int().min(0),endOffset:z.number().int().min(1),startMs:finiteTime,endMs:finiteTime,kind:z.enum(['OBSERVATION','REVIEW_PROMPT','SELF_REVIEW']),certainty:z.enum(['OBSERVED','UNDETERMINED','SELF_REPORTED']),reason:z.string().max(1500),suggestion:z.string().max(1500)}).strict()
export type Annotation = z.infer<typeof annotationSchema>
const revisionSchema=z.object({version:z.number().int().positive(),text:z.string().trim().min(1).max(10000),submittedAt:finiteTime,endMs:finiteTime,voice:voiceMetadataSchema.optional()}).strict()
export const interviewSchema=z.object({
  id:z.string().uuid(),questionId:z.string(),track:z.enum(['JOB','BRSE']),rubricVersion:z.string(),mode:z.enum(['INITIAL','GUIDED','INDEPENDENT']),
  parentId:z.string().uuid().nullable(),parentTranscriptVersion:z.number().int().positive().nullable(),rootTranscriptVersion:z.number().int().positive().nullable(),rootId:z.string().uuid(),createdAt:finiteTime,prompt:z.string().max(1000),status:z.enum(['DRAFT','REVIEWED']),
  draft:z.string().max(10000),utteranceId:z.string().uuid(),revisions:z.array(revisionSchema).max(30),reviews:z.array(reviewSchema).max(3),
  scenarioContext:z.array(z.object({attemptId:z.string().uuid(),version:z.number().int().positive()}).strict()).max(2).optional(),
  draftVoice:voiceMetadataSchema.optional(),
  aiFeedback:aiFeedbackSchema.optional(),
  feedback:z.object({engine:z.literal('LOCAL_RULES_V1'),transcriptVersion:z.number().int().positive(),annotations:z.array(annotationSchema).max(10)}).strict().nullable(),
}).strict().superRefine((a,ctx)=>{
  const bad=(message:string)=>ctx.addIssue({code:'custom',message})
  const q=questions.find(q=>q.id===a.questionId)
  if(!q || q.track!==a.track) {bad('Câu hỏi không khớp track.');return}
  const rubric=rubrics[a.track]
  if(a.rubricVersion!==rubric.version)bad('Phiên bản rubric không được hỗ trợ; không tự chuyển đổi điểm.')
  if(a.prompt!==(a.mode==='INDEPENDENT'?q.variant:q.japanese))bad('Prompt không khớp câu hỏi/kiểu luyện.')
  if(a.mode==='INITIAL' && (a.parentId!==null || a.parentTranscriptVersion!==null || a.rootTranscriptVersion!==null || a.rootId!==a.id))bad('Phiên đầu có liên kết retry không hợp lệ.')
  if(a.mode!=='INITIAL' && (!a.parentId || !a.parentTranscriptVersion || !a.rootTranscriptVersion || a.parentId===a.id || a.rootId===a.id))bad('Retry thiếu phiên gốc.')
  if(a.revisions.some((r,i)=>r.version!==i+1 || r.submittedAt<a.createdAt || (i>0 && r.endMs<a.revisions[i-1]!.endMs)))bad('Transcript version/timestamp không hợp lệ.')
  if(a.draftVoice&&a.status!=='DRAFT')bad('Voice nháp chỉ thuộc trạng thái DRAFT.')
  const last=a.revisions.at(-1)
  if(a.status==='REVIEWED' && (!last || !a.feedback || a.draft!==last.text))bad('Feedback thiếu transcript hiện hành.')
  if(a.status==='DRAFT' && (a.feedback || a.reviews.length))bad('Bản nháp không được giữ điểm/feedback cũ.')
  if(a.feedback && a.feedback.transcriptVersion!==last?.version)bad('Feedback đã lỗi thời.')
  if(a.aiFeedback) {
    const ai=a.aiFeedback
    if(a.status!=='REVIEWED' || !last || ai.transcriptVersion!==last.version || ai.utteranceId!==a.utteranceId || ai.rubricVersion!==a.rubricVersion)bad('AI feedback không khớp transcript/rubric hiện tại.')
    if(new Set(ai.criteria.map(c=>c.criterionId)).size!==rubric.criteria.length)bad('AI criteria trùng/thiếu.')
    const evidenceIds=new Set<string>()
    for(const c of ai.criteria) {
      if(!rubric.criteria.some(r=>r.id===c.criterionId) || (c.score!==null && !c.annotations.length))bad('AI score thiếu tiêu chí/chứng cứ.')
      for(const e of c.annotations) {
        if(evidenceIds.has(e.id))bad('AI evidence ID trùng.');evidenceIds.add(e.id)
        if(!last || e.criterionId!==c.criterionId || e.utteranceId!==a.utteranceId || e.transcriptVersion!==last.version || e.endMs!==last.endMs || last.text.slice(e.startOffset,e.endOffset)!==e.quote)bad('AI evidence không khớp đoạn trích/timestamp.')
      }
    }
    if(ai.followUp && (!last || !last.text.includes(ai.followUp.quote)))bad('AI follow-up thiếu chứng cứ.')
  }
  const ids=rubric.criteria.map(c=>c.id)
  if(new Set(a.reviews.map(r=>r.criterionId)).size!==a.reviews.length)bad('Tiêu chí bị trùng.')
  for(const r of a.reviews) {
    if(!ids.includes(r.criterionId) || !last || last.text.slice(r.startOffset,r.startOffset+r.quote.length)!==r.quote)bad('Trích dẫn tự đánh giá không khớp transcript.')
  }
  if(a.feedback && new Set(a.feedback.annotations.map(n=>n.id)).size!==a.feedback.annotations.length)bad('Annotation ID trùng.')
  for(const n of a.feedback?.annotations??[]) {
    if(!ids.includes(n.criterionId) || n.utteranceId!==a.utteranceId || n.transcriptVersion!==last?.version || !last || last.text.slice(n.startOffset,n.endOffset)!==n.quote || n.startMs!==0 || n.endMs!==last.endMs)bad('Annotation không khớp chứng cứ/timestamp.')
  }
})
export type Interview = z.infer<typeof interviewSchema>
export const interviewSessionSchema=z.object({
  id:z.string().uuid(),track:z.enum(['JOB','BRSE']),createdAt:finiteTime,
  mode:z.enum(['INITIAL','GUIDED','INDEPENDENT']),parentId:z.string().uuid().nullable(),
  attemptIds:z.array(z.string().uuid()).length(3),
  scenarioId:z.enum(scenarioIds).optional(),
  minutes:minutesSchema.optional(),
}).strict()
export type InterviewSession=z.infer<typeof interviewSessionSchema>
export function sessionReport(session:InterviewSession,attempts:Interview[]) {
  const turns=session.attemptIds.map(id=>attempts.find(a=>a.id===id)!)
  const staleIds=session.scenarioId?turns.filter((a,i)=>a?.status==='REVIEWED' && (a.scenarioContext?.length!==i||turns.slice(0,i).some((p,j)=>!p||p.status!=='REVIEWED'||a.scenarioContext?.[j]?.attemptId!==p.id||a.scenarioContext?.[j]?.version!==p.revisions.at(-1)?.version))).map(a=>a.id):[]
  // A later turn also depends on the context validity of all earlier turns.
  if(session.scenarioId)for(let i=0;i<turns.length;i++)if(turns[i]?.status==='REVIEWED'&&turns.slice(0,i).some(p=>staleIds.includes(p.id))&&!staleIds.includes(turns[i]!.id))staleIds.push(turns[i]!.id)
  const complete=turns.every(a=>a?.status==='REVIEWED')&&!staleIds.length
  const scores=turns.map(a=>a?reviewScore(a):null)
  return {turns,staleIds,complete,reviewed:turns.filter(a=>a?.status==='REVIEWED'&&!staleIds.includes(a.id)).length,
    selfScore:complete&&scores.every(s=>s!==null)?Math.round(scores.reduce<number>((sum,s)=>sum+(s??0),0)/scores.length):null}
}
export const interviewBackupSchema=z.object({format:z.literal('BRSE_INTERVIEW_BACKUP'),schemaVersion:z.literal(1),attempts:z.array(interviewSchema).max(300),sessions:z.array(interviewSessionSchema).max(100).default([]),reviewQueue:z.array(reviewItemSchema).max(300).default([])}).strict().superRefine((b,ctx)=>{
  const bad=(message:string)=>ctx.addIssue({code:'custom',message})
  for(const issue of validateQueueReferences(b.reviewQueue,b.attempts,b.sessions))bad(issue)
  const map=new Map(b.attempts.map(a=>[a.id,a]))
  if(map.size!==b.attempts.length)bad('Attempt ID trùng.')
  const sessionMap=new Map(b.sessions.map(s=>[s.id,s]))
  if(sessionMap.size!==b.sessions.length)bad('Session ID trùng.')
  const used=new Set<string>()
  for(const session of b.sessions){
    if(session.scenarioId&&session.track!=='BRSE'){bad('Kịch bản phải thuộc track BRSE.');continue}
    const expected=sessionQuestionIds(session.track,session.scenarioId)
    session.attemptIds.forEach((id,i)=>{
      const a=map.get(id)
      if(used.has(id))bad('Một attempt thuộc nhiều phiên.');used.add(id)
      if(!a||a.track!==session.track||a.questionId!==expected[i]||a.mode!==session.mode||a.createdAt!==session.createdAt)bad('Lượt không khớp kịch bản phiên.')
    })
    if(session.minutes){if(!session.scenarioId)bad('Biên bản chỉ thuộc phiên kịch bản.');for(const issue of validateMinutesReferences(session.minutes,session,b.attempts))bad(issue)}
    if(session.mode==='INITIAL'&&session.parentId!==null)bad('Phiên đầu không có parent.')
    if(session.mode!=='INITIAL'){
      const parent=session.parentId?sessionMap.get(session.parentId):undefined
      if(!parent||parent.track!==session.track||parent.scenarioId!==session.scenarioId||parent.createdAt>session.createdAt)bad('Thiếu phiên cha tương thích.')
      session.attemptIds.forEach((id,i)=>{if(map.get(id)?.parentId!==parent?.attemptIds[i])bad('Retry không khớp lượt phiên cha.')})
      const seen=new Set<string>();let cursor:InterviewSession|undefined=session
      while(cursor?.parentId){if(seen.has(cursor.id)){bad('Vòng lặp phiên.');break}seen.add(cursor.id);cursor=sessionMap.get(cursor.parentId)}
    }
  }

  for(const a of b.attempts) {
    const session=b.sessions.find(s=>s.attemptIds.includes(a.id)),index=session?.attemptIds.indexOf(a.id)??-1
    if(isScenarioQuestion(a.questionId)&&!session?.scenarioId)bad('Lượt kịch bản thiếu phiên liên kết.')
    if(a.scenarioContext){
      if(!session?.scenarioId||a.scenarioContext.length!==index)bad('Ngữ cảnh không khớp thứ tự lượt.')
      a.scenarioContext.forEach((c,i)=>{const prior=map.get(c.attemptId);if(c.attemptId!==session?.attemptIds[i]||!prior?.revisions.some(r=>r.version===c.version))bad('Version ngữ cảnh không tồn tại.')})
    }
    if(session?.scenarioId&&a.status==='REVIEWED'&&!a.scenarioContext)bad('Thiếu version ngữ cảnh của kịch bản.')
    if(a.parentId) {
      const p=map.get(a.parentId),root=map.get(a.rootId)
      if(!p || !root || root.mode!=='INITIAL' || p.rootId!==a.rootId || p.questionId!==a.questionId || p.track!==a.track || p.rubricVersion!==a.rubricVersion || !p.revisions.some(r=>r.version===a.parentTranscriptVersion) || !root.revisions.some(r=>r.version===a.rootTranscriptVersion) || a.createdAt<p.createdAt)bad('Retry không liên kết được với phiên gốc cùng rubric/câu hỏi.')
      const seen=new Set<string>();let cursor:Interview|undefined=a
      while(cursor?.parentId) {if(seen.has(cursor.id)){bad('Liên kết retry có vòng lặp.');break}seen.add(cursor.id);cursor=map.get(cursor.parentId)}
    }
  }
})
export function parseInterviewBackup(text:string) {
  if(text.length>5_000_000)throw new Error('Backup vượt 5 MB.')
  return interviewBackupSchema.parse(JSON.parse(text))
}
export function createInterview(questionId:string,now:number,parent?:Interview,mode:'GUIDED'|'INDEPENDENT'='GUIDED'):Interview {
  const q=questionById(questionId),id=crypto.randomUUID()
  if(parent && (parent.questionId!==questionId || parent.status!=='REVIEWED'))throw new Error('Cần hoàn thành feedback phiên trước khi retry.')
  return interviewSchema.parse({id,questionId,track:q.track,rubricVersion:rubrics[q.track].version,mode:parent?mode:'INITIAL',parentId:parent?.id??null,parentTranscriptVersion:parent?.revisions.at(-1)?.version??null,rootTranscriptVersion:parent?(parent.mode==='INITIAL'?parent.revisions.at(-1)!.version:parent.rootTranscriptVersion):null,rootId:parent?.rootId??id,createdAt:now,prompt:parent&&mode==='INDEPENDENT'?q.variant:q.japanese,status:'DRAFT',draft:'',utteranceId:crypto.randomUUID(),revisions:[],reviews:[],feedback:null})
}
export function generateFeedback(a:Interview):NonNullable<Interview['feedback']> {
  const last=a.revisions.at(-1);if(!last)throw new Error('Chưa có transcript.')
  const excerpt=Array.from(last.text).slice(0,160).join('')
  const annotations:Annotation[]=rubrics[a.track].criteria.map(c=>({
    id:crypto.randomUUID(),criterionId:c.id,utteranceId:a.utteranceId,transcriptVersion:last.version,
    quote:excerpt,startOffset:0,endOffset:excerpt.length,startMs:0,endMs:last.endMs,
    kind:'REVIEW_PROMPT',certainty:'UNDETERMINED',reason:'Phần rà soát local không chấm ngữ nghĩa bằng AI/mentor. Đoạn mở đầu này là điểm tham chiếu để bạn tự rà soát, không phải chứng cứ kết luận đạt hay thiếu tiêu chí.',suggestion:c.hint,
  }))
  const length=Array.from(last.text).length
  annotations.push({id:crypto.randomUUID(),criterionId:a.track==='JOB'?'structure':'actions',utteranceId:a.utteranceId,transcriptVersion:last.version,quote:excerpt,startOffset:0,endOffset:excerpt.length,startMs:0,endMs:last.endMs,kind:'OBSERVATION',certainty:'OBSERVED',reason:`Transcript có ${length} ký tự Unicode. Đây không phải thời lượng nói hoặc điểm năng lực.`,suggestion:length<40?'Câu trả lời ngắn theo ngưỡng thử nghiệm 40 ký tự. Nếu phù hợp câu hỏi, bổ sung một ví dụ thật; không suy ra chất lượng chỉ từ độ dài.':'Rà soát ý chính, căn cứ và phần có thể lược bỏ. Không kết luận chất lượng chỉ từ độ dài.'})
  for(const r of a.reviews)annotations.push({id:crypto.randomUUID(),criterionId:r.criterionId,utteranceId:a.utteranceId,transcriptVersion:last.version,quote:r.quote,startOffset:r.startOffset,endOffset:r.startOffset+r.quote.length,startMs:0,endMs:last.endMs,kind:'SELF_REVIEW',certainty:'SELF_REPORTED',reason:r.note,suggestion:'Điểm do bạn tự chấm; cần mentor/AI được kết nối kiểm chứng trước khi coi là đánh giá độc lập.'})
  return {engine:'LOCAL_RULES_V1',transcriptVersion:last.version,annotations}
}
export function submitAnswer(a:Interview,text:string,now:number):Interview {
  if(a.status!=='DRAFT')throw new Error('Hãy chọn sửa transcript để tạo version mới.')
  const answer=z.string().trim().min(1,'Câu trả lời không được trống.').max(10000).parse(text)
  if(a.revisions.length>=30)throw new Error('Đã đạt 30 version; hãy tạo attempt mới.')
  const next=structuredClone(a)
  next.revisions.push({version:next.revisions.length+1,text:answer,submittedAt:Math.max(now,a.createdAt),endMs:Math.max(0,now-a.createdAt,next.revisions.at(-1)?.endMs??0)})
  if(next.draftVoice){next.revisions.at(-1)!.voice=next.draftVoice;delete next.draftVoice}
  next.draft=answer;next.status='REVIEWED';next.reviews=[];delete next.aiFeedback;next.feedback=generateFeedback(next)
  return interviewSchema.parse(next)
}
export function editTranscript(a:Interview):Interview {
  const next=structuredClone(a);delete next.aiFeedback
  return interviewSchema.parse({...next,status:'DRAFT',feedback:null,reviews:[]})
}
export function saveReview(a:Interview,review:Review):Interview {
  if(a.status!=='REVIEWED')throw new Error('Chưa có transcript được gửi.')
  const next=structuredClone(a),r=reviewSchema.parse(review)
  const text=next.revisions.at(-1)!.text
  if(!rubrics[a.track].criteria.some(c=>c.id===r.criterionId) || text.slice(r.startOffset,r.startOffset+r.quote.length)!==r.quote)throw new Error('Hãy chọn đúng đoạn trích trong transcript hiện tại.')
  next.reviews=next.reviews.filter(v=>v.criterionId!==r.criterionId).concat(r)
  next.feedback=generateFeedback(next)
  return interviewSchema.parse(next)
}
export function reviewScore(a:Interview):number|null {
  const criteria=rubrics[a.track].criteria
  if(a.status!=='REVIEWED' || a.reviews.length!==criteria.length)return null
  return Math.round(criteria.reduce((sum,c)=>sum+(a.reviews.find(r=>r.criterionId===c.id)!.score/3)*c.weight,0))
}
export function compareInterviews(a:Interview,b:Interview) {
  const reasons:string[]=[]
  if(a.id===b.id)reasons.push('Cần hai attempts khác nhau.')
  if(a.rootId!==b.rootId || a.questionId!==b.questionId || a.track!==b.track || a.rubricVersion!==b.rubricVersion)reasons.push('Khác chuỗi luyện/câu hỏi/track/rubric.')
  const baselineA=a.mode==='INITIAL'?a.revisions.at(-1)?.version:a.rootTranscriptVersion
  const baselineB=b.mode==='INITIAL'?b.revisions.at(-1)?.version:b.rootTranscriptVersion
  if(baselineA!==baselineB)reasons.push('Phiên gốc đã đổi transcript version; không so điểm với baseline khác.')
  if(a.status!=='REVIEWED'||b.status!=='REVIEWED')reasons.push('Transcript/feedback chưa hoàn tất hoặc đã được chỉnh sửa.')
  if(a.mode==='GUIDED'||b.mode==='GUIDED')reasons.push('Có Guided Retry: chỉ xem đối chiếu, không coi là tiến bộ độc lập.')
  const deltas=rubrics[a.track].criteria.map(c=>{
    const before=a.reviews.find(r=>r.criterionId===c.id),after=b.reviews.find(r=>r.criterionId===c.id)
    return {id:c.id,name:c.name,before:before??null,after:after??null,delta:before&&after?after.score-before.score:null}
  })
  return {eligible:reasons.length===0,reasons,deltas}
}
