import 'fake-indexeddb/auto'
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import * as storage from '../src/interview-storage'
import {useInterviewStore} from '../src/stores/interview'
beforeEach(async()=>{await storage.saveInterviews([]);setActivePinia(createPinia())})
afterEach(()=>vi.restoreAllMocks())
describe('queued interview autosave',()=>{
  it('never marks a newer unflushed draft saved when an older snapshot finishes',async()=>{
    const store=useInterviewStore();await store.init();let release:()=>void=()=>{}
    const spy=vi.spyOn(storage,'saveInterviews').mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve}))
    const id=store.start('job-role-v1');await vi.waitFor(()=>expect(spy).toHaveBeenCalledTimes(1));store.draft(id,'新しい未保存の回答です。');release()
    await vi.waitFor(()=>expect(store.busy).toBe(false));expect(store.saved).toBe(false)
    await store.flush();await vi.waitFor(()=>expect(store.saved).toBe(true));expect((await storage.loadInterviewData()).attempts[0]!.draft).toBe('新しい未保存の回答です。')
  })
  it('submits the latest answer while background storage is blocked, then persists in order',async()=>{
    const store=useInterviewStore();await store.init();let release:()=>void=()=>{}
    const spy=vi.spyOn(storage,'saveInterviews').mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve}))
    const id=store.start('job-role-v1');await vi.waitFor(()=>expect(spy).toHaveBeenCalledTimes(1));store.draft(id,'私は画面の実装を担当しています。');const submitted=store.submit(id)
    expect(store.attempts[0]!.status).toBe('REVIEWED');expect(store.attempts[0]!.revisions[0]!.text).toBe('私は画面の実装を担当しています。')
    release();await submitted;expect((await storage.loadInterviewData()).attempts[0]!.status).toBe('REVIEWED')
  })
})
