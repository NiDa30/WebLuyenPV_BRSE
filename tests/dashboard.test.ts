import {describe,it,expect} from 'vitest'
import {learningDashboard,type DashboardInput} from '../src/domain/dashboard'
import {createAttempt,finishSection,nextSection} from '../src/domain/timer'
import {practiceConfig} from '../src/domain/profiles'
import {createInterview,submitAnswer,editTranscript,saveReview} from '../src/domain/interview'
import {corpus} from '../src/domain/dictionary'
import {bookmarkSchema,gradeBookmark,cardContentKey} from '../src/domain/vocabulary'
import type {ReviewItem} from '../src/domain/review-queue'
const now=Date.parse('2026-10-22T03:00:00Z'),text='私は画面を担当しています。'
const empty=():DashboardInput=>({exams:[],interviews:{attempts:[],sessions:[],queue:[]},bookmarks:[]})
const b=(term='担当')=>bookmarkSchema.parse({id:crypto.randomUUID(),term,source:'AUTHOR_CREATED',authoredId:corpus.find(e=>e.term===term)!.id,note:'',tags:[],createdAt:now-86_400_000,updatedAt:now-86_400_000})
function completed(){const a=createAttempt(practiceConfig('JLPT','N3'),'Own book','N3',now-10000);for(let i=0;i<3;i++){finishSection(a,now-9000+i*2000,i,true);if(i<2)nextSection(a,now-8000+i*2000)}return a}
describe('read-only learning dashboard',()=>{
 it('distinguishes unavailable sources from valid empty modules and keeps separate units',()=>{
  const known=learningDashboard(empty(),now,7,'Asia/Ho_Chi_Minh');expect(known.exam?.completed).toBe(0);expect(known.vocabulary?.due).toBe(0);expect(known.daily).toHaveLength(7);expect(known.daily.every(r=>r.exams===0&&r.transcripts===0&&r.vocabulary===0)).toBe(true)
  const missing=learningDashboard({exams:null,interviews:empty().interviews,bookmarks:null},now,7,'UTC');expect(missing.exam).toBeNull();expect(missing.vocabulary).toBeNull();expect(missing.daily[0]).toMatchObject({exams:null,transcripts:0,vocabulary:null});expect(missing.actions).toEqual([])
 })
 it('counts zero manual results, transcript revisions and retry modes without score averaging or mutation',()=>{
  const input=empty(),exam=completed();exam.results[0]!.answered=0;exam.results[0]!.correct=0;input.exams=[exam]
  let a=submitAnswer(createInterview('job-role-v1',now-9000),text,now-8000);a=submitAnswer(editTranscript(a),text,now-7000);a=saveReview(a,{criterionId:'intent',quote:text,startOffset:0,score:0,note:'Tự chấm với chứng cứ.'});const guided=submitAnswer(createInterview(a.questionId,now-6000,a,'GUIDED'),text,now-5000);input.interviews!.attempts=[a,guided]
  const before=JSON.stringify(input),out=learningDashboard(input,now,7,'UTC');expect(out.exam).toMatchObject({completed:1,partsWithInput:1});expect(out.interview).toMatchObject({reviewed:2,initial:1,guided:1,independent:0,selfRatings:1,aiAssessments:0});expect(out.daily.at(-1)).toMatchObject({exams:1,transcripts:3,vocabulary:0});expect(JSON.stringify(input)).toBe(before);expect(out).not.toHaveProperty('overallScore')
 })
 it('does not invent an exam end timestamp and routes active versus completed attempts correctly',()=>{
  const input=empty(),a=completed();a.events=a.events.filter(e=>e.kind!=='EXAM_END');input.exams=[a,createAttempt(practiceConfig('BJT','BJT'),'Current','',now-1000)]
  const out=learningDashboard(input,now,7,'UTC');expect(out.exam?.missingEndTime).toBe(1);expect(out.daily.at(-1)?.exams).toBe(0);expect(out.actions[0]?.target.kind).toBe('EXAM_TIMER');expect(out.recent.find(e=>e.label==='Own book')?.target).toEqual({kind:'EXAM_RESULT',id:a.id})
 })
 it('prioritizes a stale scenario and exposes manual queue completion as historical when source changed',()=>{
  const input=empty(),ids=['scenario-csv-hearing-v1','scenario-csv-impact-v1','scenario-csv-agreement-v1'],turns=ids.map(id=>createInterview(id,now-10000))
  for(let i=0;i<3;i++){turns[i]!.scenarioContext=turns.slice(0,i).map(a=>({attemptId:a.id,version:1}));turns[i]=submitAnswer(turns[i]!,text,now-9000+i*1000)}
  const sid=crypto.randomUUID();input.interviews!.sessions=[{id:sid,track:'BRSE',createdAt:now-10000,mode:'INITIAL',parentId:null,attemptIds:turns.map(a=>a.id),scenarioId:'csv-change-v1'}]
  turns[0]=editTranscript(turns[0]!);input.interviews!.attempts=turns
  const out=learningDashboard(input,now,7,'UTC');expect(out.interview?.staleSessions).toBe(1);expect(out.interview?.completeSessions).toBe(0);expect(out.actions[0]?.target).toEqual({kind:'INTERVIEW_SESSION',id:sid})
  const source=submitAnswer(createInterview('job-role-v1',now-9000),text,now-8000),child=submitAnswer(createInterview(source.questionId,now-7000,source,'INDEPENDENT'),text,now-6000)
  const item:ReviewItem={id:crypto.randomUUID(),attemptId:source.id,version:1,criterionId:'intent',createdAt:now-7500,snapshot:{source:'SELF_REVIEW',score:1,quote:text,startOffset:0,endOffset:text.length,reason:'Tự đánh giá.'},nextStep:'Rà soát.',priority:'NORMAL',status:'DONE',doneAt:now-5000,retries:[{attemptId:child.id,sessionId:null}]}
  input.interviews!.attempts=[editTranscript(source),child];input.interviews!.sessions=[];input.interviews!.queue=[item];const historical=learningDashboard(input,now,7,'UTC');expect(historical.interview).toMatchObject({queueDone:1,queueDoneCurrent:0,queueStale:1})
 })
 it('matches vocabulary due eligibility and preserves separate historical rating counts',()=>{
  const input=empty(),fresh=b(),external=bookmarkSchema.parse({...b(),id:crypto.randomUUID(),source:'JISHO_REFERENCE',authoredId:null}),original=b('確認'),rated=gradeBookmark(original,'GOOD',{contentVersion:1,count:0,contentKey:cardContentKey(original)},now-1000),stale={...rated,id:crypto.randomUUID(),term:'進捗',authoredId:corpus.find(e=>e.term==='進捗')!.id,contentVersion:2,note:'changed',updatedAt:now}
  input.bookmarks=[fresh,external,rated,stale];const out=learningDashboard(input,now,7,'UTC');expect(out.vocabulary).toMatchObject({total:4,due:1,waiting:1,missingNote:1,stale:1,ratings:2});expect(out.actions.some(a=>a.target.kind==='VOCABULARY_REVIEW')).toBe(true);expect(out.daily.at(-1)?.vocabulary).toBe(2)
 })
 it('uses local calendar boundaries including DST, excludes future/bad times and caps recent activity',()=>{
  const input=empty(),a=submitAnswer(createInterview('job-role-v1',now-10000),text,now-1000);input.interviews!.attempts=[a]
  input.exams=[createAttempt(practiceConfig('JLPT','N3'),'future','',now+86400000),createAttempt(practiceConfig('JLPT','N3'),'bad','',1e30)]
  const out=learningDashboard(input,now,30,'Asia/Ho_Chi_Minh');expect(out.daily).toHaveLength(30);expect(out.omittedTimes).toBe(2);expect(out.recent).toHaveLength(1)
  const boundary=empty();boundary.interviews!.attempts=[submitAnswer(createInterview('job-role-v1',Date.parse('2026-10-21T17:00:00Z')),text,Date.parse('2026-10-21T17:00:00Z'))];expect(learningDashboard(boundary,now,7,'Asia/Ho_Chi_Minh').daily.at(-1)?.transcripts).toBe(1)
  const dst=learningDashboard(empty(),Date.parse('2026-11-03T12:00:00Z'),7,'America/New_York');expect(dst.daily.map(r=>r.day)).toEqual(['2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01','2026-11-02','2026-11-03']);expect(learningDashboard(empty(),now,7,'invalid-zone').timezone).toBe('UTC')
  input.interviews!.attempts=Array.from({length:25},(_,i)=>submitAnswer(createInterview('job-role-v1',now-50000-i*100),text,now-10000-i*100));expect(learningDashboard(input,now,7,'UTC').recent).toHaveLength(20)
 })
})
