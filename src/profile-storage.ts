import {openDB} from 'idb'
import {emptyProfile,parseProfile,type Profile} from './domain/profile'
const db=()=>openDB('brse-profile',1,{upgrade(d){d.createObjectStore('state')}})
export async function loadProfile(){const d=await db();try{const value=await d.get('state','current');return value===undefined?emptyProfile():parseProfile(JSON.stringify(value))}finally{d.close()}}
export async function saveProfile(value:Profile){const data=parseProfile(JSON.stringify(value)),d=await db();try{await d.put('state',data,'current')}finally{d.close()}}
