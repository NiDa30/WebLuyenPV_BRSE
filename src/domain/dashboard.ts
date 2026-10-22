import {technicalGoalState,type TechnicalGoal} from './technical-goals'
import {technicalById} from './technical'
import {demoPlanState} from './demo-plans'
import type {DemoPlan} from './demo-plan-model'
import {demoReadyForRetry,type DemoSession} from './demo'
import type {Attempt} from './model'
import {questionById,sessionReport,type Interview,type InterviewSession} from './interview'
import {queueState,type ReviewItem} from './review-queue'
import {reviewState,type Bookmark} from './vocabulary'
export type DashboardTarget={kind:'TECHNICAL_GOAL';id:string}|{kind:'TECHNICAL_GOALS'}|{kind:'DEMO_PLAN'}|{kind:'DEMO_DATA'}|{kind:'DEMO_SESSION';id:string}|{kind:'EXAM_DATA'}|{kind:'INTERVIEW_DATA'}|{kind:'VOCABULARY_DATA'}|{kind:'EXAM_TIMER'}|{kind:'EXAM_RESULT';id:string}|{kind:'INTERVIEW_ATTEMPT';id:string}|{kind:'INTERVIEW_SESSION';id:string}|{kind:'QUEUE'}|{kind:'VOCABULARY_REVIEW'}|{kind:'VOCABULARY_NOTEBOOK'}
export interface DashboardInput{technicalGoals?:TechnicalGoal[]|null;demos?:DemoSession[]|null;demoPlans?:DemoPlan[];exams:Attempt[]|null;interviews:{attempts:Interview[];sessions:InterviewSession[];queue:ReviewItem[]}|null;bookmarks:Bookmark[]|null}
export interface Activity{id:string;at:number;module:'EXAM'|'INTERVIEW'|'VOCABULARY'|'DEMO';label:string;detail:string;target:DashboardTarget;countKind:'EXAM_END'|'TRANSCRIPT'|'VOCABULARY'|'DEMO_START'|null}
function calendar(zone:string){try{return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'})}catch{return new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'})}}
function key(at:number,format:Intl.DateTimeFormat){if(!Number.isFinite(at)||Math.abs(at)>8.64e15)return null;const parts=format.formatToParts(new Date(at)),get=(name:string)=>parts.find(p=>p.type===name)?.value;return `${get('year')}-${get('month')}-${get('day')}`}
export function learningDashboard(input:DashboardInput,now:number,days:7|30,zone:string){
 const format=calendar(zone),today=key(now,format)!,[year,month,day]=today.split('-').map(Number),date=new Date(Date.UTC(year!,month!-1,day!))
 date.setUTCDate(date.getUTCDate()-days+1)
 const daily=Array.from({length:days},()=>{const day=date.toISOString().slice(0,10);date.setUTCDate(date.getUTCDate()+1);return {day,demoStarts:input.demos==null?null:0,exams:input.exams===null?null:0,transcripts:input.interviews===null?null:0,vocabulary:input.bookmarks===null?null:0}})
 const activities:Activity[]=[],actions:{label:string;detail:string;target:DashboardTarget}[]=[]
 let exam:null|{total:number;completed:number;active:number;partsWithInput:number;missingEndTime:number}=null
 if(input.exams){const completed=input.exams.filter(a=>a.status==='COMPLETED'),active=input.exams.find(a=>a.status!=='COMPLETED');exam={total:input.exams.length,completed:completed.length,active:active?1:0,partsWithInput:completed.reduce((sum,a)=>sum+a.results.filter(r=>r.answered!==null||r.correct!==null||r.score!==null).length,0),missingEndTime:completed.filter(a=>!a.events.some(e=>e.kind==='EXAM_END')).length}
  if(active)actions.push({label:'Tiếp tục Exam đang làm',detail:`${active.material} · ${active.status}`,target:{kind:'EXAM_TIMER'}})
  for(const a of input.exams){const end=a.status==='COMPLETED'?[...a.events].reverse().find(e=>e.kind==='EXAM_END'):undefined;activities.push({id:'exam:'+a.id,at:end?.wall??a.createdAt,module:'EXAM',label:a.material,detail:end?'Kết thúc timer · chưa xác minh điểm thi':'Tạo phiên · trạng thái hiện tại '+a.status,target:a.status==='COMPLETED'?{kind:'EXAM_RESULT',id:a.id}:{kind:'EXAM_TIMER'},countKind:end?'EXAM_END':null})}
 }
 let interview:null|{total:number;drafts:number;reviewed:number;initial:number;guided:number;independent:number;selfRatings:number;aiAssessments:number;sessions:number;completeSessions:number;staleSessions:number;queueOpen:number;queueStale:number;queueDone:number;queueDoneCurrent:number}=null
 if(input.interviews){const {attempts,sessions,queue}=input.interviews,reports=sessions.map(s=>({s,report:sessionReport(s,attempts)})),qs=queue.map(item=>({item,state:queueState(item,attempts,sessions)}))
  interview={total:attempts.length,drafts:attempts.filter(a=>a.status==='DRAFT').length,reviewed:attempts.filter(a=>a.status==='REVIEWED').length,initial:attempts.filter(a=>a.mode==='INITIAL').length,guided:attempts.filter(a=>a.mode==='GUIDED').length,independent:attempts.filter(a=>a.mode==='INDEPENDENT').length,selfRatings:attempts.reduce((n,a)=>n+a.reviews.length,0),aiAssessments:attempts.filter(a=>!!a.aiFeedback).length,sessions:sessions.length,completeSessions:reports.filter(r=>r.report.complete).length,staleSessions:reports.filter(r=>r.report.staleIds.length>0).length,queueOpen:queue.filter(q=>q.status==='OPEN').length,queueStale:qs.filter(q=>q.state.stale).length,queueDone:queue.filter(q=>q.status==='DONE').length,queueDoneCurrent:qs.filter(q=>q.item.status==='DONE'&&q.state.canFinish).length}
  const pending=reports.filter(r=>!r.report.complete).sort((a,b)=>Number(b.report.staleIds.length>0)-Number(a.report.staleIds.length>0)||b.s.createdAt-a.s.createdAt)[0]
  const draft=attempts.filter(a=>a.status==='DRAFT'&&!sessions.some(s=>s.attemptIds.includes(a.id))).sort((a,b)=>b.createdAt-a.createdAt)[0]
  if(pending)actions.push({label:pending.report.staleIds.length?'Rà soát ngữ cảnh phiên Interview':'Tiếp tục phiên Interview',detail:`${pending.report.reviewed}/3 lượt hiện hành · ${pending.s.mode}`,target:{kind:'INTERVIEW_SESSION',id:pending.s.id}})
  if(draft)actions.push({label:'Tiếp tục bản nháp Interview',detail:questionById(draft.questionId).title,target:{kind:'INTERVIEW_ATTEMPT',id:draft.id}})
  if(queue.length)actions.push({label:'Mở hàng đợi luyện lại',detail:`${interview.queueOpen} mục mở · ${interview.queueStale} mục có nguồn đổi`,target:{kind:'QUEUE'}})
  for(const a of attempts)for(const r of a.revisions)activities.push({id:`interview:${a.id}:${r.version}`,at:r.submittedAt,module:'INTERVIEW',label:questionById(a.questionId).title,detail:`Gửi transcript v${r.version} · ${a.track} · ${a.mode}; mở attempt hiện tại`,target:{kind:'INTERVIEW_ATTEMPT',id:a.id},countKind:'TRANSCRIPT'})
 }
 let vocabulary:null|{total:number;due:number;waiting:number;stale:number;missingNote:number;full:number;ratings:number}=null
 if(input.bookmarks){const states=input.bookmarks.map(b=>({b,state:reviewState(b,now)}));vocabulary={total:states.length,due:states.filter(x=>x.state.due&&!x.state.full).length,waiting:states.filter(x=>x.state.eligible&&!x.state.stale&&!x.state.full&&!x.state.due).length,stale:states.filter(x=>x.state.stale).length,missingNote:states.filter(x=>!x.state.eligible).length,full:states.filter(x=>x.state.full).length,ratings:states.reduce((n,x)=>n+x.state.count,0)}
  if(vocabulary.due)actions.push({label:'Ôn từ đến hạn',detail:`${vocabulary.due} thẻ · mức nhớ tự khai`,target:{kind:'VOCABULARY_REVIEW'}})
  else if(vocabulary.stale||vocabulary.full)actions.push({label:'Rà soát lịch ôn từ',detail:`${vocabulary.stale} thẻ đổi nội dung · ${vocabulary.full} thẻ đạt giới hạn`,target:{kind:'VOCABULARY_REVIEW'}})
  if(vocabulary.missingNote)actions.push({label:'Bổ sung ghi chú sổ từ',detail:`${vocabulary.missingNote} thẻ thiếu ghi chú cá nhân`,target:{kind:'VOCABULARY_NOTEBOOK'}})
  for(const b of input.bookmarks)for(const [i,e] of (b.schedule?.events??[]).entries())activities.push({id:`vocab:${b.id}:${i}`,at:e.at,module:'VOCABULARY',label:b.term,detail:`Mức nhớ tự khai: ${e.grade}${b.schedule?.contentVersion!==b.contentVersion?' · nội dung phiên bản cũ':''}`,target:{kind:'VOCABULARY_REVIEW'},countKind:'VOCABULARY'})
 }
 let demo:null|{total:number;active:number;done:number;ready:number;staleAnswers:number;retries:number;reviews:number;plansOpen:number;plansDue:number;plansStale:number;plansDone:number}=null
 if(input.demos){const plans=input.demoPlans??[],sessions=input.demos,active=sessions.find(s=>s.status!=='DONE'),pending=sessions.filter(s=>s.status==='DONE'&&!demoReadyForRetry(s)).sort((a,b)=>Number(b.followups.some(q=>q.sourceVersion!==b.version))-Number(a.followups.some(q=>q.sourceVersion!==a.version))||b.createdAt-a.createdAt)[0]
 demo={plansOpen:plans.filter(p=>p.status==='OPEN').length,plansDue:plans.filter(p=>p.status==='OPEN'&&p.day<=today).length,plansStale:plans.filter(p=>demoPlanState(p,sessions).stale).length,plansDone:plans.filter(p=>p.status==='DONE').length,total:sessions.length,active:active?1:0,done:sessions.filter(s=>s.status==='DONE').length,ready:sessions.filter(demoReadyForRetry).length,staleAnswers:sessions.reduce((n,s)=>n+s.followups.filter(a=>a.sourceVersion!==s.version).length,0),retries:sessions.filter(s=>s.retry).length,reviews:sessions.reduce((n,s)=>n+s.reviews.length+s.followups.filter(a=>a.sourceVersion===s.version&&a.review).length,0)}
 if(demo.plansOpen)actions.push({label:'Xem kế hoạch luyện Demo',detail:`${demo.plansDue} mục đến ngày · ${demo.plansStale} mục có nguồn đổi`,target:{kind:'DEMO_PLAN'}})
 if(active)actions.push({label:'Tiếp tục Demo đang luyện',detail:`${active.title} · ${active.status}`,target:{kind:'DEMO_SESSION',id:active.id}})
 if(pending)actions.push({label:'Hoàn thiện phản biện Demo',detail:`${pending.title} · ${pending.followups.filter(a=>a.sourceVersion===pending.version).length}/3 trả lời hiện hành`,target:{kind:'DEMO_SESSION',id:pending.id}})
 for(const s of sessions)activities.push({id:'demo:'+s.id,at:s.createdAt,module:'DEMO',label:s.title,detail:`Tạo lượt Demo · trạng thái hiện tại ${s.status}${s.retry?' · '+s.retry.mode:''}; không phải mốc hoàn tất`,target:{kind:'DEMO_SESSION',id:s.id},countKind:'DEMO_START'})
 }
 let technical:null|{total:number;open:number;done:number;met:number|null;doneCurrent:number|null;stale:number|null;missing:number|null}=null
 if(input.technicalGoals){const goals=input.technicalGoals,attempts=input.interviews?.attempts??null,states=goals.map(g=>({g,state:technicalGoalState(g,attempts)}));technical={total:goals.length,open:goals.filter(g=>g.status==='OPEN').length,done:goals.filter(g=>g.status==='DONE').length,met:attempts===null?null:states.filter(x=>x.g.status==='OPEN'&&x.state?.met).length,doneCurrent:attempts===null?null:states.filter(x=>x.g.status==='DONE'&&x.state?.met).length,stale:attempts===null?null:states.reduce((n,x)=>n+(x.state?.stale??0),0),missing:attempts===null?null:states.reduce((n,x)=>n+(x.state?.missing??0),0)}
 const pending=states.filter(x=>x.g.status==='OPEN').sort((a,b)=>Number(!!b.state&&(b.state.missing>0||b.state.stale>0))-Number(!!a.state&&(a.state.missing>0||a.state.stale>0))||b.g.createdAt-a.g.createdAt)[0]
 if(pending)actions.push({label:'Tiếp tục mục tiêu kỹ thuật',detail:`${technicalById(pending.g.questionId)?.title} · ${pending.g.mode} · ${pending.state?.count??'N/A'}/${pending.g.target} lượt đúng chế độ`,target:{kind:'TECHNICAL_GOAL',id:pending.g.id}})
 }
 const available=activities.filter(a=>a.at<=now&&key(a.at,format)!==null).sort((a,b)=>b.at-a.at||a.id.localeCompare(b.id))
 const lookup=new Map(daily.map(row=>[row.day,row]));for(const event of available){const row=lookup.get(key(event.at,format)!);if(!row)continue;if(event.countKind==='DEMO_START'&&row.demoStarts!==null)row.demoStarts++;if(event.countKind==='EXAM_END'&&row.exams!==null)row.exams++;if(event.countKind==='TRANSCRIPT'&&row.transcripts!==null)row.transcripts++;if(event.countKind==='VOCABULARY'&&row.vocabulary!==null)row.vocabulary++}
 return {exam,interview,vocabulary,demo,technical,actions,daily,recent:available.slice(0,20),timezone:format.resolvedOptions().timeZone,omittedTimes:activities.length-available.length}
}
