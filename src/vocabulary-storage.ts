import {openDB} from 'idb'
import {vocabularyBackupSchema,type Bookmark} from './domain/vocabulary'
const db=()=>openDB('brse-vocabulary',1,{upgrade(d){d.createObjectStore('bookmarks',{keyPath:'id'})}})
export async function loadVocabulary():Promise<Bookmark[]>{const d=await db();try{return vocabularyBackupSchema.parse({format:'BRSE_VOCABULARY_BACKUP',schemaVersion:1,bookmarks:await d.getAll('bookmarks')}).bookmarks.sort((a,b)=>b.createdAt-a.createdAt||a.id.localeCompare(b.id))}finally{d.close()}}
export async function saveVocabulary(bookmarks:Bookmark[]){const data=vocabularyBackupSchema.parse({format:'BRSE_VOCABULARY_BACKUP',schemaVersion:1,bookmarks});if(JSON.stringify(data).length>5_000_000)throw new Error('Vocabulary vượt 5 MB.');const d=await db();try{const tx=d.transaction('bookmarks','readwrite');await tx.store.clear();for(const b of data.bookmarks)await tx.store.put(b);await tx.done}finally{d.close()}}
