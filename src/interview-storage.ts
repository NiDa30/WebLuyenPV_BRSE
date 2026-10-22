import type {ReviewItem} from './domain/review-queue'
import { openDB } from 'idb'
import { interviewBackupSchema, type Interview, type InterviewSession } from './domain/interview'
// Upgrade keeps existing attempts intact. All three stores are replaced atomically.
const db=()=>openDB('brse-interviews',3,{upgrade(d){if(!d.objectStoreNames.contains('attempts'))d.createObjectStore('attempts',{keyPath:'id'});if(!d.objectStoreNames.contains('reviewQueue'))d.createObjectStore('reviewQueue',{keyPath:'id'});if(!d.objectStoreNames.contains('sessions'))d.createObjectStore('sessions',{keyPath:'id'})}})
export async function loadInterviewData(){
  const d=await db()
  try{const tx=d.transaction(['attempts','sessions','reviewQueue']);const [attempts,sessions,reviewQueue]=await Promise.all([tx.objectStore('attempts').getAll(),tx.objectStore('sessions').getAll(),tx.objectStore('reviewQueue').getAll()]);return interviewBackupSchema.parse({format:'BRSE_INTERVIEW_BACKUP',schemaVersion:1,attempts,sessions,reviewQueue})}finally{d.close()}
}
export async function loadInterviews():Promise<Interview[]>{return (await loadInterviewData()).attempts.sort((a,b)=>b.createdAt-a.createdAt||a.id.localeCompare(b.id))}
export async function saveInterviews(attempts:Interview[],sessions:InterviewSession[]=[],reviewQueue:ReviewItem[]=[]){
  const checked=interviewBackupSchema.parse({format:'BRSE_INTERVIEW_BACKUP',schemaVersion:1,attempts,sessions,reviewQueue})
  const d=await db()
  try{const tx=d.transaction(['attempts','sessions','reviewQueue'],'readwrite');await Promise.all([tx.objectStore('attempts').clear(),tx.objectStore('sessions').clear(),tx.objectStore('reviewQueue').clear()]);for(const a of checked.attempts)await tx.objectStore('attempts').put(a);for(const s of checked.sessions)await tx.objectStore('sessions').put(s);for(const item of checked.reviewQueue)await tx.objectStore('reviewQueue').put(item);await tx.done}finally{d.close()}
}
