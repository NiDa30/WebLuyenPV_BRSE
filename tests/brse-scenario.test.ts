import 'fake-indexeddb/auto'
import {beforeEach,describe,it,expect} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import {toRaw} from 'vue'
import {useInterviewStore} from '../src/stores/interview'
import {saveInterviews,loadInterviewData} from '../src/interview-storage'
import {scenario,sessionReport,parseInterviewBackup,sessionQuestionIds} from '../src/domain/interview'
import {saveAttempts,loadAttempts} from '../src/storage'
import {createAttempt} from '../src/domain/timer'
import {practiceConfig} from '../src/domain/profiles'
beforeEach(async()=>{await saveInterviews([]);setActivePinia(createPinia())})
async function start(){const store=useInterviewStore();await store.init();const id=await store.startSession('BRSE',undefined,'GUIDED','csv-change-v1');const session=store.sessions.find(s=>s.id===id)!;return {store,session}}
const answer='要件と影響を確認します。明日、担当者から報告します。'
async function send(store:ReturnType<typeof useInterviewStore>,id:string){store.draft(id,answer);await store.submit(id)}
async function complete(){const x=await start();for(const id of x.session.attemptIds)await send(x.store,id);return x}
describe('continuous authored BrSE scenario',()=>{
  it('keeps normal session catalog unchanged and separates scenario questions',async()=>{
    const {store,session}=await start();expect(session.attemptIds.map(id=>store.attempts.find(a=>a.id===id)!.questionId)).toEqual(scenario.turns.map(q=>q.id))
    expect(sessionQuestionIds('BRSE')).toEqual(['brse-scope-v1','brse-bug-v1','brse-requirement-v1'])
    expect(()=>sessionQuestionIds('JOB',scenario.id)).toThrow();expect(()=>store.start(scenario.turns[0]!.id)).toThrow('kịch bản')
  })
  it('enforces turn order in the store, including attempts opened from history',async()=>{
    const {store,session}=await start();await expect(send(store,session.attemptIds[1]!)).rejects.toThrow('lượt trước')
    expect(store.attempts.find(a=>a.id===session.attemptIds[1])!.revisions).toHaveLength(0)
    await send(store,session.attemptIds[0]!);await send(store,session.attemptIds[1]!)
    const data=await loadInterviewData();expect(data.attempts.find(a=>a.id===session.attemptIds[1])!.scenarioContext).toEqual([{attemptId:session.attemptIds[0],version:1}])
  })
  it('persists each context snapshot and resumes through backup round-trip',async()=>{
    const {store,session}=await complete();const backup=store.exportText();await store.clear();await store.importText(backup)
    const last=store.attempts.find(a=>a.id===session.attemptIds[2])!
    expect(last.scenarioContext).toEqual(session.attemptIds.slice(0,2).map(attemptId=>({attemptId,version:1})))
    expect(sessionReport(store.sessions[0]!,store.attempts).complete).toBe(true)
  })
  it('invalidates downstream context transitively and gates score, review and full-session retry',async()=>{
    const {store,session}=await complete();const [one,two,three]=session.attemptIds as [string,string,string]
    for(const id of session.attemptIds)for(const criterionId of ['clarify','impact','actions'])await store.review(id,{criterionId,score:2,quote:'要件',startOffset:0,note:'Tự rà soát chứng cứ.'})
    expect(sessionReport(session,store.attempts).selfScore).toBe(67)
    await store.edit(one);let report=sessionReport(session,store.attempts)
    expect(report.staleIds).toEqual([two,three]);expect(report.selfScore).toBeNull()
    await expect(store.review(two,{criterionId:'clarify',score:3,quote:'要件',startOffset:0,note:'Ghi chú mới.'})).rejects.toThrow('Ngữ cảnh')
    await expect(store.attachAi(two,1,answer,{})).rejects.toThrow('Ngữ cảnh')
    await expect(store.startSession('BRSE',session.id,'INDEPENDENT')).rejects.toThrow('hoàn thành')
    await send(store,one);await store.edit(three);await expect(send(store,three)).rejects.toThrow('lượt trước')
    await store.edit(two);await send(store,two);await send(store,three)
    report=sessionReport(session,store.attempts);expect(report.staleIds).toEqual([]);expect(report.complete).toBe(true)
    expect(report.selfScore).toBeNull();expect(store.attempts.find(a=>a.id===three)!.scenarioContext).toEqual([{attemptId:one,version:2},{attemptId:two,version:2}])
  })
  it('restores stale historical context without relabeling it as current',async()=>{
    const {store,session}=await complete();await store.edit(session.attemptIds[0]!);await send(store,session.attemptIds[0]!)
    const backup=store.exportText();await store.clear();await store.importText(backup)
    expect(sessionReport(store.sessions[0]!,store.attempts).staleIds).toHaveLength(2)
    expect(store.attempts.find(a=>a.id===session.attemptIds[1])!.scenarioContext?.[0]?.version).toBe(1)
  })
  it('guided and independent retries keep scenario identity, blank drafts, new context and pinned parents',async()=>{
    const {store,session}=await complete()
    for(const mode of ['GUIDED','INDEPENDENT'] as const){await store.startSession('BRSE',session.id,mode);const retry=store.sessions[0]!
      expect(retry.scenarioId).toBe(scenario.id)
      for(const [i,id] of retry.attemptIds.entries()){const a=store.attempts.find(a=>a.id===id)!;expect(a.draft).toBe('');expect(a.scenarioContext).toBeUndefined();expect(a.parentId).toBe(session.attemptIds[i]);expect(a.parentTranscriptVersion).toBe(1);expect(a.mode).toBe(mode)}
      await send(store,retry.attemptIds[0]!);await send(store,retry.attemptIds[1]!)
      expect(store.attempts.find(a=>a.id===retry.attemptIds[1])!.scenarioContext?.[0]?.attemptId).toBe(retry.attemptIds[0])
    }
    expect(parseInterviewBackup(store.exportText()).sessions).toHaveLength(3)
  })
  it('rejects forged versions, wrong context order, extra private fields and missing scenario atomically',async()=>{
    const {store}=await complete(),original=store.exportText()
    const edits=[(b:any)=>{b.attempts[2].scenarioContext[0].version=99},(b:any)=>{b.attempts[2].scenarioContext.reverse()},(b:any)=>{b.attempts[2].scenarioContext[0].rawAudio='private'},(b:any)=>{delete b.sessions[0].scenarioId},(b:any)=>{b.sessions[0].track='JOB'}]
    for(const edit of edits){const bad=JSON.parse(original);edit(bad);await expect(store.importText(JSON.stringify(bad))).rejects.toThrow();expect(store.exportText()).toBe(original)}
  })
  it('does not modify existing Exam data during scenario save, import or deletion',async()=>{
    const exam=createAttempt(practiceConfig('JLPT','N3'),'Private book','N3',1000);await saveAttempts([exam])
    const {store}=await complete();const backup=store.exportText();await store.clear();await store.importText(backup)
    expect(await loadAttempts()).toEqual([exam]);expect(structuredClone(toRaw(store.sessions))).toHaveLength(1)
  })
})
