import 'fake-indexeddb/auto'
import {beforeEach,describe,it,expect} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import {toRaw} from 'vue'
import {useInterviewStore} from '../src/stores/interview'
import {saveInterviews,loadInterviewData} from '../src/interview-storage'
import {minutesState,type Minutes,type MinuteEntry} from '../src/domain/minutes'
import {sessionReport} from '../src/domain/interview'
import type {ScenarioId} from '../src/domain/scenarios'
beforeEach(async()=>{await saveInterviews([]);setActivePinia(createPinia())})
async function start(id:ScenarioId='csv-change-v1',complete=true){const store=useInterviewStore();await store.init();const sid=await store.startSession('BRSE',undefined,'GUIDED',id);const session=store.sessions.find(s=>s.id===sid)!
  for(const aid of (complete?session.attemptIds:session.attemptIds.slice(0,1))){store.draft(aid,'要件を確認します。十時三十分に報告します。');await store.submit(aid)}return {store,session}}
function entry(attemptId:string,patch:Partial<MinuteEntry>={}):MinuteEntry{return {id:crypto.randomUUID(),kind:'ACTION',text:'Đề xuất đầu mối báo cáo, cần xác nhận.',owner:'BrSE (đề xuất)',due:'10:30 (mốc cập nhật)',confirmation:'PROPOSED',evidence:{attemptId,version:1,source:'CANDIDATE',quote:'十時三十分に報告します。',startOffset:9,endOffset:21},...patch}}
function draft(e:MinuteEntry):Minutes{return {status:'DRAFT',entries:[e],reviewedVersions:[]}}
// Use offsets computed from the exact test text, not visual positions.
function candidate(id:string){const e=entry(id),text='要件を確認します。十時三十分に報告します。';e.evidence.startOffset=text.indexOf(e.evidence.quote);e.evidence.endOffset=e.evidence.startOffset+e.evidence.quote.length;return e}
describe('evidence-bound local meeting minutes',()=>{
  it('persists draft without changing transcript/reviews and reviews/exports only current conversation',async()=>{
    const {store,session}=await start(),before=JSON.stringify(store.attempts);await store.saveMinutes(session.id,draft(candidate(session.attemptIds[2]!)))
    expect(JSON.stringify(store.attempts)).toBe(before);expect(()=>store.minutesText(session.id)).toThrow('chưa rà soát')
    await store.reviewMinutes(session.id);expect(minutesState(session.minutes!,session,store.attempts).exportable).toBe(true)
    const text=store.minutesText(session.id);expect(text).toContain('KHÔNG PHẢI XÁC NHẬN CỦA KHÁCH');expect(text).toContain('Đề xuất');expect(text).toContain('10:30');expect(text).toContain('CANDIDATE')
    expect((await loadInterviewData()).sessions[0]!.minutes?.status).toBe('REVIEWED')
  })
  it('saves during incomplete practice but blocks final review/export',async()=>{
    const {store,session}=await start('csv-change-v1',false);await store.saveMinutes(session.id,draft(candidate(session.attemptIds[0]!)))
    await expect(store.reviewMinutes(session.id)).rejects.toThrow('hoàn tất');expect(()=>store.minutesText(session.id)).toThrow()
  })
  it('accepts exact authored customer evidence with explicit self-reported confirmation',async()=>{
    const {store,session}=await start('production-incident-v1'),a=store.attempts.find(a=>a.id===session.attemptIds[2])!,quote='十時三十分',offset=a.prompt.indexOf(quote)
    const e=candidate(a.id);e.confirmation='CONFIRMED';e.evidence={attemptId:a.id,version:1,source:'CUSTOMER',quote,startOffset:offset,endOffset:offset+quote.length}
    await store.saveMinutes(session.id,draft(e));await store.reviewMinutes(session.id);expect(store.minutesText(session.id)).toContain('Đã xác nhận (người học tự khai)')
  })
  it('invalidates reviewed minutes on source edit even when wording remains identical, preserving old evidence',async()=>{
    const {store,session}=await start();const id=session.attemptIds[2]!;await store.saveMinutes(session.id,draft(candidate(id)));await store.reviewMinutes(session.id)
    await store.edit(id);expect(minutesState(session.minutes!,session,store.attempts).exportable).toBe(false)
    await store.submit(id);expect(minutesState(session.minutes!,session,store.attempts).staleIds).toEqual([session.minutes!.entries[0]!.id])
    await expect(store.reviewMinutes(session.id)).rejects.toThrow('thay đổi');expect(()=>store.minutesText(session.id)).toThrow()
    const e=structuredClone(toRaw(session.minutes!.entries[0]!));e.evidence.version=2;await store.saveMinutes(session.id,draft(e));await store.reviewMinutes(session.id);expect(store.minutesText(session.id)).toContain('v2')
  })
  it('invalidates minutes through upstream context even if cited downstream version did not change',async()=>{
    const {store,session}=await start();await store.saveMinutes(session.id,draft(candidate(session.attemptIds[2]!)));await store.reviewMinutes(session.id);await store.edit(session.attemptIds[0]!)
    expect(sessionReport(session,store.attempts).staleIds).toHaveLength(2);expect(minutesState(session.minutes!,session,store.attempts).exportable).toBe(false)
    await expect(store.reviewMinutes(session.id)).rejects.toThrow('hoàn tất')
  })
  it('round-trips stale minutes and never copies them into guided/independent retries',async()=>{
    const {store,session}=await start();await store.saveMinutes(session.id,draft(candidate(session.attemptIds[0]!)));await store.reviewMinutes(session.id)
    await store.startSession('BRSE',session.id,'INDEPENDENT');expect(store.sessions[0]!.minutes).toBeUndefined()
    await store.edit(session.attemptIds[0]!);const backup=store.exportText();await store.clear();await store.importText(backup)
    const restored=store.sessions.find(s=>s.id===session.id)!;expect(restored.minutes?.status).toBe('REVIEWED');expect(minutesState(restored.minutes!,restored,store.attempts).exportable).toBe(false)
  })
  it('rejects forged quote/source/version, missing action owner/time, duplicate IDs and oversized entries before mutation',async()=>{
    const {store,session}=await start();await store.saveMinutes(session.id,draft(candidate(session.attemptIds[0]!)));const original=store.exportText()
    const broken=[(e:MinuteEntry)=>{e.evidence.quote='invented'},(e:MinuteEntry)=>{e.evidence.version=99},(e:MinuteEntry)=>{e.owner=''},(e:MinuteEntry)=>{e.due=''},(e:MinuteEntry)=>{e.text='a'.repeat(1001)}]
    for(const edit of broken){const e=candidate(session.attemptIds[0]!);edit(e);await expect(store.saveMinutes(session.id,draft(e))).rejects.toThrow();expect(store.exportText()).toBe(original)}
    const e=candidate(session.attemptIds[0]!);await expect(store.saveMinutes(session.id,{status:'DRAFT',entries:[e,e],reviewedVersions:[]})).rejects.toThrow()
    await expect(store.saveMinutes(session.id,{status:'DRAFT',entries:Array.from({length:13},()=>candidate(session.attemptIds[0]!)),reviewedVersions:[]})).rejects.toThrow()
    expect(store.exportText()).toBe(original)
  })
  it('rejects cross-session evidence and corrupted imported metadata atomically',async()=>{
    const {store,session}=await start();await store.startSession('BRSE',undefined,'GUIDED','production-incident-v1');const other=store.sessions[0]!
    await expect(store.saveMinutes(other.id,draft(candidate(session.attemptIds[0]!)))).rejects.toThrow()
    await store.saveMinutes(session.id,draft(candidate(session.attemptIds[0]!)));const original=store.exportText(),bad=JSON.parse(original);bad.sessions.find((s:any)=>s.id===session.id).minutes.entries[0].evidence.token='private'
    await expect(store.importText(JSON.stringify(bad))).rejects.toThrow();expect(store.exportText()).toBe(original)
  })
})
describe('production scenario registry',()=>{
  it('persists incident prompts, original scripts and pinned retry identity without mixing scenarios',async()=>{
    const {store,session}=await start('production-incident-v1');expect(session.attemptIds.map(id=>store.attempts.find(a=>a.id===id)!.questionId)).toEqual(['scenario-incident-intake-v1','scenario-incident-update-v1','scenario-incident-plan-v1'])
    expect(()=>store.start('scenario-incident-intake-v1')).toThrow('kịch bản')
    await expect(store.startSession('BRSE',session.id,'GUIDED','csv-change-v1')).rejects.toThrow('đổi kịch bản')
    await store.startSession('BRSE',session.id,'GUIDED');expect(store.sessions[0]!.scenarioId).toBe('production-incident-v1');expect(store.sessions[0]!.attemptIds.every(id=>store.attempts.find(a=>a.id===id)!.draft==='')).toBe(true)
    expect((await loadInterviewData()).sessions).toHaveLength(2)
  })
})
