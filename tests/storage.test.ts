import 'fake-indexeddb/auto'
import { beforeEach, describe, it, expect } from 'vitest'
import { emptyResult, parseBackup, resultSchema } from '../src/domain/model'
import { createAttempt } from '../src/domain/timer'
import { practiceConfig } from '../src/domain/profiles'
import { saveAttempts, loadAttempts } from '../src/storage'
const backup=(attempts: unknown[])=>JSON.stringify({format:'BRSE_EXAM_BACKUP',schemaVersion:1,attempts})
beforeEach(async()=>{await saveAttempts([])})
describe('results and data portability',()=>{
  it.each([{total:10,answered:11},{total:10,answered:8,correct:9},{correct:-1},{scoreKind:'MOCK_ESTIMATED',score:11,max:10},{scoreKind:'MOCK_ESTIMATED',score:1},{scoreKind:'PERCENT_ACCURACY',max:60},{score:5,max:10}])('rejects invalid result %j', fields=>{
    expect(resultSchema.safeParse({...emptyResult(),...fields}).success).toBe(false)
  })
  it('preserves missing values and accepts explicitly declared score sources',()=>{
    expect(resultSchema.parse(emptyResult()).correct).toBeNull()
    expect(resultSchema.parse({...emptyResult(),scoreKind:'OFFICIAL_SCALED',score:45,max:60,provenance:'OFFICIAL_SCORE_SHEET'}).score).toBe(45)
  })
  it('IndexedDB and backup round-trip exact configs, nulls, attempts, events; survives database reopen',async()=>{
    const a=createAttempt(practiceConfig('JLPT','N3'),'Đề 1','N3',1000)
    await saveAttempts([a]);expect(await loadAttempts()).toEqual([a])
    const restored=parseBackup(backup(await loadAttempts())); await saveAttempts([]); await saveAttempts(restored.attempts)
    expect(await loadAttempts()).toEqual([a])
  })
  it('rejects corrupt/version/oversized/duplicate/multiple active import without overwriting existing data',async()=>{
    const a=createAttempt(practiceConfig('JLPT','N3'),'Đề 1','N3',1000);await saveAttempts([a])
    for(const s of ['oops','{"schemaVersion":2}', 'x'.repeat(5_000_001),backup([a,a]),backup([a,{...a,id:crypto.randomUUID()}]),backup([{...a,index:999}]),backup([{...a,privateCv:'must not be included'}])])expect(()=>parseBackup(s)).toThrow()
    expect(await loadAttempts()).toEqual([a])
  })
  it('delete all is persistent',async()=>{await saveAttempts([]);expect(await loadAttempts()).toEqual([])})
})
