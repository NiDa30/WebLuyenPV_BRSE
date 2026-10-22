import 'fake-indexeddb/auto'
import {afterEach,describe,it,expect,vi} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import {createInterview,submitAnswer,interviewSchema,editTranscript,parseInterviewBackup,rubrics,saveReview} from '../src/domain/interview'
import type {AiFeedback} from '../src/domain/ai-feedback'
import {requestAiFeedback,providerCapabilities,AiRequestError} from '../src/ai-client'
import {useInterviewStore} from '../src/stores/interview'
import {saveInterviews,loadInterviews} from '../src/interview-storage'
import {questions} from '../src/domain/interview'
import {readFileSync} from 'node:fs'
const make=()=>submitAnswer(createInterview('job-role-v1',1000),'私は画面の実装を担当しました。',2000)
function feedback(a=make()):AiFeedback {
 const r=a.revisions.at(-1)!
 return {source:'AI_MODEL',provider:'openai',model:'fixture-model',rubricVersion:a.rubricVersion,utteranceId:a.utteranceId,transcriptVersion:r.version,criteria:rubrics[a.track].criteria.map(c=>({criterionId:c.id,score:2,annotations:[{id:crypto.randomUUID(),criterionId:c.id,utteranceId:a.utteranceId,transcriptVersion:r.version,quote:r.text,startOffset:0,endOffset:r.text.length,startMs:0,endMs:r.endMs,reason:'Fixture assessment, not live AI.',suggestion:'Bổ sung ví dụ thật nếu có.',certainty:'MODEL_ASSESSMENT'}]})),followUp:{question:'その結果を教えてください。',quote:r.text,reason:'Follow-up fixture.'},limitation:'Model may be incorrect.'}
}
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})
describe('AI feedback boundary and portability',()=>{
 it('server authored catalog is exactly in sync with frontend question/rubric registry',()=>{
  const data=JSON.parse(readFileSync('backend/src/main/resources/interview-catalog.json','utf8'))
  expect(data.questions).toEqual(questions.map(({id,track,japanese,variant})=>({id,track,japanese,variant})))
  for(const track of ['JOB','BRSE'] as const){expect(data.rubrics[track].version).toBe(rubrics[track].version);expect(data.rubrics[track].criteria).toEqual(rubrics[track].criteria.map(({id,name,weight})=>({id,name,weight})))}
 })
 it('keeps model assessments separate from local/self reviews; old and AI-enriched backups round-trip',()=>{
  const a=make(),ai=feedback(a),checked=interviewSchema.parse({...a,aiFeedback:ai})
  expect(checked.feedback?.engine).toBe('LOCAL_RULES_V1');expect(checked.reviews).toHaveLength(0)
  const changed=saveReview(checked,{criterionId:'intent',score:1,quote:a.draft,startOffset:0,note:'Tự đánh giá riêng.'})
  expect(changed.aiFeedback).toEqual(ai)
  for(const attempt of [a,checked])expect(parseInterviewBackup(JSON.stringify({format:'BRSE_INTERVIEW_BACKUP',schemaVersion:1,attempts:[attempt]})).attempts[0]).toEqual(attempt)
  expect(editTranscript(checked).aiFeedback).toBeUndefined()
 })
 it('rejects wrong versions, bad quotes, missing evidence, duplicate criteria and fabricated follow-up',()=>{
  const a=make(),ai=feedback(a)
  const invalids=[{...ai,transcriptVersion:2},{...ai,utteranceId:crypto.randomUUID()},{...ai,rubricVersion:'new'}]
  for(const value of invalids)expect(interviewSchema.safeParse({...a,aiFeedback:value}).success).toBe(false)
  for(const mutate of [(v:AiFeedback)=>{v.criteria[0]!.annotations[0]!.quote='invented'},(v:AiFeedback)=>{v.criteria[0]!.annotations=[]},(v:AiFeedback)=>{v.criteria[1]!.criterionId=v.criteria[0]!.criterionId},(v:AiFeedback)=>{v.followUp!.quote='invented'}]){const v=structuredClone(ai);mutate(v);expect(interviewSchema.safeParse({...a,aiFeedback:v}).success).toBe(false)}
 })
 it('discard stale in-flight result when transcript changes, without erasing local answer',async()=>{
  await saveInterviews([]);setActivePinia(createPinia());const s=useInterviewStore();await s.init()
  const id=s.start('job-role-v1');s.draft(id,'私は画面の実装を担当しました。');await s.submit(id)
  const a=structuredClone((await loadInterviews())[0]!),ai=feedback(a)
  await s.edit(id);s.draft(id,'変更した回答です。');await s.submit(id)
  await expect(s.attachAi(id,1,a.draft,ai)).rejects.toThrow('Transcript')
  expect(s.attempts[0]!.draft).toBe('変更した回答です。');expect(s.attempts[0]!.aiFeedback).toBeUndefined()
 })
})
describe('anonymous client capabilities',()=>{
 it('uses memory-only bearer token, minimal body and deletes session after feedback',async()=>{
  const a=make(),id=crypto.randomUUID(),token='synthetic-capability-token-'.repeat(2)
  const fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({id,capabilityToken:token,expiresAt:'2026-10-21T00:15:00Z'}),{status:201})).mockResolvedValueOnce(new Response(JSON.stringify(feedback(a)),{status:200})).mockResolvedValueOnce(new Response(null,{status:204}))
  vi.stubGlobal('fetch',fetchMock)
  await requestAiFeedback(a,new AbortController().signal)
  expect(fetchMock).toHaveBeenCalledTimes(3)
  const [url,options]=fetchMock.mock.calls[1]!
  expect(url).not.toContain(token);expect(options.headers.Authorization).toBe(`Bearer ${token}`)
  const body=JSON.parse(options.body);expect(Object.keys(body).sort()).toEqual(['endMs','mode','questionId','text','transcriptVersion','utteranceId'].sort());expect(options.body).not.toContain(token)
  expect(fetchMock.mock.calls[2]![1].method).toBe('DELETE')
  expect(JSON.stringify(a)).not.toContain(token)
 })
 it('provider/network failures are propagated and still clean up session',async()=>{
  const id=crypto.randomUUID(),fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({id,capabilityToken:'x'.repeat(43),expiresAt:'2026-10-21T00:15:00Z'}),{status:201})).mockResolvedValueOnce(new Response(JSON.stringify({code:'PROVIDER_UNAVAILABLE'}),{status:503})).mockResolvedValueOnce(new Response(null,{status:204}))
  vi.stubGlobal('fetch',fetchMock);await expect(requestAiFeedback(make(),new AbortController().signal)).rejects.toMatchObject({code:'PROVIDER_UNAVAILABLE'});expect(fetchMock.mock.calls[2]![1].method).toBe('DELETE')
 })
 it('capability/schema checks reject unavailable malformed responses and oversized payloads',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('not-json',{status:200})));await expect(providerCapabilities()).rejects.toBeInstanceOf(AiRequestError)
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('x'.repeat(150001),{status:200})));await expect(providerCapabilities()).rejects.toMatchObject({code:'RESPONSE_TOO_LARGE'})
 })
})
