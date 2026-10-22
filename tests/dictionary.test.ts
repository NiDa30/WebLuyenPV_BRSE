import {afterEach,describe,it,expect,vi} from 'vitest'
import {normalizeQuery,localLookup,lookupSchema,corpus,jishoUrl} from '../src/domain/dictionary'
import {searchDictionary} from '../src/dictionary-client'
afterEach(()=>vi.unstubAllGlobals())
describe('short-phrase dictionary privacy and authored fallback',()=>{
 it('normalizes NFC, counts Unicode code points, rejects control/newline/surrogate/overlong data',()=>{
  expect(normalizeQuery('  か\u3099  ')).toBe('が');expect(Array.from(normalizeQuery('😀'.repeat(50)))).toHaveLength(50)
  for(const q of ['','日'.repeat(51),'日\n本','担当\n','\u200b担当','\ud800'])expect(()=>normalizeQuery(q)).toThrow()
 })
 it('authored corpus contains no external media and provides precise source/example labels',()=>{
  expect(corpus).toHaveLength(9);expect(new Set(corpus.map(e=>e.id)).size).toBe(9)
  expect(localLookup('担当').entries[0]).toMatchObject({term:'担当',reading:'たんとう',source:'AUTHOR_CREATED',rights:'FIRST_PARTY',sourceUrl:null})
  expect(localLookup('たんとう').entries[0]?.term).toBe('担当');expect(localLookup('no-fixture').entries).toHaveLength(0)
  for(const e of corpus){expect(e.businessExample).toBeTruthy();expect(e.usageNote).toBeTruthy()}
  expect(lookupSchema.safeParse({...localLookup('担当'),entries:[{...corpus[0],senses:['fabricated authored source']}]}).success).toBe(false)
 })
 it('foreign examples/links/media fields or false rights claims fail strict schema',()=>{
  const result={query:'担当',state:'RESULTS',entries:[{id:'jisho-0',term:'担当',reading:'たんとう',senses:['fixture only'],source:'JISHO_JSON',sourceUrl:jishoUrl('担当'),businessExample:null,usageNote:null,rights:'EXTERNAL_LOOKUP_NO_CACHE'}],capabilities:{kanjiScraping:false,sentenceScraping:false,externalMedia:false}}
  expect(lookupSchema.safeParse(result).success).toBe(true)
  for(const fields of [{sourceUrl:'javascript:alert(1)'},{sourceUrl:'https://attacker.example/search/a'},{sourceUrl:'https://jisho.org/search/a?token=private'},{businessExample:'fake provider sentence'},{audio:'https://x.invalid/a.mp3'},{rights:'FIRST_PARTY'}])expect(lookupSchema.safeParse({...result,entries:[{...result.entries[0],...fields}]}).success).toBe(false)
 })
})
describe('dictionary client cancellation and provider states',()=>{
 it('sends only encoded normalized query, never private context, and validates query consistency',async()=>{
  const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify(localLookup('担当','PROVIDER_DISABLED')),{status:200}));vi.stubGlobal('fetch',fetchMock)
  expect((await searchDictionary(' 担当 ',new AbortController().signal)).state).toBe('PROVIDER_DISABLED')
  expect(fetchMock.mock.calls[0]![0]).toBe('/api/v1/dictionary/words?q=%E6%8B%85%E5%BD%93');expect(fetchMock.mock.calls[0]![1].body).toBeUndefined()
  fetchMock.mockResolvedValue(new Response(JSON.stringify(localLookup('要件','RESULTS'))));expect((await searchDictionary('担当',new AbortController().signal)).state).toBe('SCHEMA_MISMATCH')
 })
 it('provider unavailable/rate-limit/malformed/oversized responses preserve authored fallback',async()=>{
  for(const [response,state] of [[new Response('unavailable',{status:503}),'PROVIDER_UNAVAILABLE'],[new Response('{}',{status:429}),'RATE_LIMITED'],[new Response('not-json'),'SCHEMA_MISMATCH'],[new Response('x'.repeat(150001)),'SCHEMA_MISMATCH']] as const){vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response));const result=await searchDictionary('担当',new AbortController().signal);expect(result.state).toBe(state);expect(result.entries[0]!.source).toBe('AUTHOR_CREATED')}
 })
 it('aborted requests do not turn into stale successful search results',async()=>{
  const signal=new AbortController();signal.abort();vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('Aborted','AbortError')));await expect(searchDictionary('担当',signal.signal)).rejects.toThrow('Aborted')
 })
})
