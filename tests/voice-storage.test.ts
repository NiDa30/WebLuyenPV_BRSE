import 'fake-indexeddb/auto'
import {beforeEach,describe,it,expect} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import {useInterviewStore} from '../src/stores/interview'
import {saveInterviews,loadInterviews} from '../src/interview-storage'
import {parseInterviewBackup,interviewSchema,editTranscript,submitAnswer} from '../src/domain/interview'
import type {VoiceMetadata} from '../src/domain/voice-metadata'
const metadata:VoiceMetadata={source:'BROWSER_ASR_REVIEWED',lang:'ja-JP',reviewConfirmed:true,mergeMode:'REPLACE',confidence:.5,captureDurationMs:3000,reviewedAt:1000}
beforeEach(async()=>{await saveInterviews([]);setActivePinia(createPinia())})
describe('reviewed voice transcript persistence without media',()=>{
 it('applies reviewed text to draft, not auto-submit, and persists metadata through submission/export/reload',async()=>{
  const s=useInterviewStore();await s.init();const id=s.start('job-role-v1');await s.applyVoice(id,'私は画面を担当しました。',metadata)
  expect(s.attempts[0]!.status).toBe('DRAFT');expect(s.attempts[0]!.feedback).toBeNull();expect(s.attempts[0]!.draftVoice).toEqual(metadata)
  await s.submit(id);expect(s.attempts[0]!.revisions[0]!.voice).toEqual(metadata);expect(s.attempts[0]!.draftVoice).toBeUndefined()
  const data=parseInterviewBackup(s.exportText());await saveInterviews(data.attempts);expect((await loadInterviews())[0]!.revisions[0]!.voice).toEqual(metadata)
  expect(s.exportText()).not.toMatch(/blob:|audioUrl|capabilityToken|data:audio/)
 })
 it('manual draft changes clear the reviewed-voice stamp; edited resubmission needs new review',async()=>{
  const s=useInterviewStore();await s.init();const id=s.start('job-role-v1');await s.applyVoice(id,'確認します。',metadata);s.draft(id,'修正した回答です。');expect(s.attempts[0]!.draftVoice).toBeUndefined();await s.submit(id);expect(s.attempts[0]!.revisions[0]!.voice).toBeUndefined()
  await s.edit(id);await s.applyVoice(id,'担当内容を説明します。',metadata);await s.submit(id)
  const first=s.attempts[0]!;expect(first.revisions[1]!.voice).toEqual(metadata)
  const edited=submitAnswer(editTranscript(structuredClone((await loadInterviews())[0]!)),'さらに修正します。',Date.now()+1000);expect(edited.revisions[2]!.voice).toBeUndefined();expect(edited.revisions[1]!.voice).toEqual(metadata)
 })
 it('rejects unconfirmed metadata, wrong language, invalid confidence, raw audio fields and reviewed-attempt apply',async()=>{
  const s=useInterviewStore();await s.init();const id=s.start('brse-scope-v1')
  for(const invalid of [{...metadata,reviewConfirmed:false},{...metadata,lang:'en-US'},{...metadata,confidence:2},{...metadata,audioUrl:'blob:private'}])await expect(s.applyVoice(id,'確認します。',invalid as VoiceMetadata)).rejects.toThrow()
  expect(s.attempts[0]!.draft).toBe('');await s.applyVoice(id,'確認します。',metadata);await s.submit(id);await expect(s.applyVoice(id,'text',metadata)).rejects.toThrow()
  const invalid={...structuredClone((await loadInterviews())[0]!),draftVoice:metadata};expect(interviewSchema.safeParse(invalid).success).toBe(false)
 })
})
