import {z} from 'zod'
import {demoPlanSchema} from './demo-plan-model'
export const demoAgenda=[{title:'Bối cảnh',seconds:60},{title:'Vai trò của tôi',seconds:60},{title:'Kiến trúc',seconds:120},{title:'Tính năng demo',seconds:180},{title:'Thách thức & lựa chọn',seconds:120},{title:'Kết quả',seconds:60}] as const
export const demoCriteria=[{id:'role',title:'Vai trò cụ thể',prompt:'Bạn trực tiếp làm phần nào? Phần nào do đồng đội phụ trách?'},{id:'tradeoff',title:'Lựa chọn kỹ thuật',prompt:'Vì sao chọn giải pháp này? Có đánh đổi và phương án khác nào?'},{id:'outcome',title:'Kết quả có căn cứ',prompt:'Kết quả được kiểm tra bằng cách nào? Điều gì chưa được xác minh?'}] as const
const time=z.number().int().min(0).max(8e15)
const review=z.object({criterion:z.enum(['role','tradeoff','outcome']),quote:z.string().trim().min(1).max(2000),next:z.string().trim().min(1).max(2000),version:z.number().int().positive()}).strict()
const answerReviewSchema=z.object({quote:z.string().trim().min(1).max(2000),next:z.string().trim().min(1).max(2000),version:z.number().int().positive()}).strict()
const followupSchema=z.object({criterion:z.enum(['role','tradeoff','outcome']),text:z.string().trim().min(1).max(8000),version:z.number().int().positive(),sourceVersion:z.number().int().positive(),review:answerReviewSchema.optional()}).strict().superRefine((a,c)=>{if(a.review&&(a.review.version!==a.version||!a.text.includes(a.review.quote)))c.addIssue({code:'custom',message:'Chứng cứ phản biện không khớp.'})})
export type DemoFollowup=z.infer<typeof followupSchema>
function validEvidence(s:{version:number;text:string;reviews:z.infer<typeof review>[];followups:DemoFollowup[]}){
 return new Set(s.reviews.map(r=>r.criterion)).size===s.reviews.length&&s.reviews.every(r=>r.version===s.version&&s.text.includes(r.quote))&&new Set(s.followups.map(a=>a.criterion)).size===s.followups.length&&s.followups.every(a=>a.sourceVersion<=s.version)
}
export const demoReferenceSchema=z.object({label:z.string().trim().min(1).max(80),url:z.string().trim().max(500).refine(value=>{try{const u=new URL(value);return value.startsWith('https://')&&!/[\\\s]/u.test(value)&&u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&!!u.hostname}catch{return false}},'Dùng HTTPS, không tài khoản/mật khẩu, query hoặc fragment.').transform(value=>new URL(value).href)}).strict()
const referencesSchema=z.array(demoReferenceSchema).max(3).refine(v=>new Set(v.map(r=>r.url)).size===v.length,'URL bị trùng.').default([])
export type DemoReference=z.infer<typeof demoReferenceSchema>
const baselineSchema=z.object({references:referencesSchema,version:z.number().int().positive(),text:z.string().min(1).max(20000).refine(v=>!!v.trim()),reviews:z.array(review).max(3),followups:z.array(followupSchema).length(3)}).strict().superRefine((s,c)=>{if(!validEvidence(s)||s.followups.some(a=>a.sourceVersion!==s.version))c.addIssue({code:'custom',message:'Baseline cần ba trả lời hiện hành và chứng cứ hợp lệ.'})})
const retrySchema=z.object({parentId:z.string().uuid(),mode:z.enum(['GUIDED','INDEPENDENT']),baseline:baselineSchema}).strict()
export const demoSessionSchema=z.object({id:z.string().uuid(),title:z.string().trim().min(1).max(120),createdAt:time,status:z.enum(['RUNNING','PAUSED','DONE']),anchorAt:time.nullable(),elapsedMs:z.number().int().min(0).max(86400000),splits:z.array(z.number().int().min(0).max(86400000)).max(5),text:z.string().max(20000),version:z.number().int().positive(),reviews:z.array(review).max(3),references:referencesSchema,followups:z.array(followupSchema).max(3).default([]),retry:retrySchema.optional()}).strict().superRefine((s,ctx)=>{
 if(!validEvidence(s)||(s.followups.length>0&&(s.status!=='DONE'||!s.text.trim()&&s.followups.some(a=>a.sourceVersion===s.version))))ctx.addIssue({code:'custom',message:'Trả lời phản biện phải thuộc bài trình bày đã lưu và kết thúc.'})
 if((s.status==='RUNNING')!==(s.anchorAt!==null))ctx.addIssue({code:'custom',message:'Anchor không khớp trạng thái.'})
 if(s.splits.some((v,i)=>v>s.elapsedMs||i>0&&v<s.splits[i-1]!))ctx.addIssue({code:'custom',message:'Splits không theo thứ tự.'})
 if(new Set(s.reviews.map(r=>r.criterion)).size!==s.reviews.length||s.reviews.some(r=>r.version!==s.version||!s.text.includes(r.quote))||s.status!=='DONE'&&s.reviews.length)ctx.addIssue({code:'custom',message:'Review phải gắn chứng cứ và phiên bản hiện tại đã kết thúc.'})
})
export type DemoSession=z.infer<typeof demoSessionSchema>
export const demoBackupSchema=z.object({format:z.literal('BRSE_DEMO_BACKUP'),schemaVersion:z.literal(1),sessions:z.array(demoSessionSchema).max(50),plans:z.array(demoPlanSchema).max(200).default([])}).strict().superRefine((v,c)=>{
 if(new Set(v.sessions.map(s=>s.id)).size!==v.sessions.length||v.sessions.filter(s=>s.status!=='DONE').length>1)c.addIssue({code:'custom',message:'ID trùng hoặc nhiều phiên đang luyện.'})
 if(new Set(v.plans.map(p=>p.id)).size!==v.plans.length)c.addIssue({code:'custom',message:'ID kế hoạch trùng.'})
 for(const p of v.plans){const source=v.sessions.find(s=>s.id===p.sessionId),answer=source?.followups.find(a=>a.criterion===p.criterion),retry=p.retryId?v.sessions.find(s=>s.id===p.retryId):undefined
 if(!source||source.status!=='DONE'||p.createdAt<source.createdAt||p.snapshot.sourceVersion>source.version||p.source==='FOLLOWUP'&&(!answer||p.snapshot.answerVersion!>answer.version)||p.retryId&&(!retry||retry.retry?.parentId!==p.sessionId||retry.createdAt<p.createdAt||p.doneAt!==null&&p.doneAt<retry.createdAt)||p.snapshot.sourceVersion===source?.version&&(p.source==='PRESENTATION'?p.snapshot.text!==source.text:p.snapshot.answerVersion===answer?.version&&p.snapshot.text!==answer.text))c.addIssue({code:'custom',message:'Nguồn/retry kế hoạch không hợp lệ.'})
 }
 for(const s of v.sessions){if(!s.retry)continue;const parent=v.sessions.find(p=>p.id===s.retry!.parentId)
 if(!parent||parent.id===s.id||parent.status!=='DONE'||parent.createdAt>s.createdAt||s.retry.baseline.version>parent.version||parent.title!==s.title)c.addIssue({code:'custom',message:'Nguồn retry không hợp lệ.'})
 const seen=new Set([s.id]);let p=parent;while(p){if(seen.has(p.id)){c.addIssue({code:'custom',message:'Retry bị vòng lặp.'});break}seen.add(p.id);const parentId=p.retry?.parentId;p=parentId?v.sessions.find(x=>x.id===parentId):undefined}
 }
})
export type DemoBackup=z.infer<typeof demoBackupSchema>
export const emptyDemo=():DemoBackup=>({format:'BRSE_DEMO_BACKUP',schemaVersion:1,sessions:[],plans:[]})
export function parseDemo(text:string){if(new TextEncoder().encode(text).length>5_000_000)throw Error('Backup vượt 5 MB.');return demoBackupSchema.parse(JSON.parse(text))}
export function demoElapsed(s:DemoSession,now:number){return Math.min(86400000,s.elapsedMs+(s.anchorAt===null?0:Math.max(0,Math.floor(now-s.anchorAt))))}
export function newDemo(title:string,now:number,id=crypto.randomUUID()):DemoSession{return demoSessionSchema.parse({id,title,createdAt:now,status:'RUNNING',anchorAt:now,elapsedMs:0,splits:[],text:'',version:1,reviews:[]})}
export function demoAction(s:DemoSession,action:'pause'|'resume'|'split'|'finish',now:number):DemoSession{
 const n=structuredClone(s),elapsed=demoElapsed(s,now)
 if(action==='resume'&&s.status==='PAUSED'){n.status='RUNNING';n.anchorAt=now}
 else if(action==='pause'&&s.status==='RUNNING'){n.status='PAUSED';n.elapsedMs=elapsed;n.anchorAt=null}
 else if(action==='split'&&s.status==='RUNNING'&&s.splits.length<5){n.elapsedMs=elapsed;n.anchorAt=now;n.splits.push(elapsed)}
 else if(action==='finish'&&s.status!=='DONE'){n.status='DONE';n.elapsedMs=elapsed;n.anchorAt=null}
 else throw Error('Thao tác không hợp lệ.')
 return demoSessionSchema.parse(n)
}
export function demoText(s:DemoSession,text:string):DemoSession{if(s.status!=='DONE')throw Error('Kết thúc lượt trước khi lưu nội dung.');return demoSessionSchema.parse({...s,text,version:s.version+(text!==s.text?1:0),reviews:text===s.text?s.reviews:[]})}
export function demoReview(s:DemoSession,criterion:'role'|'tradeoff'|'outcome',quote:string,next:string){return demoSessionSchema.parse({...s,reviews:[...s.reviews.filter(r=>r.criterion!==criterion),{criterion,quote,next,version:s.version}]})}

