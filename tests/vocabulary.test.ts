import 'fake-indexeddb/auto'
import {beforeEach,describe,it,expect} from 'vitest'
import {createPinia,setActivePinia} from 'pinia'
import {useVocabularyStore} from '../src/stores/vocabulary'
import {loadVocabulary,saveVocabulary} from '../src/vocabulary-storage'
import {parseVocabularyBackup,flashcardBack} from '../src/domain/vocabulary'
import {saveAttempts,loadAttempts} from '../src/storage'
import {saveInterviews,loadInterviews} from '../src/interview-storage'
import {createInterview,submitAnswer} from '../src/domain/interview'
import {createAttempt} from '../src/domain/timer'
import {practiceConfig} from '../src/domain/profiles'
beforeEach(async()=>{await saveVocabulary([]);setActivePinia(createPinia())})
describe('private local notebook and cards',()=>{
 it('saves own query only, deduplicates per source, edits notes/tags, reopens and round-trips',async()=>{
  const s=useVocabularyStore();await s.init();const id=await s.add('担当','AUTHOR_CREATED','authored-tantou-v1');expect(await s.add('担当','AUTHOR_CREATED','authored-tantou-v1')).toBe(id);await s.update(id,'Tôi muốn giải thích đúng phần mình phụ trách.',['IT','BrSE','IT'])
  expect(s.bookmarks).toHaveLength(1);expect(s.bookmarks[0]!.tags).toEqual(['IT','BrSE'])
  const backup=s.exportText(),data=parseVocabularyBackup(backup);await s.clear();await s.importText(backup);expect((await loadVocabulary())[0]).toEqual(data.bookmarks[0]);expect(backup).not.toMatch(/senses|audioUrl|capabilityToken|transcript|data:audio/)
 })
 it('external references have no provider definitions on flashcard; only learner-written note',async()=>{
  const s=useVocabularyStore();await s.init();await s.add('担当','JISHO_REFERENCE',null);const id=s.bookmarks[0]!.id;expect(flashcardBack(s.bookmarks[0]!)).toEqual({reading:null,meaning:null,example:null,note:null});await s.update(id,'My own explanation',['IT']);expect(flashcardBack(s.bookmarks[0]!).note).toBe('My own explanation')
  await s.add('担当','AUTHOR_CREATED','authored-tantou-v1');expect(flashcardBack(s.bookmarks[0]!).meaning).toContain('Phụ trách')
 })
 it('rejects raw external content, corrupt/version/oversize/duplicate backup and preserves data',async()=>{
  const s=useVocabularyStore();await s.init();await s.add('担当','JISHO_REFERENCE',null);const b=structuredClone((await loadVocabulary())[0]!),wrap=(bookmarks:unknown[])=>JSON.stringify({format:'BRSE_VOCABULARY_BACKUP',schemaVersion:1,bookmarks})
  for(const text of ['invalid','x'.repeat(5_000_001),JSON.stringify({format:'BRSE_VOCABULARY_BACKUP',schemaVersion:2,bookmarks:[]}),wrap([b,b]),wrap([{...b,definitions:['forbidden cache']}]),wrap([{...b,authoredId:'forged'}]),wrap([{...b,audioUrl:'https://outside.invalid/a.mp3'}])]){await expect(s.importText(text)).rejects.toThrow();expect((await loadVocabulary())[0]).toEqual(b)}
 })
 it('vocabulary writes/import/delete never modify Exam/Interview feedback scores',async()=>{
  const interview=submitAnswer(createInterview('job-role-v1',1000),'私は画面を担当しました。',2000),exam=createAttempt(practiceConfig('JLPT','N3'),'Book 1','N3',1000);await saveInterviews([interview]);await saveAttempts([exam]);const s=useVocabularyStore();await s.init();const id=await s.add('担当','AUTHOR_CREATED','authored-tantou-v1');await s.update(id,'My note',['BrSE']);await s.importText(s.exportText());await s.remove(id);await s.clear();expect(await loadInterviews()).toEqual([interview]);expect(await loadAttempts()).toEqual([exam])
 })
 it('invalid notes/tags/source/phrase fail before persistence and deletion is durable',async()=>{
  const s=useVocabularyStore();await s.init();await expect(s.add('日'.repeat(51),'JISHO_REFERENCE',null)).rejects.toThrow();await expect(s.add('担当','AUTHOR_CREATED','missing')).rejects.toThrow();expect(await loadVocabulary()).toEqual([])
  const id=await s.add('担当','JISHO_REFERENCE',null);await expect(s.update(id,'x'.repeat(2001),[])).rejects.toThrow();await expect(s.update(id,'note',['x'.repeat(33)])).rejects.toThrow();expect((await loadVocabulary())[0]!.note).toBe('');await s.remove(id);expect(await loadVocabulary()).toEqual([])
 })
})
