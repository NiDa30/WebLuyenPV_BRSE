import {z} from 'zod'
import {scheduleSchema,replayReviews,type Grade} from './spaced-review'
import {corpus,normalizeQuery} from './dictionary'
export const bookmarkSchema=z.object({id:z.string().uuid(),term:z.string().min(1).max(100),source:z.enum(['AUTHOR_CREATED','JISHO_REFERENCE']),authoredId:z.string().max(120).nullable(),note:z.string().max(2000),tags:z.array(z.string().trim().min(1).max(32)).max(10),createdAt:z.number().finite().min(0),updatedAt:z.number().finite().min(0),contentVersion:z.number().int().positive().default(1),schedule:scheduleSchema.optional()}).strict().superRefine((b,ctx)=>{
 const bad=(message:string)=>ctx.addIssue({code:'custom',message})
 try{if(normalizeQuery(b.term)!==b.term)bad('Cụm từ chưa được chuẩn hóa.')}catch{bad('Cụm từ không hợp lệ.')}
 if(b.schedule&&(b.schedule.contentVersion>b.contentVersion||b.schedule.events[0]!.at<b.createdAt||b.schedule.events.at(-1)!.at>b.updatedAt))bad('Lịch ôn không khớp nội dung/timestamp bookmark.')
 if(b.updatedAt<b.createdAt)bad('Timestamp không hợp lệ.')
 if(b.source==='AUTHOR_CREATED'&&!corpus.some(e=>e.id===b.authoredId))bad('Nguồn tự biên soạn không tồn tại.')
 if(b.source==='JISHO_REFERENCE'&&b.authoredId!==null)bad('Không được gán nội dung tự biên soạn cho nguồn Jisho.')
 if(new Set(b.tags).size!==b.tags.length)bad('Tags bị trùng.')
})
export type Bookmark=z.infer<typeof bookmarkSchema>
export const vocabularyBackupSchema=z.object({format:z.literal('BRSE_VOCABULARY_BACKUP'),schemaVersion:z.literal(1),bookmarks:z.array(bookmarkSchema).max(500)}).strict().superRefine((data,ctx)=>{
 if(new Set(data.bookmarks.map(b=>b.id)).size!==data.bookmarks.length)ctx.addIssue({code:'custom',message:'Bookmark ID trùng.'})
 if(new Set(data.bookmarks.map(b=>`${b.source}:${b.term}`)).size!==data.bookmarks.length)ctx.addIssue({code:'custom',message:'Cụm từ/nguồn trùng.'})
})
export function parseVocabularyBackup(text:string){if(text.length>5_000_000)throw new Error('Backup vượt 5 MB.');return vocabularyBackupSchema.parse(JSON.parse(text))}
export function flashcardBack(b:Bookmark){const authored=corpus.find(e=>e.id===b.authoredId);return {reading:authored?.reading??null,meaning:authored?.senses.join('; ')??null,example:authored?.businessExample??null,note:b.note||null}}

export function reviewState(b:Bookmark,now:number){
 const eligible=b.source==='AUTHOR_CREATED'||!!b.note.trim(),stale=!!b.schedule&&b.schedule.contentVersion!==b.contentVersion
 const replay=b.schedule?replayReviews(b.schedule.events):{days:0,dueAt:b.createdAt}
 return {eligible,stale,dueAt:replay.dueAt,days:replay.days,count:b.schedule?.events.length??0,due:eligible&&!stale&&replay.dueAt<=now,full:(b.schedule?.events.length??0)>=100}
}
export function cardContentKey(b:Bookmark){return JSON.stringify([b.term,b.source,b.authoredId,b.note])}
export function gradeBookmark(b:Bookmark,grade:Grade,expected:{contentVersion:number;count:number;contentKey:string},now:number):Bookmark{
 const state=reviewState(b,now)
 if(expected.contentVersion!==b.contentVersion||expected.count!==state.count||expected.contentKey!==cardContentKey(b))throw new Error('Thẻ đã thay đổi hoặc lượt này đã được lưu. Lật lại thẻ hiện tại.')
 if(!state.eligible)throw new Error('Thẻ tham chiếu cần ghi chú cá nhân trước khi ôn theo lịch.')
 if(state.stale)throw new Error('Nội dung mặt sau đã đổi; cần đặt lại lịch sau khi rà soát.')
 if(!state.due)throw new Error('Thẻ chưa đến hạn hoặc đồng hồ đang trước thời điểm tạo thẻ.')
 if(state.full)throw new Error('Đạt 100 lượt/thẻ. Xuất backup trước khi đặt lại lịch.')
 return bookmarkSchema.parse({...b,updatedAt:Math.max(now,b.updatedAt),schedule:{policy:'FIXED_INTERVAL_V1',contentVersion:b.contentVersion,events:[...(b.schedule?.events??[]),{grade,at:now}]}})
}