export function demoFollowup(s:DemoSession,criterion:DemoFollowup['criterion'],text:string):DemoSession{
 if(s.status!=='DONE'||!s.text.trim())throw Error('Lưu nội dung trình bày trước khi phản biện.')
 const previous=s.followups.find(a=>a.criterion===criterion),normalized=text.trim()
 if(previous?.text===normalized&&previous.sourceVersion===s.version)return s
 const answer={criterion,text:normalized,version:(previous?.version??0)+1,sourceVersion:s.version}
 return demoSessionSchema.parse({...s,followups:[...s.followups.filter(a=>a.criterion!==criterion),answer]})
}
export function demoFollowupReview(s:DemoSession,criterion:DemoFollowup['criterion'],quote:string,next:string):DemoSession{
 const answer=s.followups.find(a=>a.criterion===criterion);if(!answer||answer.sourceVersion!==s.version)throw Error('Cần câu trả lời hiện hành.')
 return demoSessionSchema.parse({...s,followups:s.followups.map(a=>a.criterion===criterion?{...a,review:{quote,next,version:a.version}}:a)})
}
export function demoReadyForRetry(s:DemoSession){return s.status==='DONE'&&!!s.text.trim()&&s.followups.length===3&&s.followups.every(a=>a.sourceVersion===s.version)}
export function demoBaseline(s:DemoSession){return {references:s.references,version:s.version,text:s.text,reviews:s.reviews,followups:s.followups}}
export function demoRetry(data:DemoBackup,parentId:string,mode:'GUIDED'|'INDEPENDENT',now:number,id=crypto.randomUUID()):DemoBackup{
 const parent=data.sessions.find(s=>s.id===parentId)
 if(!parent||!demoReadyForRetry(parent)||data.sessions.some(s=>s.status!=='DONE')||data.sessions.length>=50)throw Error('Hoàn tất ba câu phản biện hiện hành và phiên đang luyện trước khi retry.')
 const child=demoSessionSchema.parse({...newDemo(parent.title,now,id),references:structuredClone(parent.references),retry:{parentId,mode,baseline:structuredClone(demoBaseline(parent))}})
 return demoBackupSchema.parse({...data,sessions:[child,...data.sessions]})
}
export function demoBaselineCurrent(child:DemoSession,parent:DemoSession|undefined){const key=(b:ReturnType<typeof demoBaseline>)=>JSON.stringify({...b,reviews:[...b.reviews].sort((a,c)=>a.criterion.localeCompare(c.criterion)),followups:[...b.followups].sort((a,c)=>a.criterion.localeCompare(c.criterion))});return !!child.retry&&!!parent&&key(child.retry.baseline)===key(demoBaseline(parent))}

export function demoReferences(s:DemoSession,references:DemoReference[]):DemoSession{return demoSessionSchema.parse({...s,references})}
