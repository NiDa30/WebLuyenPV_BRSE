import { defineStore } from 'pinia'
import { computed, ref, toRaw } from 'vue'
import { type Attempt, type Config, type Result, parseBackup, resultSchema } from '../domain/model'
import { loadAttempts, saveAttempts } from '../storage'
import * as timer from '../domain/timer'
export const useExamStore = defineStore('exam', () => {
  const attempts = ref<Attempt[]>([])
  const loadFailed=ref(false)
  const ready = ref(false), error = ref(''), saving = ref(false), saved = ref(false)
  let clock = new timer.RuntimeClock()
  let writes: Promise<void> = Promise.resolve()
  const active = computed(() => attempts.value.find(a => a.status !== 'COMPLETED'))
  function persist() {
    if(loadFailed.value)return Promise.resolve()
    const snapshot = structuredClone(toRaw(attempts.value))
    saving.value = true; saved.value = false
    writes = writes.catch(() => {}).then(() => saveAttempts(snapshot)).then(() => { error.value = ''; saved.value = true }).catch(() => {
      error.value = 'Không lưu được IndexedDB. Dữ liệu hiện chỉ ở bộ nhớ; hãy xuất backup trước khi đóng trang.'
    }).finally(() => { saving.value = false })
    return writes
  }
  async function init() {
    try {
      attempts.value = await loadAttempts();loadFailed.value=false;error.value=''
      clock = new timer.RuntimeClock()
      if (active.value) { timer.recover(active.value, Date.now()); await persist() }
      else saved.value = true
    } catch { loadFailed.value=true;error.value = 'Không đọc được dữ liệu local. Chưa ghi đè dữ liệu cũ; hãy kiểm tra quyền lưu trữ hoặc nhập backup.' }
    ready.value = true
  }
  function now() { return clock.now() }
  function tick() {
    const a = active.value
    if (!a || a.status !== 'RUNNING') return
    let changed = false
    if (clock.skewed() && !a.flags.includes('CLOCK_SKEW')) { timer.markSkew(a, now()); changed = true }
    if (timer.elapsed(a, now()) >= a.config.sections[a.index]!.budgetMs) { timer.finishSection(a, now(), a.index); changed = true }
    if (changed) void persist()
  }
  function create(config: Config, material: string, difficulty: string) {
    if(loadFailed.value)throw new Error('Chưa đọc được dữ liệu Exam. Khôi phục backup trước khi tạo phiên.')
    if (active.value) throw new Error('Hãy hoàn tất phiên đang làm trước.')
    if (attempts.value.length >= 500) throw new Error('Đã đạt 500 phiên. Xuất backup rồi xóa lịch sử trước khi tạo phiên mới.')
    clock = new timer.RuntimeClock()
    const a = timer.createAttempt(config, material, difficulty, now())
    attempts.value.unshift(a); void persist(); return a.id
  }
  function action(kind: 'pause' | 'resume' | 'next' | 'finish', expectedIndex?: number) {
    const a = active.value; if (!a) return
    if (kind === 'pause') timer.pause(a, now())
    if (kind === 'resume') timer.resume(a, now())
    if (kind === 'next') timer.nextSection(a, now())
    if (kind === 'finish') timer.finishSection(a, now(), expectedIndex ?? a.index, true)
    void persist()
  }
  function split(label: string, plannedMs: number | null) {
    if (!active.value || active.value.events.length >= 4900) return
    timer.checkpoint(active.value, now(), label, plannedMs); void persist()
  }
  async function score(id: string, values: Result[]) {
    const a = attempts.value.find(a => a.id === id)
    if (!a || a.status !== 'COMPLETED' || values.length !== a.results.length) throw new Error('Phiên hoặc số phần không hợp lệ.')
    a.results = values.map(v => resultSchema.parse(v)); await persist()
  }
  function exportText() { return JSON.stringify({ format:'BRSE_EXAM_BACKUP', schemaVersion:1, attempts: toRaw(attempts.value) }, null, 2) }
  async function importText(text: string) {
    const data = parseBackup(text)
    // Explicit replace, transactionally: no silent merging of active sessions.
    await saveAttempts(data.attempts)
    loadFailed.value=false;attempts.value = data.attempts; clock = new timer.RuntimeClock()
    if (active.value) timer.recover(active.value, Date.now())
    await persist()
  }
  async function clear() { await saveAttempts([]); loadFailed.value=false;attempts.value = []; error.value='';saved.value = true }
  return { attempts, loadFailed, ready, error, saving, saved, active, init, now, tick, persist, create, action, split, score, exportText, importText, clear }
})
