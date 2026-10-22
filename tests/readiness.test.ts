import 'fake-indexeddb/auto'
import {describe,it,expect} from 'vitest'
import {emptyReadiness,parseReadiness} from '../src/domain/readiness'
import {loadReadiness,saveReadiness} from '../src/readiness-storage'
describe('readiness backup and persistence',()=>{
 it('starts unknown, without fabricated confirmations',()=>{expect(emptyReadiness().checked).toEqual([]);expect(emptyReadiness().updatedAt).toBeNull()})
 it('rejects unknown items, duplicates, extra fields and oversized notes',()=>{for(const patch of [{checked:['fake']},{checked:['audio','audio']},{score:100},{note:'x'.repeat(2001)},{updatedAt:-1}])expect(()=>parseReadiness(JSON.stringify({...emptyReadiness(),...patch}))).toThrow()})
 it('rejects invalid version and oversized files',()=>{expect(()=>parseReadiness(JSON.stringify({...emptyReadiness(),schemaVersion:2}))).toThrow();expect(()=>parseReadiness(' '.repeat(20001))).toThrow()})
 it('round trips checklist independently and invalid writes preserve saved data',async()=>{const value={...emptyReadiness(),checked:['audio' as const],note:'Thử lại tai nghe',updatedAt:123};await saveReadiness(value);expect(await loadReadiness()).toEqual(value);await expect(saveReadiness({...value,note:'x'.repeat(2001)})).rejects.toThrow();expect(await loadReadiness()).toEqual(value);await saveReadiness(emptyReadiness());expect(await loadReadiness()).toEqual(emptyReadiness())})
})
