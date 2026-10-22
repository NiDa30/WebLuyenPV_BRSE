import {z} from 'zod'
import authored from '../../shared/business-japanese.json'
export function normalizeQuery(input:string){
 const normalized=input.normalize('NFC'),q=normalized.trim()
 if(!q||Array.from(q).length>50||/[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(normalized))throw new Error('Chỉ tra một từ/cụm từ từ 1–50 ký tự Unicode, không có xuống dòng/ký tự điều khiển.')
 return q
}
export function jishoUrl(query:string){return 'https://jisho.org/search/'+encodeURIComponent(query)}
export const dictionaryEntrySchema=z.object({id:z.string().min(1).max(120),term:z.string().min(1).max(200),reading:z.string().max(200).nullable(),senses:z.array(z.string().min(1).max(1500)).min(1).max(5),source:z.enum(['AUTHOR_CREATED','JISHO_JSON']),sourceUrl:z.string().url().nullable(),businessExample:z.string().max(500).nullable(),usageNote:z.string().max(1000).nullable(),rights:z.enum(['FIRST_PARTY','EXTERNAL_LOOKUP_NO_CACHE'])}).strict().superRefine((v,ctx)=>{
 const bad=()=>ctx.addIssue({code:'custom',message:'Nguồn/quyền tra từ không hợp lệ.'})
 if(v.source==='AUTHOR_CREATED'){
  const known=authored.find(e=>e.id===v.id)
  if(v.rights!=='FIRST_PARTY'||v.sourceUrl!==null||!known||known.term!==v.term||known.reading!==v.reading||JSON.stringify(known.senses)!==JSON.stringify(v.senses)||known.businessExample!==v.businessExample||known.usageNote!==v.usageNote)bad()
 }
 if(v.source==='JISHO_JSON'){
  if(v.rights!=='EXTERNAL_LOOKUP_NO_CACHE'||v.businessExample!==null||v.usageNote!==null||!v.sourceUrl)bad()
  else{const url=new URL(v.sourceUrl);if(url.protocol!=='https:'||url.hostname!=='jisho.org'||url.port||url.username||url.password||!url.pathname.startsWith('/search/')||url.search||url.hash)bad()}
 }
})
export type DictionaryEntry=z.infer<typeof dictionaryEntrySchema>
export const lookupSchema=z.object({query:z.string(),state:z.enum(['AUTHORED_ONLY','PROVIDER_DISABLED','RESULTS','NO_RESULTS','PROVIDER_UNAVAILABLE','SCHEMA_MISMATCH','RATE_LIMITED']),entries:z.array(dictionaryEntrySchema).max(10),capabilities:z.object({kanjiScraping:z.literal(false),sentenceScraping:z.literal(false),externalMedia:z.literal(false)}).strict()}).strict()
export type Lookup=z.infer<typeof lookupSchema>
export const corpus:DictionaryEntry[]=authored.map(e=>dictionaryEntrySchema.parse({...e,source:'AUTHOR_CREATED',sourceUrl:null,rights:'FIRST_PARTY'}))
export function localLookup(input:string,state:Lookup['state']='AUTHORED_ONLY'):Lookup{
 const query=normalizeQuery(input),q=query.toLocaleLowerCase()
 return {query,state,entries:corpus.filter(e=>[e.term,e.reading??'',...e.senses].some(t=>t.toLocaleLowerCase().includes(q))).slice(0,10),capabilities:{kanjiScraping:false,sentenceScraping:false,externalMedia:false}}
}
export const lookupMessages:Record<Lookup['state'],string>={AUTHORED_ONLY:'Nội dung Business Japanese do ứng dụng tự biên soạn, dùng được offline.',PROVIDER_DISABLED:'Jisho chưa được bật trên backend. Đang dùng nội dung tự biên soạn nếu có.',RESULTS:'Kết quả tra từ Jisho trực tiếp; không lưu/cache nội dung bên ngoài.',NO_RESULTS:'Jisho không có kết quả phù hợp. Có thể dùng nội dung tự biên soạn nếu có.',PROVIDER_UNAVAILABLE:'Chưa kết nối được provider. Đang dùng fallback tự biên soạn nếu có.',SCHEMA_MISMATCH:'Provider trả dữ liệu sai cấu trúc. Không hiển thị dữ liệu chưa kiểm tra; dùng fallback nếu có.',RATE_LIMITED:'Tra cứu đang bị giới hạn. Thử lại sau; fallback tự biên soạn vẫn hoạt động.'}
