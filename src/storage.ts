import { openDB } from 'idb'
import { backupSchema, type Attempt } from './domain/model'
const db = () => openDB('brse-guest', 1, { upgrade(db) { db.createObjectStore('exam', { keyPath: 'id' }) } })
export async function loadAttempts(): Promise<Attempt[]> {
  const d = await db()
  try { return backupSchema.parse({ format: 'BRSE_EXAM_BACKUP', schemaVersion: 1, attempts: await d.getAll('exam') }).attempts }
  finally { d.close() }
}
export async function saveAttempts(attempts: Attempt[]) {
  const checked = backupSchema.parse({ format: 'BRSE_EXAM_BACKUP', schemaVersion: 1, attempts })
  const d = await db()
  try {
    const tx = d.transaction('exam', 'readwrite')
    await tx.store.clear()
    for (const a of checked.attempts) await tx.store.put(a)
    await tx.done
  } finally { d.close() }
}
