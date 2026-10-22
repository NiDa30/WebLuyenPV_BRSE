import 'fake-indexeddb/auto'
import { beforeEach,describe,it,expect } from 'vitest'
import { loadInterviews,saveInterviews } from '../src/interview-storage'
import { loadAttempts,saveAttempts } from '../src/storage'
import { createInterview,submitAnswer,createInterview as retry } from '../src/domain/interview'
import { createAttempt } from '../src/domain/timer'
import { practiceConfig } from '../src/domain/profiles'
beforeEach(async()=>{await saveInterviews([]);await saveAttempts([])})
describe('separate persisted interview data',()=>{
  it('preserves draft and complete retry tree across database close/reopen',async()=>{
    const a=submitAnswer(createInterview('brse-scope-v1',1000),'要件を確認してから回答します。',2000),b=retry(a.questionId,3000,a,'INDEPENDENT')
    b.draft='確認したいことがあります。'
    await saveInterviews([a,b]);expect(await loadInterviews()).toEqual([b,a])
  })
  it('interview import/delete does not alter existing exam data',async()=>{
    const exam=createAttempt(practiceConfig('JLPT','N3'),'Private local book','N3',1000)
    await saveAttempts([exam]);await saveInterviews([createInterview('job-role-v1',1000)])
    await saveInterviews([]);expect(await loadAttempts()).toEqual([exam]);expect(await loadInterviews()).toEqual([])
  })
  it('invalid replacement does not clear previously saved interviews',async()=>{
    const a=createInterview('job-role-v1',1000);await saveInterviews([a])
    await expect(saveInterviews([{...a,rubricVersion:'forged'}])).rejects.toThrow()
    expect(await loadInterviews()).toEqual([a])
  })
})
