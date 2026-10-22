import 'fake-indexeddb/auto'
import {beforeEach,describe,it,expect} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import {toRaw} from 'vue'
import {openDB,deleteDB} from 'idb'
import {useInterviewStore} from '../src/stores/interview'
import {saveInterviews,loadInterviewData} from '../src/interview-storage'
import {queueState} from '../src/domain/review-queue'
import {rubrics} from '../src/domain/interview'
import type {AiFeedback} from '../src/domain/ai-feedback'
import {saveAttempts,loadAttempts} from '../src/storage'
import {createAttempt} from '../src/domain/timer'
import {practiceConfig} from '../src/domain/profiles'
beforeEach(async()=>{await saveInterviews([]);setActivePinia(createPinia())})
const text='私は画面の実装を担当しています。'
async function send(store:ReturnType<typeof useInterviewStore>,id:string){store.draft(id,text);await store.submit(id)}
async function setup(){const store=useInterviewStore();await store.init();const id=store.start('job-role-v1');await send(store,id);await store.review(id,{criterionId:'intent',score:1,quote:'画面',startOffset:text.indexOf('画面'),note:'Bổ sung vai trò cụ thể có căn cứ.'});return {store,id}}
async function add(){const x=await setup();const queueId=await x.store.queueCriterion(x.id,'intent','SELF_REVIEW');return {...x,queueId}}
describe('evidence-bound retry queue',()=>{
  it('upgrades v2 sessions/minutes without losing data or inventing queue entries',async()=>{
    const store=useInterviewStore();await store.init();const id=await store.startSession('BRSE',undefined,'GUIDED','csv-change-v1');await store.saveMinutes(id,{status:'DRAFT',entries:[],reviewedVersions:[]});const data=await loadInterviewData();await deleteDB('brse-interviews')
    const old=await openDB('brse-interviews',2,{upgrade(d){d.createObjectStore('attempts',{keyPath:'id'});d.createObjectStore('sessions',{keyPath:'id'})}});const tx=old.transaction(['attempts','sessions'],'readwrite');for(const a of data.attempts)await tx.objectStore('attempts').put(a);for(const s of data.sessions)await tx.objectStore('sessions').put(s);await tx.done;old.close()
    const restored=await loadInterviewData();expect(restored.attempts).toEqual(data.attempts);expect(restored.sessions).toEqual(data.sessions);expect(restored.reviewQueue).toEqual([])
  })
  it('captures self-review evidence, deduplicates and preserves exact transcript and ratings',async()=>{
    const {store,id,queueId}=await add(),before=JSON.stringify(store.attempts)
    expect(await store.queueCriterion(id,'intent','SELF_REVIEW')).toBe(queueId);expect(store.reviewQueue).toHaveLength(1);expect(JSON.stringify(store.attempts)).toBe(before)
    expect(store.reviewQueue[0]!.snapshot).toMatchObject({source:'SELF_REVIEW',score:1,quote:'画面'})
    await expect(store.queueCriterion(id,'specificity','SELF_REVIEW')).rejects.toThrow('chưa có');await expect(store.queueCriterion(id,'intent','AI_MODEL')).rejects.toThrow('Chưa có')
    expect((await loadInterviewData()).reviewQueue).toHaveLength(1)
  })
  it('links independent retries, resumes unfinished work and marks only manual completion',async()=>{
    const {store,queueId}=await add();await expect(store.finishQueue(queueId,true)).rejects.toThrow('hoàn tất')
    const target=await store.retryQueue(queueId,'INDEPENDENT');expect(target.sessionId).toBeNull();const a=store.attempts.find(a=>a.id===target.attemptId)!;expect(a.mode).toBe('INDEPENDENT');expect(a.parentTranscriptVersion).toBe(1)
    await expect(store.retryQueue(queueId,'GUIDED')).rejects.toThrow('tiếp tục');await send(store,a.id);await store.finishQueue(queueId,true);expect(store.reviewQueue[0]!.status).toBe('DONE')
    await store.edit(a.id);expect(queueState(store.reviewQueue[0]!,store.attempts,store.sessions).canFinish).toBe(false);expect(store.reviewQueue[0]!.status).toBe('DONE');await store.finishQueue(queueId,false);expect(store.reviewQueue[0]!.status).toBe('OPEN')
  })
  it('preserves stale snapshots after source edit and accepts a distinct new-version item',async()=>{
    const {store,id,queueId}=await add();await store.edit(id);expect(queueState(store.reviewQueue[0]!,store.attempts,store.sessions).stale).toBe(true);await expect(store.retryQueue(queueId,'GUIDED')).rejects.toThrow('Nguồn')
    await send(store,id);await store.review(id,{criterionId:'intent',score:2,quote:'画面',startOffset:text.indexOf('画面'),note:'Tự rà soát bản mới.'});await store.queueCriterion(id,'intent','SELF_REVIEW');expect(store.reviewQueue).toHaveLength(2)
    const backup=store.exportText();await store.clear();await store.importText(backup);const old=store.reviewQueue.find(i=>i.id===queueId)!;expect(old.version).toBe(1);expect(queueState(old,store.attempts,store.sessions).stale).toBe(true)
  })
  it('retries entire scenario and requires every turn current before manual finish',async()=>{
    const store=useInterviewStore();await store.init();const sid=await store.startSession('BRSE',undefined,'GUIDED','production-incident-v1');const s=store.sessions.find(s=>s.id===sid)!
    for(const id of s.attemptIds)await send(store,id);const id=s.attemptIds[0]!;await store.review(id,{criterionId:'clarify',score:1,quote:'画面',startOffset:text.indexOf('画面'),note:'Cần làm rõ ảnh hưởng.'});const qid=await store.queueCriterion(id,'clarify','SELF_REVIEW'),target=await store.retryQueue(qid,'GUIDED')
    expect(target.sessionId).not.toBeNull();const retry=store.sessions.find(s=>s.id===target.sessionId)!;expect(retry.scenarioId).toBe('production-incident-v1');await send(store,retry.attemptIds[0]!);await expect(store.finishQueue(qid,true)).rejects.toThrow('hoàn tất')
    for(const id of retry.attemptIds.slice(1))await send(store,id);await store.finishQueue(qid,true);expect(store.reviewQueue[0]!.status).toBe('DONE')
    await store.edit(s.attemptIds[0]!);expect(queueState(store.reviewQueue[0]!,store.attempts,store.sessions).stale).toBe(true)
  })
  it('keeps fixture AI source/model distinct from self-review without calling a provider',async()=>{
    const {store,id}=await setup(),a=store.attempts.find(a=>a.id===id)!,r=a.revisions[0]!
    const ai:AiFeedback={source:'AI_MODEL',provider:'openai',model:'fixture-model',rubricVersion:a.rubricVersion,utteranceId:a.utteranceId,transcriptVersion:1,criteria:rubrics.JOB.criteria.map(c=>({criterionId:c.id,score:2,annotations:[{id:crypto.randomUUID(),criterionId:c.id,utteranceId:a.utteranceId,transcriptVersion:1,quote:text,startOffset:0,endOffset:text.length,startMs:0,endMs:r.endMs,reason:'Fixture, not live inference.',suggestion:'Thêm một ví dụ thật.',certainty:'MODEL_ASSESSMENT'}]})),followUp:null,limitation:'Fixture only.'}
    await store.attachAi(id,1,text,ai);await store.queueCriterion(id,'intent','AI_MODEL');await store.queueCriterion(id,'intent','SELF_REVIEW');expect(store.reviewQueue).toHaveLength(2);expect(store.reviewQueue.find(i=>i.snapshot.source==='AI_MODEL')!.snapshot).toMatchObject({model:'fixture-model',score:2});expect(store.reviewQueue.find(i=>i.snapshot.source==='SELF_REVIEW')!.snapshot.score).toBe(1)
  })
  it('validates plans, imports and cross-attempt links atomically',async()=>{
    const {store,queueId}=await add();await store.planQueue(queueId,'Luyện câu trả lời với ví dụ thật.','HIGH');expect(store.reviewQueue[0]!.priority).toBe('HIGH');const original=store.exportText()
    await expect(store.planQueue(queueId,'','NORMAL')).rejects.toThrow();expect(store.exportText()).toBe(original)
    const edits=[(b:any)=>{b.reviewQueue[0].snapshot.quote='invented'},(b:any)=>{b.reviewQueue[0].version=99},(b:any)=>{b.reviewQueue[0].criterionId='unknown'},(b:any)=>{b.reviewQueue[0].snapshot.token='private'},(b:any)=>{b.reviewQueue.push(b.reviewQueue[0])},(b:any)=>{b.reviewQueue[0].retries=[{attemptId:b.attempts[0].id,sessionId:null}]}]
    for(const edit of edits){const bad=JSON.parse(original);edit(bad);await expect(store.importText(JSON.stringify(bad))).rejects.toThrow();expect(store.exportText()).toBe(original)}
    const legacy=JSON.parse(original);delete legacy.reviewQueue;await store.importText(JSON.stringify(legacy));expect(store.reviewQueue).toEqual([])
  })
  it('deletes only queue metadata and keeps Exam/transcript data intact',async()=>{
    const exam=createAttempt(practiceConfig('JLPT','N3'),'Local book','N3',1000);await saveAttempts([exam]);const {store,queueId}=await add(),before=structuredClone(toRaw(store.attempts));await store.removeQueue(queueId);expect(store.attempts).toEqual(before);expect(store.reviewQueue).toEqual([]);expect(await loadAttempts()).toEqual([exam])
  })
  it('bounds linked retry history at ten completed attempts',async()=>{
    const {store,queueId}=await add();for(let i=0;i<10;i++){const target=await store.retryQueue(queueId,'GUIDED');await send(store,target.attemptId)}await expect(store.retryQueue(queueId,'GUIDED')).rejects.toThrow('10 lần');expect(store.reviewQueue[0]!.retries).toHaveLength(10)
  })
})
