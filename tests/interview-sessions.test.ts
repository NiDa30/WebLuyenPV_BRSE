import 'fake-indexeddb/auto'
import {beforeEach,describe,it,expect} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import {openDB,deleteDB} from 'idb'
import {useInterviewStore} from '../src/stores/interview'
import {createInterview,parseInterviewBackup,sessionReport,compareInterviews} from '../src/domain/interview'
import {loadInterviewData,saveInterviews} from '../src/interview-storage'
beforeEach(async()=>{await saveInterviews([]);setActivePinia(createPinia())})
async function completed(){const store=useInterviewStore();await store.init();const id=await store.startSession('BRSE');const s=store.sessions.find(s=>s.id===id)!;for(const aid of s.attemptIds){store.draft(aid,'要件と影響を確認して、明日ご連絡します。');await store.submit(aid)}return {store,s}}
describe('multi-turn local sessions',()=>{
  it('upgrades v1 without losing a pre-existing draft',async()=>{
    await deleteDB('brse-interviews');const old=await openDB('brse-interviews',1,{upgrade(d){d.createObjectStore('attempts',{keyPath:'id'})}})
    const a=createInterview('job-role-v1',1000);a.draft='既存の回答';await old.put('attempts',a);old.close()
    expect((await loadInterviewData()).attempts).toEqual([a]);expect((await loadInterviewData()).sessions).toEqual([])
  })
  it('creates ordered track-specific turns and restores an unfinished session with backup',async()=>{
    const store=useInterviewStore();await store.init();await store.startSession('JOB');const s=store.sessions[0]!
    expect(s.attemptIds.map(id=>store.attempts.find(a=>a.id===id)!.questionId)).toEqual(['job-role-v1','job-motivation-v1','job-api-v1'])
    store.draft(s.attemptIds[0]!,'開発を担当しています。');await store.flush()
    const backup=store.exportText();await store.clear();await store.importText(backup)
    expect((await loadInterviewData()).sessions).toEqual([s]);expect(sessionReport(store.sessions[0]!,store.attempts).complete).toBe(false)
    expect(store.attempts.find(a=>a.id===s.attemptIds[0])!.draft).toBe('開発を担当しています。')
  })
  it('blocks premature retry and links every independent/guided turn to parent versions',async()=>{
    const {store,s}=await completed()
    for(const mode of ['GUIDED','INDEPENDENT'] as const){await store.startSession('BRSE',s.id,mode);const retry=store.sessions[0]!;expect(retry.parentId).toBe(s.id)
      retry.attemptIds.forEach((id,i)=>{const a=store.attempts.find(a=>a.id===id)!;expect(a.parentId).toBe(s.attemptIds[i]);expect(a.parentTranscriptVersion).toBe(1);expect(a.mode).toBe(mode);expect(a.draft).toBe('')})}
    await expect(store.startSession('BRSE',store.sessions[0]!.id)).rejects.toThrow('hoàn thành')
    expect(parseInterviewBackup(store.exportText()).sessions).toHaveLength(3)
  })
  it('requires all evidence scores for aggregate and invalidates immediately on edit',async()=>{
    const {store,s}=await completed();expect(sessionReport(s,store.attempts).selfScore).toBeNull()
    for(const id of s.attemptIds)for(const criterionId of ['clarify','impact','actions'])await store.review(id,{criterionId,score:2,quote:'要件',startOffset:0,note:'Cần xác nhận dữ kiện thật.'})
    expect(sessionReport(s,store.attempts).selfScore).toBe(67)
    await store.edit(s.attemptIds[0]!);expect(sessionReport(s,store.attempts).selfScore).toBeNull();expect(sessionReport(s,store.attempts).complete).toBe(false)
  })
  it('does not compare retry progress after the original session baseline changes',async()=>{
    const {store,s}=await completed();await store.startSession('BRSE',s.id,'INDEPENDENT');const retry=store.sessions[0]!
    const childId=retry.attemptIds[0]!,parentId=s.attemptIds[0]!
    store.draft(childId,'確認して回答します。');await store.submit(childId)
    const get=(id:string)=>store.attempts.find(a=>a.id===id)!
    expect(compareInterviews(get(parentId),get(childId)).eligible).toBe(true)
    await store.edit(parentId);store.draft(parentId,'影響を再確認します。');await store.submit(parentId)
    expect(compareInterviews(get(parentId),get(childId)).eligible).toBe(false)
    expect(compareInterviews(get(parentId),get(childId)).reasons.join(' ')).toContain('baseline')
    expect(parseInterviewBackup(store.exportText()).sessions).toHaveLength(2)
  })
  it('rejects corrupt session references atomically and imports legacy backups',async()=>{
    const {store}=await completed();const original=store.exportText(),bad=JSON.parse(original);bad.sessions[0].attemptIds[0]=crypto.randomUUID()
    await expect(store.importText(JSON.stringify(bad))).rejects.toThrow();expect(store.exportText()).toBe(original)
    const legacy=JSON.parse(original);delete legacy.sessions;await store.importText(JSON.stringify(legacy));expect(store.sessions).toEqual([]);expect(store.attempts).toHaveLength(3)
  })
})
