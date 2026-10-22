import 'fake-indexeddb/auto'
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import * as interviews from '../src/interview-storage'
import * as examData from '../src/storage'
import {useInterviewStore} from '../src/stores/interview'
import {useExamStore} from '../src/stores/exam'
import {createInterview} from '../src/domain/interview'
import {practiceConfig} from '../src/domain/profiles'
beforeEach(()=>setActivePinia(createPinia()))
afterEach(()=>vi.restoreAllMocks())
describe('dashboard source-loading guards',()=>{
 it('deduplicates interview initialization across dashboard/navigation and retains new draft',async()=>{
  const a=createInterview('job-role-v1',1000);let resolve!:(data:Awaited<ReturnType<typeof interviews.loadInterviewData>>)=>void
  const spy=vi.spyOn(interviews,'loadInterviewData').mockImplementation(()=>new Promise(r=>{resolve=r}));const store=useInterviewStore(),first=store.init(),second=store.init();expect(spy).toHaveBeenCalledTimes(1)
  resolve({format:'BRSE_INTERVIEW_BACKUP',schemaVersion:1,attempts:[a],sessions:[],reviewQueue:[]});await Promise.all([first,second]);const id=store.start('job-role-v1');store.draft(id,'新しい回答');await store.flush();await store.init();expect(spy).toHaveBeenCalledTimes(1);expect(store.attempts.find(a=>a.id===id)?.draft).toBe('新しい回答')
 })
 it('marks unavailable Exam and prevents overwrite/create after read failure',async()=>{
  vi.spyOn(examData,'loadAttempts').mockRejectedValue(new Error('unavailable'));const write=vi.spyOn(examData,'saveAttempts');const store=useExamStore();await store.init();expect(store.ready).toBe(true);expect(store.loadFailed).toBe(true);await store.persist();expect(write).not.toHaveBeenCalled();expect(()=>store.create(practiceConfig('JLPT','N3'),'Book','')).toThrow('Chưa đọc');expect(store.attempts).toEqual([])
 })
 it('explicit Exam backup recovery clears failure and restores known empty state',async()=>{
  vi.spyOn(examData,'loadAttempts').mockRejectedValue(new Error('unavailable'));const store=useExamStore();await store.init();await store.importText(JSON.stringify({format:'BRSE_EXAM_BACKUP',schemaVersion:1,attempts:[]}));expect(store.loadFailed).toBe(false);expect(store.error).toBe('');expect(store.saved).toBe(true)
 })
})
