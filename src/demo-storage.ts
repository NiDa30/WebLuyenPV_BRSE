import {openDB} from 'idb'
import {emptyDemo,parseDemo,type DemoBackup} from './domain/demo'
const db=()=>openDB('brse-demo',1,{upgrade(d){d.createObjectStore('state')}})
export async function loadDemo(){const d=await db();try{const data=await d.get('state','current');return data===undefined?emptyDemo():parseDemo(JSON.stringify(data))}finally{d.close()}}
export async function saveDemo(value:DemoBackup){const data=parseDemo(JSON.stringify(value)),d=await db();try{await d.put('state',data,'current')}finally{d.close()}}
