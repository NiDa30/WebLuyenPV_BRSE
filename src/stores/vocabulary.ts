import {defineStore} from 'pinia'
import {ref,toRaw} from 'vue'
import {bookmarkSchema,parseVocabularyBackup,vocabularyBackupSchema,gradeBookmark,type Bookmark} from '../domain/vocabulary'
import type {Grade} from '../domain/spaced-review'
import {normalizeQuery} from '../domain/dictionary'
import {loadVocabulary,saveVocabulary} from '../vocabulary-storage'
export const useVocabularyStore=defineStore('vocabulary',()=>{
 const bookmarks=ref<Bookmark[]>([]),ready=ref(false),error=ref(''),loadFailed=ref(false),saving=ref(false)
 let writes:Promise<void>=Promise.resolve(),initializing:Promise<void>|undefined,pending=0
 async function init(){if(ready.value)return;if(initializing)return initializing;initializing=(async()=>{try{bookmarks.value=await loadVocabulary()}catch{loadFailed.value=true;error.value='Không đọc được sổ từ. Chưa ghi đè dữ liệu; có thể nhập backup hoặc xóa sau xác nhận.'}ready.value=true})();return initializing}
 function persist(){if(loadFailed.value)return Promise.reject(new Error(error.value));const snapshot=structuredClone(toRaw(bookmarks.value));pending++;saving.value=true;const operation=writes.catch(()=>{}).then(()=>saveVocabulary(snapshot));writes=operation.then(()=>{error.value=''}).catch(()=>{error.value='Không lưu được sổ từ. Hãy giữ trang mở và xuất backup.'}).finally(()=>{pending--;saving.value=pending>0});return operation}
 async function add(term:string,source:Bookmark['source'],authoredId:string|null){
  await init();if(loadFailed.value)throw new Error(error.value)
  const q=normalizeQuery(term),existing=bookmarks.value.find(b=>b.term===q&&b.source===source);if(existing)return existing.id
  if(bookmarks.value.length>=500)throw new Error('Đã đạt 500 từ. Xuất backup trước khi xóa bớt.')
  const now=Date.now(),b=bookmarkSchema.parse({id:crypto.randomUUID(),term:q,source,authoredId,note:'',tags:[],createdAt:now,updatedAt:now});bookmarks.value.unshift(b);await persist();return b.id
 }
 async function update(id:string,note:string,tags:string[]){if(loadFailed.value)throw new Error(error.value);const i=bookmarks.value.findIndex(b=>b.id===id);if(i<0)throw new Error('Không tìm thấy bookmark.');bookmarks.value[i]=bookmarkSchema.parse({...bookmarks.value[i],contentVersion:bookmarks.value[i]!.contentVersion+(note!==bookmarks.value[i]!.note?1:0),note,tags:[...new Set(tags.map(t=>t.trim()).filter(Boolean))],updatedAt:Math.max(Date.now(),bookmarks.value[i]!.updatedAt)});await persist()}
 async function review(id:string,grade:Grade,expected:{contentVersion:number;count:number;contentKey:string},now=Date.now()){
  if(loadFailed.value)throw new Error(error.value)
  const i=bookmarks.value.findIndex(b=>b.id===id);if(i<0)throw new Error('Thẻ đã bị xóa hoặc thay thế.')
  const next=gradeBookmark(structuredClone(toRaw(bookmarks.value[i]!)),grade,expected,now)
  const candidate=[...toRaw(bookmarks.value)];candidate[i]=next
  const checked=vocabularyBackupSchema.parse({format:'BRSE_VOCABULARY_BACKUP',schemaVersion:1,bookmarks:candidate})
  if(JSON.stringify(checked).length>5_000_000)throw new Error('Sổ từ vượt 5 MB. Xuất backup và giảm dữ liệu trước khi tiếp tục.')
  bookmarks.value[i]=next;await persist()
 }
 async function resetSchedule(id:string){if(loadFailed.value)throw new Error(error.value);const i=bookmarks.value.findIndex(b=>b.id===id);if(i<0)throw new Error('Không tìm thấy thẻ.');const next={...toRaw(bookmarks.value[i]!),updatedAt:Math.max(Date.now(),bookmarks.value[i]!.updatedAt)};delete next.schedule;bookmarks.value[i]=bookmarkSchema.parse(next);await persist()}
 async function remove(id:string){if(loadFailed.value)throw new Error(error.value);bookmarks.value=bookmarks.value.filter(b=>b.id!==id);await persist()}
 function exportText(){return JSON.stringify({format:'BRSE_VOCABULARY_BACKUP',schemaVersion:1,bookmarks:toRaw(bookmarks.value)},null,2)}
 async function importText(text:string){const data=parseVocabularyBackup(text);await writes;await saveVocabulary(data.bookmarks);bookmarks.value=data.bookmarks;loadFailed.value=false;error.value='';ready.value=true}
 async function clear(){await writes;await saveVocabulary([]);bookmarks.value=[];loadFailed.value=false;error.value='';ready.value=true}
 return {review,resetSchedule,bookmarks,ready,error,saving,loadFailed,init,add,update,remove,exportText,importText,clear}
})
