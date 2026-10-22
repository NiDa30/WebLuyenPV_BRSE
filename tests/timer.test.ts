import { describe, it, expect, vi } from 'vitest'
import { practiceConfig } from '../src/domain/profiles'
import { checkpoint, createAttempt, elapsed, finishSection, nextSection, pause, recover, resume, RuntimeClock } from '../src/domain/timer'
const make = () => createAttempt(practiceConfig('JLPT','N3'), 'Đề 1', 'N3 basic', 1000)
describe('timestamp timer state machine', () => {
  it('expires exactly at 30 minutes even after 31 minutes without ticks; no negatives', () => {
    const a=make(); expect(elapsed(a,1000+30*60000-1)).toBe(30*60000-1)
    finishSection(a,1000+31*60000,0)
    expect(a.status).toBe('BETWEEN'); expect(elapsed(a,1000+31*60000)).toBe(30*60000)
    expect(a.elapsed[0]).toBe(30*60000)
    finishSection(a,1000+32*60000,0); expect(a.events.filter(e=>e.kind==='SECTION_END')).toHaveLength(1)
  })
  it('background and reload account for wall time once', () => {
    const a=make(); expect(elapsed(a,121000)).toBe(120000)
    checkpoint(a,121000,'Bắt đầu đọc',60000)
    const restored=JSON.parse(JSON.stringify(a)); recover(restored,181000)
    expect(elapsed(restored,241000)).toBe(240000)
    recover(restored,241000); expect(elapsed(restored,241000)).toBe(240000)
    expect(restored.events.filter((e: {kind:string})=>e.kind==='CHECKPOINT')).toHaveLength(1)
  })
  it('rejects duplicate splits on double click, logs correct section and planned time', () => {
    const a=make(); checkpoint(a,2000,'Đọc',0); checkpoint(a,2100,'Đọc',0)
    expect(a.events.filter(e=>e.kind==='CHECKPOINT')).toHaveLength(1)
    expect(a.events[1]).toMatchObject({sectionId:'vocabulary',elapsedMs:1000,plannedMs:0})
  })
  it('pause accrues only working time and marks not exam equivalent', () => {
    const a=make(); pause(a,61000); expect(a.status).toBe('PAUSED')
    expect(elapsed(a,121000)).toBe(60000); resume(a,121000)
    expect(elapsed(a,181000)).toBe(120000); expect(a.flags).toContain('PRACTICE_PAUSED')
  })
  it('cannot pause at expiration and cannot borrow remaining time', () => {
    const a=make(); pause(a,1801000); expect(a.status).toBe('BETWEEN')
    nextSection(a,1901000); expect(a.index).toBe(1); expect(elapsed(a,1901000)).toBe(0)
    expect(a.config.sections[1]!.budgetMs).toBe(3600000)
  })
  it('early end is idempotent; next section starts explicitly, listening never borrows minutes', () => {
    const a=make(); finishSection(a,2000,0,true); finishSection(a,2000,0,true)
    expect(a.events.filter(e=>e.kind==='SECTION_END')).toHaveLength(1)
    nextSection(a,3000); nextSection(a,3000); expect(a.index).toBe(1)
    finishSection(a,4000,0,true); expect(a.status).toBe('RUNNING')
    finishSection(a,5000,1,true); nextSection(a,6000)
    expect(a.config.sections[2]!.fixedAudio).toBe(true); expect(elapsed(a,6000)).toBe(0)
    finishSection(a,7000,2,true); expect(a.status).toBe('COMPLETED')
    expect(a.events.filter(e=>e.kind==='EXAM_END')).toHaveLength(1)
  })
  it('backwards wall-clock recovery flags uncertainty and never grants negative elapsed', () => {
    const a=make(); recover(a,0); expect(a.flags).toContain('CLOCK_SKEW'); expect(elapsed(a,0)).toBe(0)
  })
  it('runtime uses monotonic progression despite wall clock changes', () => {
    const date=vi.spyOn(Date,'now').mockReturnValue(1000)
    const mono=vi.spyOn(performance,'now').mockReturnValue(100)
    const clock=new RuntimeClock(); mono.mockReturnValue(120100); date.mockReturnValue(-60000)
    expect(clock.now()).toBe(121000); expect(clock.skewed()).toBe(true)
    vi.restoreAllMocks()
  })
})
