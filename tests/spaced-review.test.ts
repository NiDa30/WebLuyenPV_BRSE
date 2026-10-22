import 'fake-indexeddb/auto'
import {beforeEach,describe,it,expect} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import {bookmarkSchema,gradeBookmark,reviewState,cardContentKey,parseVocabularyBackup} from '../src/domain/vocabulary'
import {dayMs,replayReviews,scheduleSchema,maxReviewTime,type Grade} from '../src/domain/spaced-review'
import {useVocabularyStore} from '../src/stores/vocabulary'
import {saveVocabulary,loadVocabulary} from '../src/vocabulary-storage'
import {saveAttempts,loadAttempts} from '../src/storage'
import {saveInterviews,loadInterviews} from '../src/interview-storage'
import {createInterview} from '../src/domain/interview'
import {createAttempt} from '../src/domain/timer'
import {practiceConfig} from '../src/domain/profiles'
const make=()=>bookmarkSchema.parse({id:crypto.randomUUID(),term:'担当',source:'AUTHOR_CREATED',authoredId:'authored-tantou-v1',note:'',tags:[],createdAt:1000,updatedAt:1000})
const expected=(b:ReturnType<typeof make>)=>({contentVersion:b.contentVersion,count:b.schedule?.events.length??0,contentKey:cardContentKey(b)})
beforeEach(async()=>{await saveVocabulary([]);setActivePinia(createPinia())})
describe('local fixed-interval spaced review policy',()=>{
 it('schedules four self-reported grades exactly without changing source content',()=>{
  for(const [grade,delay] of [['AGAIN',60_000],['HARD',dayMs],['GOOD',3*dayMs],['EASY',7*dayMs]] as const){const b=make(),rated=gradeBookmark(b,grade,expected(b),2000);expect(reviewState(rated,2000).dueAt).toBe(2000+delay);expect(rated.note).toBe(b.note);expect(rated.term).toBe(b.term);expect(b.schedule).toBeUndefined()}
 })
 it('grows intervals, caps at180 days and resets interval after again',()=>{
  let b=make();for(let i=0;i<10;i++){const at=reviewState(b,0).dueAt;b=gradeBookmark(b,'EASY',expected(b),at)}expect(reviewState(b,0).days).toBe(180)
  b=gradeBookmark(b,'AGAIN',expected(b),reviewState(b,0).dueAt);expect(reviewState(b,0).days).toBe(0);b=gradeBookmark(b,'GOOD',expected(b),reviewState(b,0).dueAt);expect(reviewState(b,0).days).toBe(3)
 })
 it('rejects early/duplicate ratings and accepts exact due boundary',()=>{
  const b=make(),first=gradeBookmark(b,'GOOD',expected(b),1000),due=reviewState(first,0).dueAt
  expect(()=>gradeBookmark(first,'GOOD',expected(first),due-1)).toThrow('chưa đến hạn');expect(()=>gradeBookmark(first,'GOOD',expected(b),due)).toThrow('đã thay đổi');expect(gradeBookmark(first,'HARD',expected(first),due).schedule!.events).toHaveLength(2)
 })
 it('bounds history/time and rejects forged policy, private fields and early event sequences',()=>{
  let b=make();for(let i=0;i<100;i++)b=gradeBookmark(b,'AGAIN',expected(b),reviewState(b,0).dueAt);expect(reviewState(b,0).full).toBe(true);expect(()=>gradeBookmark(b,'GOOD',expected(b),reviewState(b,0).dueAt)).toThrow('100 lượt')
  for(const value of [{policy:'invented',contentVersion:1,events:[{grade:'GOOD',at:1000}]},{policy:'FIXED_INTERVAL_V1',contentVersion:1,events:[{grade:'GOOD',at:1000},{grade:'EASY',at:1001}]},{policy:'FIXED_INTERVAL_V1',contentVersion:1,events:[{grade:'EASY',at:maxReviewTime}]},{policy:'FIXED_INTERVAL_V1',contentVersion:1,events:[{grade:'GOOD',at:1000,audioUrl:'private'}]}])expect(scheduleSchema.safeParse(value).success).toBe(false)
 })
 it('requires personal note for external references and rejects a changed reveal snapshot',()=>{
  const external=bookmarkSchema.parse({...make(),source:'JISHO_REFERENCE',authoredId:null});expect(reviewState(external,1000).eligible).toBe(false);expect(()=>gradeBookmark(external,'GOOD',expected(external),1000)).toThrow('ghi chú')
  const old=make(),changed={...old,note:'Different content with unchanged imported version'};expect(()=>gradeBookmark(changed,'GOOD',expected(old),1000)).toThrow('đã thay đổi')
 })
})
describe('scheduled vocabulary persistence and isolation',()=>{
 it('round-trips history/due time and restores legacy bookmarks as new cards',async()=>{
  const s=useVocabularyStore();await s.init();const id=await s.add('担当','AUTHOR_CREATED','authored-tantou-v1'),b=s.bookmarks[0]!;await s.review(id,'GOOD',expected(b),b.createdAt+1000)
  const backup=s.exportText(),parsed=parseVocabularyBackup(backup);await s.clear();await s.importText(backup);expect((await loadVocabulary())[0]!.schedule).toEqual(parsed.bookmarks[0]!.schedule)
  const legacy=JSON.parse(backup);delete legacy.bookmarks[0].contentVersion;delete legacy.bookmarks[0].schedule;await s.importText(JSON.stringify(legacy));expect(s.bookmarks[0]!.contentVersion).toBe(1);expect(reviewState(s.bookmarks[0]!,Date.now()).due).toBe(true)
 })
 it('tags preserve schedule while note changes invalidate it until explicit reset',async()=>{
  const s=useVocabularyStore();await s.init();const id=await s.add('担当','AUTHOR_CREATED','authored-tantou-v1');await s.review(id,'AGAIN',expected(s.bookmarks[0]!),s.bookmarks[0]!.createdAt)
  await s.update(id,'',['IT']);expect(reviewState(s.bookmarks[0]!,Date.now()).stale).toBe(false);await s.update(id,'My revised note',['IT']);expect(reviewState(s.bookmarks[0]!,Date.now()).stale).toBe(true)
  await expect(s.review(id,'GOOD',expected(s.bookmarks[0]!),s.bookmarks[0]!.createdAt+60_000)).rejects.toThrow('mặt sau')
  await s.resetSchedule(id);expect(s.bookmarks[0]!.note).toBe('My revised note');expect(s.bookmarks[0]!.tags).toEqual(['IT']);expect(s.bookmarks[0]!.schedule).toBeUndefined();expect(reviewState(s.bookmarks[0]!,Date.now()).due).toBe(true)
 })
 it('rejects malformed schedules before import replacement or grade mutation',async()=>{
  const s=useVocabularyStore();await s.init();const id=await s.add('担当','AUTHOR_CREATED','authored-tantou-v1');await s.review(id,'GOOD',expected(s.bookmarks[0]!),s.bookmarks[0]!.createdAt)
  const original=s.exportText();for(const change of [(b:any)=>{b.bookmarks[0].schedule.contentVersion=99},(b:any)=>{b.bookmarks[0].schedule.events[0].at=b.bookmarks[0].createdAt-1},(b:any)=>{b.bookmarks[0].schedule.events[0].at=b.bookmarks[0].updatedAt+1},(b:any)=>{b.bookmarks[0].schedule.predictedMastery=100}]){const bad=JSON.parse(original);change(bad);await expect(s.importText(JSON.stringify(bad))).rejects.toThrow();expect(s.exportText()).toBe(original)}
  await expect(s.review(id,'EASY',expected(s.bookmarks[0]!),s.bookmarks[0]!.createdAt)).rejects.toThrow('chưa đến hạn');expect(s.exportText()).toBe(original)
 })
 it('does not change Exam or Interview data and keeps external content out of backup',async()=>{
  const exam=createAttempt(practiceConfig('JLPT','N3'),'Book','N3',1000),interview=createInterview('job-role-v1',1000);await saveAttempts([exam]);await saveInterviews([interview]);const s=useVocabularyStore();await s.init();const id=await s.add('担当','JISHO_REFERENCE',null);await s.update(id,'My own explanation',[]);await s.review(id,'EASY',expected(s.bookmarks[0]!),Date.now());const backup=s.exportText();expect(backup).not.toMatch(/senses|audioUrl|transcript|capabilityToken|predictedMastery/);await s.importText(backup);await s.remove(id);expect(await loadAttempts()).toEqual([exam]);expect(await loadInterviews()).toEqual([interview])
 })
})
