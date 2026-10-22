import {openDB} from 'idb'
import {emptyReadiness,readinessSchema,type Readiness} from './domain/readiness'
const db=()=>openDB('brse-readiness',1,{upgrade(d){d.createObjectStore('state')}})
export async function loadReadiness(){const d=await db();try{const value=await d.get('state','current');return value===undefined?emptyReadiness():readinessSchema.parse(value)}finally{d.close()}}
export async function saveReadiness(value:Readiness){const parsed=readinessSchema.parse(value),d=await db();try{await d.put('state',parsed,'current')}finally{d.close()}}
