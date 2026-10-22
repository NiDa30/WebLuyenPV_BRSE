import { describe, it, expect } from 'vitest'
import { analyze, comparable } from '../src/domain/strategy'
import { practiceConfig } from '../src/domain/profiles'
import { createAttempt } from '../src/domain/timer'
const make = () => { const a=createAttempt(practiceConfig('JLPT','N3'),'Đề 1','N3 basic',1000); a.status='COMPLETED';a.startedWall=null;return a }
describe('evidence and score separation', () => {
  it('reports exactly 3 unfinished items; does not invent knowledge or official scoring', () => {
    const a=make(); a.results[1]={...a.results[1]!,total:40,answered:37,correct:null};a.elapsed[1]=3600000
    const report=analyze(a)
    expect(report.find(f=>f.code==='UNFINISHED_QUESTIONS')?.evidence).toContain('3 câu')
    expect(report.find(f=>f.section===a.config.sections[1]!.name && f.code==='INSUFFICIENT_EVIDENCE')).toBeTruthy()
    expect(report.some(f=>f.code==='NO_SPLITS')).toBe(true)
    expect(JSON.stringify(report)).not.toMatch(/passed|đã đỗ|đã trượt|0–800/)
  })
  it('null totals stay unknown and null accuracy never becomes zero', () => {
    const r=analyze(make()); expect(r.filter(f=>f.code==='UNFINISHED_QUESTIONS')).toHaveLength(0)
    expect(r.filter(f=>f.code==='INSUFFICIENT_EVIDENCE')).toHaveLength(3)
  })
  it.each([['SLOW_AND_INACCURATE',5,20,1],['ACCURATE_BUT_SLOW',19,20,1],['FAST_BUT_INACCURATE',5,20,.5],['EFFICIENT',19,20,.5]])('detects pilot pattern %s from evidence', (code,c,n,t) => {
    const a=make(); a.results[0]={...a.results[0]!,total:Number(n),answered:Number(n),correct:Number(c)}
    a.elapsed[0]=a.config.sections[0]!.budgetMs*Number(t)
    expect(analyze(a).find(f=>f.code===code)?.certainty).toBe('LIKELY')
  })
  it('accurate but slow never recommends drastic speedup or speeding fixed audio', () => {
    const a=make();a.results[2]={...a.results[2]!,total:20,answered:20,correct:20};a.elapsed[2]=1800000
    expect(analyze(a).find(f=>f.code==='ACCURATE_BUT_SLOW')?.recommendation).toContain('không rút ngắn')
  })
  it('BJT raw counts and entered official scores never trigger conversion or pass/fail', () => {
    const a=make();a.config=practiceConfig('BJT','BJT'); a.results[0]={...a.results[0]!,answered:20,total:20,correct:18}
    a.elapsed[0]=1800000
    const b=structuredClone(a);b.results[0]!.scoreKind='OFFICIAL_SCALED';b.results[0]!.score=700;b.results[0]!.max=800
    expect(analyze(a)).toEqual(analyze(b))
  })
  it('comparison requires same config, mode, score kind, conditions, declared difficulty and different material', () => {
    const a=make(), b=make(); b.material='Đề 2';expect(comparable(a,b).ok).toBe(true)
    b.config.version='different';expect(comparable(a,b).ok).toBe(false)
    b.config=a.config;b.results[0]!.scoreKind='MOCK_ESTIMATED'; expect(comparable(a,b).ok).toBe(false)
    b.results=a.results;b.difficulty='';expect(comparable(a,b).ok).toBe(false)
    b.difficulty=a.difficulty;b.flags.push('PRACTICE_PAUSED');expect(comparable(a,b).ok).toBe(false)
  })
})
