import {queueState,queueKey,reviewItemSchema,type ReviewItem} from '../domain/review-queue'
import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
import { interviewSchema, createInterview, submitAnswer, editTranscript, saveReview, parseInterviewBackup, sessionQuestionIds, sessionReport, type Track, type InterviewSession, type Review, type Interview } from '../domain/interview'
import {isScenarioQuestion,type ScenarioId} from '../domain/scenarios'
import {minutesSchema,minutesState,exportMinutesText, type Minutes} from '../domain/minutes'
import {voiceMetadataSchema,type VoiceMetadata} from '../domain/voice-metadata'
import { loadInterviewData, saveInterviews } from '../interview-storage'
export const useInterviewStore=defineStore('interview',()=>{
  const reviewQueue=ref<ReviewItem[]>([])
  const sessions=ref<InterviewSession[]>([])
  const attempts=ref<Interview[]>([]),ready=ref(false),error=ref(''),saved=ref(false),busy=ref(false),loadFailed=ref(false)
  let writes:Promise<void>=Promise.resolve(),pending=0,generation=0
  let draftTimer:ReturnType<typeof setTimeout>|undefined
  function persist() {
    if(loadFailed.value)return Promise.reject(new Error('Không ghi đè dữ liệu chưa đọc được. Nhập backup hoặc xóa sau xác nhận để khôi phục.'))
    const snapshot=structuredClone(toRaw(attempts.value)),sessionSnapshot=structuredClone(toRaw(sessions.value)),queueSnapshot=structuredClone(toRaw(reviewQueue.value));const snapshotGeneration=++generation;saved.value=false;busy.value=true;pending++
    const operation=writes.catch(()=>{}).then(()=>saveInterviews(snapshot,sessionSnapshot,queueSnapshot))
    writes=operation.then(()=>{error.value='';if(pending===1&&snapshotGeneration===generation)saved.value=true}).catch(()=>{error.value='Không lưu được dữ liệu Interview. Giữ trang mở và xuất backup trước khi rời trang.'}).finally(()=>{pending--;busy.value=pending>0})
    return operation
  }
  function backgroundSave(){void persist().catch(()=>{})}
  let initializing:Promise<void>|undefined
  async function init(){if(ready.value)return;if(initializing)return initializing;initializing=(async()=>{try{const data=await loadInterviewData();attempts.value=data.attempts;sessions.value=data.sessions;reviewQueue.value=data.reviewQueue;saved.value=true}catch{loadFailed.value=true;error.value='Không đọc được dữ liệu Interview. Không tự ghi đè; khôi phục backup hoặc xóa sau xác nhận để tiếp tục.'}ready.value=true})();return initializing}
  function get(id:string){const a=attempts.value.find(a=>a.id===id);if(!a)throw new Error('Không tìm thấy attempt.');return a}
  function start(questionId:string,parentId?:string,mode:'GUIDED'|'INDEPENDENT'='GUIDED'){
    if(loadFailed.value)throw new Error(error.value)
    if(attempts.value.length>=300)throw new Error('Đạt giới hạn 300 attempts. Xuất backup trước khi xóa dữ liệu.')
    if(isScenarioQuestion(questionId))throw new Error('Hãy bắt đầu từ kịch bản BrSE để giữ ngữ cảnh.');
    const a=createInterview(questionId,Date.now(),parentId?get(parentId):undefined,mode)
    attempts.value.unshift(a);backgroundSave();return a.id
  }
  async function startSession(track:Track,parentId?:string,mode:'GUIDED'|'INDEPENDENT'='GUIDED',scenarioId?:ScenarioId){
    if(loadFailed.value)throw new Error(error.value)
    if(attempts.value.length+3>300||sessions.value.length>=100)throw new Error('Đạt giới hạn dữ liệu; xuất backup trước khi xóa.')
    const parent=parentId?sessions.value.find(s=>s.id===parentId):undefined
    if(parentId&&(!parent||parent.track!==track||!sessionReport(parent,attempts.value).complete))throw new Error('Cần hoàn thành tất cả lượt phiên cha trước khi retry.')
    const chosenScenario=parent?.scenarioId??scenarioId
    if(parent&&scenarioId&&scenarioId!==parent.scenarioId)throw new Error('Không đổi kịch bản trong retry.');
    const now=Date.now(),turns=sessionQuestionIds(track,chosenScenario).map((questionId,i)=>createInterview(questionId,now,parent?get(parent.attemptIds[i]!):undefined,mode))
    const session:InterviewSession={id:crypto.randomUUID(),track,createdAt:now,mode:parent?mode:'INITIAL',parentId:parent?.id??null,attemptIds:turns.map(a=>a.id),...(chosenScenario?{scenarioId:chosenScenario}:{})}
    attempts.value.unshift(...turns);sessions.value.unshift(session);await persist();return session.id
  }
  function draft(id:string,text:string){
    const a=get(id);if(a.status!=='DRAFT'||text.length>10000)return
    if(a.draft!==text)delete a.draftVoice
    a.draft=text;generation++;saved.value=false;clearTimeout(draftTimer);draftTimer=setTimeout(backgroundSave,350)
  }
  async function applyVoice(id:string,text:string,metadata:VoiceMetadata){const a=get(id);if(a.status!=='DRAFT')throw new Error('Chỉ áp dụng voice cho bản nháp.');const trimmed=text.trim();if(!trimmed||trimmed.length>10000)throw new Error('Transcript phải từ 1 đến 10.000 ký tự.');const checked=voiceMetadataSchema.parse(metadata);clearTimeout(draftTimer);replace(interviewSchema.parse({...structuredClone(toRaw(a)),draft:trimmed,draftVoice:checked}));await persist()}
  function replace(a:Interview){attempts.value[attempts.value.findIndex(v=>v.id===a.id)]=a}
  async function submit(id:string){clearTimeout(draftTimer);const a=get(id),session=sessions.value.find(s=>s.attemptIds.includes(id));let next=structuredClone(toRaw(a))
    if(session?.scenarioId){
      const index=session.attemptIds.indexOf(id),report=sessionReport(session,attempts.value),prior=report.turns.slice(0,index)
      if(prior.some(p=>p.status!=='REVIEWED'||report.staleIds.includes(p.id)))throw new Error('Hãy gửi lại các lượt trước với ngữ cảnh hiện tại trước khi tiếp tục.')
      next.scenarioContext=prior.map(p=>({attemptId:p.id,version:p.revisions.at(-1)!.version}))
    }
    replace(submitAnswer(next,a.draft,Date.now()));await persist()}
  async function attachAi(id:string,version:number,text:string,feedback:unknown){assertContextCurrent(id);const a=get(id);if(a.status!=='REVIEWED'||a.revisions.at(-1)?.version!==version||a.revisions.at(-1)?.text!==text)throw new Error('Transcript đã thay đổi; bỏ kết quả AI cũ.');replace(interviewSchema.parse({...structuredClone(toRaw(a)),aiFeedback:feedback}));await persist()}
  async function edit(id:string){replace(editTranscript(structuredClone(toRaw(get(id)))));await persist()}
  function assertContextCurrent(id:string){const s=sessions.value.find(s=>s.attemptIds.includes(id));if(s&&sessionReport(s,attempts.value).staleIds.includes(id))throw new Error('Ngữ cảnh đã thay đổi; cần rà soát và gửi lại transcript.')}
  async function review(id:string,r:Review){assertContextCurrent(id);replace(saveReview(structuredClone(toRaw(get(id))),r));await persist()}
  async function saveMinutes(id:string,value:Minutes){
    const s=sessions.value.find(s=>s.id===id);if(!s?.scenarioId)throw new Error('Không tìm thấy phiên kịch bản.')
    const minutes=minutesSchema.parse(value)
    // Validate the complete aggregate before mutating state or queuing a write.
    const candidate=structuredClone(toRaw(sessions.value));candidate.find(s=>s.id===id)!.minutes=minutes
    parseInterviewBackup(JSON.stringify({format:'BRSE_INTERVIEW_BACKUP',schemaVersion:1,attempts:toRaw(attempts.value),sessions:candidate,reviewQueue:toRaw(reviewQueue.value)}))
    if(minutes.status==='REVIEWED'&&!minutesState(minutes,s,attempts.value).current)throw new Error('Chứng cứ/ngữ cảnh đã thay đổi; cần rà soát lại biên bản.')
    s.minutes=minutes;await persist()
  }
  async function reviewMinutes(id:string){
    const s=sessions.value.find(s=>s.id===id);if(!s?.minutes?.entries.length)throw new Error('Cần ít nhất một mục có chứng cứ.')
    if(!sessionReport(s,attempts.value).complete)throw new Error('Cần hoàn tất hội thoại với ngữ cảnh hiện tại.')
    const next:Minutes={...structuredClone(toRaw(s.minutes)),status:'REVIEWED',reviewedVersions:s.attemptIds.map(attemptId=>({attemptId,version:get(attemptId).revisions.at(-1)!.version}))}
    await saveMinutes(id,next)
  }
  function minutesText(id:string){const s=sessions.value.find(s=>s.id===id);if(!s?.minutes)throw new Error('Chưa có biên bản.');return exportMinutesText(s.minutes,s,attempts.value)}
  function queueItem(id:string){const item=reviewQueue.value.find(i=>i.id===id);if(!item)throw new Error('Không tìm thấy mục luyện lại.');return item}
  async function queueCriterion(id:string,criterionId:string,source:'SELF_REVIEW'|'AI_MODEL'){
    const a=get(id);assertContextCurrent(id);if(a.status!=='REVIEWED')throw new Error('Cần transcript và chứng cứ hiện hành.')
    const self=a.reviews.find(r=>r.criterionId===criterionId),ai=a.aiFeedback?.criteria.find(c=>c.criterionId===criterionId),annotation=ai?.annotations[0]
    let snapshot:ReviewItem['snapshot']
    if(source==='SELF_REVIEW'){if(!self)throw new Error('Tiêu chí chưa có tự đánh giá có chứng cứ.');snapshot={source,quote:self.quote,startOffset:self.startOffset,endOffset:self.startOffset+self.quote.length,score:self.score,reason:self.note}}
    else {if(!annotation||!a.aiFeedback)throw new Error('Chưa có AI feedback có chứng cứ.');snapshot={source,provider:a.aiFeedback.provider,model:a.aiFeedback.model,quote:annotation.quote,startOffset:annotation.startOffset,endOffset:annotation.endOffset,score:ai!.score,reason:annotation.reason}}
    const item:ReviewItem={id:crypto.randomUUID(),attemptId:id,version:a.revisions.at(-1)!.version,criterionId,createdAt:Date.now(),snapshot,nextStep:source==='SELF_REVIEW'?self!.note:annotation!.suggestion.slice(0,1000)||'Rà soát lại chứng cứ và thử diễn đạt khác.',priority:'NORMAL',status:'OPEN',doneAt:null,retries:[]}
    const existing=reviewQueue.value.find(i=>queueKey(i)===queueKey(item));if(existing)return existing.id
    if(reviewQueue.value.length>=300)throw new Error('Đạt giới hạn 300 mục; xuất backup trước khi xóa.')
    parseInterviewBackup(JSON.stringify({format:'BRSE_INTERVIEW_BACKUP',schemaVersion:1,attempts:toRaw(attempts.value),sessions:toRaw(sessions.value),reviewQueue:[...toRaw(reviewQueue.value),item]}))
    reviewQueue.value.unshift(item);await persist();return item.id
  }
  async function planQueue(id:string,nextStep:string,priority:'NORMAL'|'HIGH'){
    const item=queueItem(id);const candidate={...structuredClone(toRaw(item)),nextStep,priority}
    const checked=reviewItemSchema.parse(candidate);Object.assign(item,checked);await persist()
  }
  async function retryQueue(id:string,mode:'GUIDED'|'INDEPENDENT'){
    const item=queueItem(id),state=queueState(item,attempts.value,sessions.value)
    if(state.stale)throw new Error('Nguồn đã thay đổi. Rà soát feedback hiện tại và thêm mục mới.')
    if(state.target&&!state.retryComplete)throw new Error('Hãy tiếp tục retry gần nhất trước khi tạo lần mới.')
    if(item.retries.length>=10)throw new Error('Đạt giới hạn 10 lần luyện cho mục này.')
    const sourceSession=sessions.value.find(s=>s.attemptIds.includes(item.attemptId));let attemptId:string,sessionId:string|null=null
    if(sourceSession?.scenarioId){sessionId=await startSession(sourceSession.track,sourceSession.id,mode);attemptId=sessions.value.find(s=>s.id===sessionId)!.attemptIds[sourceSession.attemptIds.indexOf(item.attemptId)]!}
    else attemptId=start(state.source!.questionId,item.attemptId,mode)
    item.retries.push({attemptId,sessionId});item.status='OPEN';item.doneAt=null;await persist();return {attemptId,sessionId}
  }
  async function finishQueue(id:string,done:boolean){const item=queueItem(id);if(done&&!queueState(item,attempts.value,sessions.value).canFinish)throw new Error('Cần hoàn tất retry hiện hành trước khi tự đánh dấu đã luyện.');item.status=done?'DONE':'OPEN';item.doneAt=done?Date.now():null;await persist()}
  async function removeQueue(id:string){reviewQueue.value=reviewQueue.value.filter(i=>i.id!==id);await persist()}
  function exportText(){return JSON.stringify({format:'BRSE_INTERVIEW_BACKUP',schemaVersion:1,attempts:toRaw(attempts.value),sessions:toRaw(sessions.value),reviewQueue:toRaw(reviewQueue.value)},null,2)}
  async function importText(text:string){const data=parseInterviewBackup(text);clearTimeout(draftTimer);await writes;await saveInterviews(data.attempts,data.sessions,data.reviewQueue);attempts.value=data.attempts;sessions.value=data.sessions;reviewQueue.value=data.reviewQueue;loadFailed.value=false;error.value='';saved.value=true}
  async function clear(){clearTimeout(draftTimer);await writes;await saveInterviews([]);attempts.value=[];sessions.value=[];reviewQueue.value=[];loadFailed.value=false;error.value='';saved.value=true}
  async function flush(){clearTimeout(draftTimer);if(!loadFailed.value)await persist()}
  return {reviewQueue,queueCriterion,planQueue,retryQueue,finishQueue,removeQueue,saveMinutes,reviewMinutes,minutesText,sessions,startSession,attempts,ready,error,saved,busy,loadFailed,init,start,draft,submit,edit,review,attachAi,applyVoice,exportText,importText,clear,flush}
})
