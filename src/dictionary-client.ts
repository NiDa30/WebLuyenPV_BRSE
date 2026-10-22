import {lookupSchema,localLookup,normalizeQuery,type Lookup} from './domain/dictionary'
export async function searchDictionary(input:string,signal:AbortSignal):Promise<Lookup>{
 const q=normalizeQuery(input)
 try{
  const response=await fetch('/api/v1/dictionary/words?q='+encodeURIComponent(q),{signal,cache:'no-store'})
  if(!response.ok)return localLookup(q,response.status===429?'RATE_LIMITED':'PROVIDER_UNAVAILABLE')
  const text=await response.text();if(text.length>150000)return localLookup(q,'SCHEMA_MISMATCH')
  const parsed=lookupSchema.safeParse(JSON.parse(text))
  if(!parsed.success||parsed.data.query!==q)return localLookup(q,'SCHEMA_MISMATCH')
  return parsed.data
 }catch(error){if(signal.aborted)throw error;return localLookup(q,error instanceof SyntaxError?'SCHEMA_MISMATCH':'PROVIDER_UNAVAILABLE')}
}
