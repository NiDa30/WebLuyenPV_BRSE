import {demoBackupSchema,demoRetry,demoReadyForRetry,type DemoBackup,type DemoSession} from './demo'
import {demoPlanSchema,type DemoPlan} from './demo-plan-model'
export function demoPlanState(p:DemoPlan,sessions:DemoSession[]){const s=sessions.find(s=>s.id===p.sessionId),a=s?.followups.find(a=>a.criterion===p.criterion),r=p.source==='PRESENTATION'?s?.reviews.find(r=>r.criterion===p.criterion):a?.review
 const stale=!s||s.version!==p.snapshot.sourceVersion||p.source==='FOLLOWUP'&&a?.version!==p.snapshot.answerVersion||!r||r.quote!==p.snapshot.quote||r.next!==p.snapshot.next
 const child=sessions.find(s=>s.id===p.retryId),canFinish=!stale&&!!child&&child.retry?.parentId===p.sessionId&&demoReadyForRetry(child)
 return {stale,canFinish,doneCurrent:p.status==='DONE'&&canFinish}
}
export function createDemoPlan(data:DemoBackup,sessionId:string,source:DemoPlan['source'],criterion:DemoPlan['criterion'],day:string,now:number,id=crypto.randomUUID()):DemoBackup{
 const s=data.sessions.find(s=>s.id===sessionId),a=s?.followups.find(a=>a.criterion===criterion),r=source==='PRESENTATION'?s?.reviews.find(r=>r.criterion===criterion):a?.review
 if(!s||s.status!=='DONE'||!r||source==='FOLLOWUP'&&a?.sourceVersion!==s.version)throw Error('Cần review hiện hành có chứng cứ.')
 const snapshot={sourceVersion:s.version,answerVersion:source==='FOLLOWUP'?a!.version:null,text:source==='PRESENTATION'?s.text:a!.text,quote:r.quote,next:r.next}
 if(data.plans.some(p=>p.status==='OPEN'&&p.sessionId===sessionId&&p.source===source&&p.criterion===criterion&&JSON.stringify(p.snapshot)===JSON.stringify(snapshot)))throw Error('Mục này đã có kế hoạch mở.')
 const plan=demoPlanSchema.parse({id,sessionId,source,criterion,day,createdAt:now,status:'OPEN',doneAt:null,retryId:null,snapshot})
 return demoBackupSchema.parse({...data,plans:[plan,...data.plans]})
}
export function scheduleDemoPlan(data:DemoBackup,id:string,day:string){if(!data.plans.some(p=>p.id===id&&p.status==='OPEN'))throw Error('Kế hoạch không còn mở.');return demoBackupSchema.parse({...data,plans:data.plans.map(p=>p.id===id?{...p,day}:p)})}
export function retryDemoPlan(data:DemoBackup,id:string,mode:'GUIDED'|'INDEPENDENT',now:number,childId=crypto.randomUUID()){
 const p=data.plans.find(p=>p.id===id);if(!p||p.status!=='OPEN'||p.retryId||demoPlanState(p,data.sessions).stale)throw Error('Kiểm tra nguồn hoặc tiếp tục lượt retry đã liên kết.')
 const next=demoRetry(data,p.sessionId,mode,now,childId);return demoBackupSchema.parse({...next,plans:next.plans.map(p=>p.id===id?{...p,retryId:childId}:p)})
}
export function finishDemoPlan(data:DemoBackup,id:string,now:number){const p=data.plans.find(p=>p.id===id);if(!p||p.status!=='OPEN'||!demoPlanState(p,data.sessions).canFinish)throw Error('Cần nguồn hiện hành và lượt retry đã đủ nội dung + ba trả lời.');return demoBackupSchema.parse({...data,plans:data.plans.map(p=>p.id===id?{...p,status:'DONE',doneAt:now}:p)})}
export function removeDemoPlan(data:DemoBackup,id:string){return demoBackupSchema.parse({...data,plans:data.plans.filter(p=>p.id!==id)})}
