import {openDB} from 'idb'
import {emptyTechnicalGoals,parseTechnicalGoals,type TechnicalGoals} from './domain/technical-goals'
const db=()=>openDB('brse-technical-goals',1,{upgrade(d){d.createObjectStore('state')}})
export async function loadTechnicalGoals(){const d=await db();try{const value=await d.get('state','current');return value===undefined?emptyTechnicalGoals():parseTechnicalGoals(JSON.stringify(value))}finally{d.close()}}
export async function saveTechnicalGoals(value:TechnicalGoals){const data=parseTechnicalGoals(JSON.stringify(value)),d=await db();try{await d.put('state',data,'current')}finally{d.close()}}
