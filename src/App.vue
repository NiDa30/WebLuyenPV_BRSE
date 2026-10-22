<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, toRaw, watch } from 'vue'
import ProfileWorkspace from './components/ProfileWorkspace.vue'
import TechnicalDrills from './components/TechnicalDrills.vue'
import DemoWorkspace from './components/DemoWorkspace.vue'
import ReadinessWorkspace from './components/ReadinessWorkspace.vue'
import LearningDashboard from './components/LearningDashboard.vue'
import type {DashboardTarget} from './domain/dashboard'
import { useExamStore } from './stores/exam'
import JapaneseWorkspace from './components/JapaneseWorkspace.vue'
import InterviewWorkspace from './components/InterviewWorkspace.vue'
import { configSchema, resultSchema, parseBackup, type Attempt, type Config, type Result } from './domain/model'
import { practiceConfig } from './domain/profiles'
import { elapsed } from './domain/timer'
import { algorithmVersion, analyze, comparable, thresholds } from './domain/strategy'
const store = useExamStore()
const technicalTarget=ref<DashboardTarget>(),demoTarget=ref<DashboardTarget>(),interviewTarget=ref<DashboardTarget>(),japaneseTab=ref<'scheduled'|'notebook'|'data'>()
const page = ref('home'), selectedId = ref(''), message = ref(''), formError = ref('')
const exam = ref<Config['exam']>('JLPT'), level = ref('N3')
const config = ref(practiceConfig(exam.value, level.value))
const levels = computed(() => exam.value === 'JLPT' ? ['N1','N2','N3','N4','N5'] : exam.value === 'NAT_TEST' ? ['1Q','2Q','3Q','4Q','5Q'] : ['BJT'])
watch(exam, () => { level.value = exam.value === 'JLPT' ? 'N3' : exam.value === 'NAT_TEST' ? '3Q' : 'BJT'; config.value = practiceConfig(exam.value, level.value) })
watch(level, () => { config.value = practiceConfig(exam.value, level.value) })
const setup = reactive({ material:'', difficulty:'', acknowledged:false })
const active = computed(() => store.active)
const current = computed(() => store.attempts.find(a => a.id === selectedId.value))
const completed = computed(() => store.attempts.filter(a => a.status === 'COMPLETED'))
const report = computed(() => current.value ? analyze(current.value) : [])
const scoreDraft = ref<Result[]>([])
const otherId = ref('')
const other = computed(() => store.attempts.find(a => a.id === otherId.value))
const comparison = computed(() => current.value && other.value ? comparable(current.value, other.value) : null)
const splitLabel = ref('Bắt đầu đọc'), splitPlan = ref<number | null>(null)
const refresh = ref(0)
const used = computed(() => { void refresh.value; return active.value ? elapsed(active.value, store.now()) : 0 })
const remaining = computed(() => active.value ? active.value.config.sections[active.value.index]!.budgetMs - used.value : 0)
function format(ms: number) { const s = Math.max(0,Math.ceil(ms/1000)); return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}` }
function date(ms: number) { return new Date(ms).toLocaleString('vi-VN') }
function duration(a: Attempt) { return a.elapsed.reduce((x,y) => x+y,0) }
function rawAccuracy(r: Result) { return r.correct !== null && r.answered !== null && r.answered > 0 ? `${(r.correct/r.answered*100).toFixed(1)}%` : 'N/A' }
function go(target: string) { if(target==='technical')technicalTarget.value=undefined; if(target==='demo')demoTarget.value=undefined; if(target==='interviews')interviewTarget.value=undefined;if(target==='japanese')japaneseTab.value=undefined;page.value=target; message.value=''; formError.value='' }
function dashboardStart(module:'EXAM'|'INTERVIEW'|'VOCABULARY'|'DEMO'){go(module==='DEMO'?'demo':module==='EXAM'?(active.value?'timer':'selector'):module==='INTERVIEW'?'interviews':'japanese')}
function dashboardNavigate(target:DashboardTarget){
 if(target.kind==='TECHNICAL_GOAL'||target.kind==='TECHNICAL_GOALS'){go('technical');technicalTarget.value=target;return}
 if(target.kind==='DEMO_DATA'||target.kind==='DEMO_SESSION'||target.kind==='DEMO_PLAN'){go('demo');demoTarget.value=target;return}
 if(target.kind==='EXAM_TIMER'){go(active.value?'timer':'selector');return}
 if(target.kind==='EXAM_DATA'){go('data');return}
 if(target.kind==='EXAM_RESULT'){if(store.attempts.some(a=>a.id===target.id&&a.status==='COMPLETED'))openResult(target.id);else{go('history');message.value='Phiên đã bị xóa hoặc thay thế.'}return}
 if(target.kind.startsWith('VOCABULARY')){go('japanese');japaneseTab.value=target.kind==='VOCABULARY_REVIEW'?'scheduled':target.kind==='VOCABULARY_DATA'?'data':'notebook';return}
 go('interviews');interviewTarget.value=target
}
function start() {
  formError.value=''
  if(store.loadFailed){formError.value='Chưa đọc được Exam. Hãy khôi phục backup trước khi tạo phiên.';return}
  if (!setup.material.trim() || !setup.acknowledged) { formError.value='Nhập tên đề và xác nhận chính sách luyện tập.'; return }
  try {
    const c = configSchema.parse(toRaw(config.value))
    c.version = 'practice-v1-' + c.sections.map(s => `${s.id}:${s.budgetMs}`).join('-')
    selectedId.value = store.create(c,setup.material.trim(),setup.difficulty.trim()); go('timer')
  } catch { formError.value='Cấu hình không hợp lệ: mỗi phần cần từ 1 giây đến 240 phút, tên đề tối đa 120 ký tự.' }
}
function finish() {
  if (!active.value) return
  const index = active.value.index, id = active.value.id
  if (window.confirm('Kết thúc phần này sớm? Thời gian còn lại không chuyển sang phần sau. Với phần nghe, chỉ kết thúc khi audio của đề đã kết thúc.')) {
    store.action('finish', index)
    if (!store.active) openResult(id)
  }
}
function addSplit() {
  if (!splitLabel.value.trim()) { formError.value='Nhập tên checkpoint.'; return }
  if (splitPlan.value !== null && (!Number.isFinite(splitPlan.value) || splitPlan.value < 0 || splitPlan.value > 240)) { formError.value='Mốc dự kiến từ 0 đến 240 phút.'; return }
  store.split(splitLabel.value, splitPlan.value === null ? null : Math.round(splitPlan.value*60000)); formError.value=''
}
function openResult(id: string) {
  selectedId.value=id; otherId.value=''
  const a=store.attempts.find(a=>a.id===id)
  scoreDraft.value = a ? structuredClone(toRaw(a.results)) : []
  go('result')
}
async function saveScores() {
  try { formError.value=''; await store.score(selectedId.value, scoreDraft.value); message.value=store.error ? '' : 'Đã lưu kết quả và cập nhật phân tích.' }
  catch(e) { formError.value= e instanceof Error ? e.message : 'Dữ liệu không hợp lệ.' }
}
function resultErrors(r: Result) { const v=resultSchema.safeParse(r); return v.success ? '' : v.error.issues.map(i=>i.message).join(' ') }
function numberInput(e: Event): number | null { const v=(e.target as HTMLInputElement).value; return v === '' ? null : Number(v) }
function download() {
  const url=URL.createObjectURL(new Blob([store.exportText()],{type:'application/json'}))
  const a=document.createElement('a'); a.href=url; a.download=`brse-exam-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url)
}
async function upload(e: Event) {
  const input=e.target as HTMLInputElement, file=input.files?.[0]
  if (!file) return
  try {
    if (file.size>5_000_000) throw new Error('Backup vượt 5 MB.')
    const text=await file.text()
    // Validate BEFORE asking to replace.
    parseBackup(text)
    if (!window.confirm('Nhập backup sẽ thay thế toàn bộ dữ liệu exam trên thiết bị này, kể cả phiên đang làm. Bạn đã xuất backup hiện tại?')) return
    await store.importText(text); message.value='Đã khôi phục backup.'; selectedId.value=''
  } catch { message.value='Không nhập được: file sai schema/version, dữ liệu không hợp lệ hoặc không ghi được IndexedDB. Dữ liệu hiện tại không bị thay thế khi validation thất bại.' }
  finally { input.value='' }
}
async function clearData() {
  if (!window.confirm('Xóa toàn bộ phiên exam trên thiết bị? Hành động này không thể hoàn tác nếu chưa xuất backup.')) return
  try { await store.clear(); selectedId.value=''; message.value='Đã xóa dữ liệu exam.' } catch { message.value='Không xóa được dữ liệu; hãy kiểm tra quyền lưu trữ.' }
}
async function fullscreen() { try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen() } catch { message.value='Trình duyệt không hỗ trợ toàn màn hình. Bạn vẫn dùng timer bình thường.' } }
let interval: ReturnType<typeof setInterval>, periodic: ReturnType<typeof setInterval>
const visibility = () => { store.tick(); refresh.value++ }
onMounted(async () => {
  await store.init()
  interval=setInterval(()=>{store.tick(); refresh.value++},200)
  periodic=setInterval(()=>{if(store.active) void store.persist()},15000)
  document.addEventListener('visibilitychange',visibility)
})
onUnmounted(()=>{clearInterval(interval);clearInterval(periodic);document.removeEventListener('visibilitychange',visibility)})
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#" @click.prevent="go('home')"><span class="brand-icon">橋</span><span>BRSE<span class="brand-sub">INTERVIEW TRAINER</span></span></a>
      <div class="workspace-label">KHÔNG GIAN LUYỆN TẬP</div>
      <nav aria-label="Điều hướng chính">
        <button :class="{selected:page==='home'}" @click="go('home')"><span aria-hidden="true">◈</span> Tổng quan</button>
        <button :class="{selected:page==='dashboard'}" @click="go('dashboard')"><span aria-hidden="true">▦</span> Dashboard học tập</button>
        <button :class="{selected:['selector','timer','result'].includes(page)}" @click="go(active?'timer':'selector')"><span aria-hidden="true">◷</span> Exam Time & Strategy <i class="dot"></i></button>
        <button :class="{selected:page==='interviews'}" @click="go('interviews')"><span aria-hidden="true">会</span> Phỏng vấn & Retry</button>
        <button :class="{selected:page==='japanese'}" @click="go('japanese')"><span aria-hidden="true">文</span> Nhật ngữ & Sổ từ</button>
        <button :class="{selected:page==='profile'}" @click="go('profile')"><span aria-hidden="true">▤</span> Hồ sơ & CV</button>
        <button :class="{selected:page==='technical'}" @click="go('technical')"><span aria-hidden="true">⌘</span> Technical Drill</button>
        <button :class="{selected:page==='demo'}" @click="go('demo')"><span aria-hidden="true">▷</span> Project Demo</button>
        <button :class="{selected:page==='readiness'}" @click="go('readiness')"><span aria-hidden="true">✓</span> Checklist phỏng vấn</button>
        <button :class="{selected:page==='history'}" @click="go('history')"><span aria-hidden="true">↗</span> Lịch sử luyện tập</button>
        <button :class="{selected:page==='data'}" @click="go('data')"><span aria-hidden="true">⇅</span> Dữ liệu của tôi</button>
      </nav>
      <div class="workspace-label later-label">LỘ TRÌNH TIẾP THEO</div>
      <div class="later"><span>話</span> Voice cơ bản trong Interview <small>β</small></div>
      <div class="later"><span>映</span> Immersion Kit <small>S4</small></div>
      <div class="sidebar-bottom"><span class="avatar">G</span><div>Không gian Guest<small>Không cần tài khoản</small></div><span class="online-dot"></span></div>
    </aside>
    <div class="main-wrap">
      <header class="topbar"><span>Không gian học tập <span class="slash">/</span> <strong>{{page==='profile'?'Hồ sơ & CV':page==='technical'?'Technical Drill':page==='demo'?'Project Demo':page==='readiness'?'Checklist phỏng vấn':page==='dashboard'?'Dashboard học tập':page==='interviews'?'Interview & Retry':page==='japanese'?'Nhật ngữ & Sổ từ':'Exam Strategy'}}</strong></span><span class="storage-badge"><span class="online-dot"></span>{{ ['dashboard','demo','readiness','profile'].includes(page)?'Dữ liệu trên thiết bị':store.saving ? 'Đang lưu…' : store.saved ? 'Đã lưu trên thiết bị' : 'Local-first' }}</span></header>
      <main id="main-content">
        <div v-if="!store.ready" class="card">Đang mở dữ liệu trên thiết bị…</div>
        <div v-if="store.error" class="notice danger" role="alert">{{ store.error }} <button @click="store.persist()" :disabled="store.loadFailed">Thử lưu lại</button></div>
        <div v-if="message" class="notice" role="status">{{ message }}</div>
        <template v-if="store.ready">
          <ProfileWorkspace v-if="page==='profile'"/>
          <TechnicalDrills v-if="page==='technical'" :initial-target="technicalTarget" @open="id=>dashboardNavigate({kind:'INTERVIEW_ATTEMPT',id})"/>
          <DemoWorkspace v-if="page==='demo'" :initial-target="demoTarget"/>
          <ReadinessWorkspace v-if="page==='readiness'"/>
          <LearningDashboard v-if="page==='dashboard'" @navigate="dashboardNavigate" @start="dashboardStart"/>
          <InterviewWorkspace v-if="page==='interviews'" :initial-target="interviewTarget"/>
          <JapaneseWorkspace v-if="page==='japanese'" :initial-tab="japaneseTab"/>
          <template v-if="page==='home'">
            <div class="eyebrow">MỖI LẦN LUYỆN, MỘT BƯỚC TIẾN</div>
            <h1>Luyện có mục tiêu.<br><span>Tiến bộ có bằng chứng.</span></h1>
            <p class="lead">Không chỉ làm thêm đề. Hiểu thời gian của bạn đi đâu,<br class="desktop"> và tìm chiến lược phù hợp cho lần thi tiếp theo.</p>
            <div class="actions"><button @click="go('dashboard')">Xem dashboard học tập →</button></div>
            <section class="hero-card">
              <div><span class="pill">EXAM TIME & STRATEGY</span><h2>Làm đề của bạn.<br>Để chúng tôi giữ nhịp.</h2><p>Mở sách hoặc PDF ở bên cạnh. Bấm giờ, đánh dấu checkpoint<br class="desktop"> và nhìn lại mối liên hệ giữa tốc độ với độ chính xác.</p><button class="primary" @click="go(active?'timer':'selector')">{{ active ? 'Tiếp tục phiên đang làm' : 'Bắt đầu một phiên luyện' }} <span>→</span></button><small class="hero-note">JLPT · NAT-TEST · BJT &nbsp; / &nbsp; Không cần AI hay tài khoản</small></div>
              <div class="clock-art" aria-hidden="true"><div class="clock-ring"><span>GIỮ NHỊP. GIỮ TRỌNG TÂM.</span><strong>25:00</strong><div class="clock-line"></div><small>一歩ずつ、確実に。</small></div><div class="art-label">THỜI GIAN → DỮ LIỆU → CHIẾN LƯỢC</div></div>
            </section>
            <div class="section-heading"><h2>Một vòng luyện tập rõ ràng</h2><span>04 bước · Dữ liệu thuộc về bạn</span></div>
            <div class="steps"><article class="card"><span class="step-no">01 / CHUẨN BỊ</span><h3>Chọn đề & thời lượng</h3><p>Chọn kỳ thi, cấp độ và đặt thời gian theo tài liệu bạn đang dùng.</p></article><article class="card"><span class="step-no">02 / TẬP TRUNG</span><h3>Bấm giờ & ghi mốc</h3><p>Timer không cộng thêm thời gian khi chuyển tab. Ghi split khi cần.</p></article><article class="card"><span class="step-no">03 / NHÌN LẠI</span><h3>Nhập kết quả thật</h3><p>Số câu đã làm, số câu đúng và điểm từ nguồn bạn xác nhận.</p></article><article class="card"><span class="step-no">04 / ĐIỀU CHỈNH</span><h3>Thử chiến lược mới</h3><p>Gợi ý có chứng cứ, lưu lịch sử và so sánh các lần tương đương.</p></article></div>
            <div class="privacy-line"><span>◇</span><p><strong>Học riêng tư, ngay trên thiết bị.</strong> Lịch sử lưu trong trình duyệt. Xuất backup để tránh mất dữ liệu khi xóa bộ nhớ.</p><button class="text-button" @click="go('data')">Quản lý dữ liệu →</button></div>
          </template>

          <template v-if="page==='selector'">
            <div class="eyebrow">01 / CHUẨN BỊ</div><h1 class="page-title">Thiết lập phiên luyện</h1><p class="lead">Một chiếc đồng hồ cho đề sách / PDF của bạn. Không tải đề lên máy chủ.</p>
            <div v-if="active" class="notice">Bạn có một phiên chưa hoàn tất. <button @click="go('timer')">Tiếp tục phiên</button></div>
            <form v-else @submit.prevent="start" class="setup-grid">
              <section class="card form-card"><h2>01. Kỳ thi & tài liệu</h2><div class="field-row"><label>Kỳ thi<select v-model="exam"><option value="JLPT">JLPT</option><option value="NAT_TEST">NAT-TEST</option><option value="BJT">BJT</option></select></label><label>Cấp độ<select v-model="level"><option v-for="l in levels" :key="l">{{ l }}</option></select></label></div>
                <label>Tên / mã đề sách hoặc PDF<input v-model="setup.material" required maxlength="120" placeholder="Ví dụ: Sách luyện N3 · Đề số 01"></label>
                <label>Nhóm độ khó tương đương (không bắt buộc)<input v-model="setup.difficulty" maxlength="80" placeholder="Ví dụ: Cùng bộ sách, mức N3 cơ bản"></label><p class="hint">Chưa biết độ khó → chỉ xem dữ liệu song song, chưa kết luận tiến bộ.</p>
                <div class="mode-box"><strong>Paper / PDF bên ngoài</strong><p>Mở đề ở sách, cửa sổ hoặc thiết bị khác. Ứng dụng không đọc, tải lên hay lưu PDF của bạn.</p></div>
              </section>
              <section class="card form-card"><h2>02. Thời gian từng phần</h2><span class="pill warning">UNVERIFIED · MẪU TỰ LUYỆN</span><p class="hint">Các phút dưới đây chỉ là ví dụ do ứng dụng biên soạn, không phải cấu trúc thi chính thức. Hãy chỉnh theo tài liệu đề. N1/N2 có thể gộp kiến thức ngôn ngữ và đọc; hãy đặt lại tên/phút phù hợp.</p>
                <div v-for="(s,i) in config.sections" :key="s.id" class="section-config"><label :for="`name-${i}`">Tên phần {{ i+1 }}<input :id="`name-${i}`" v-model="s.name" required maxlength="100"></label><label :for="`minutes-${i}`">Phút<input :id="`minutes-${i}`" type="number" min="0.016667" max="240" step="any" :value="s.budgetMs/60000" @input="s.budgetMs=Math.round(Number(($event.target as HTMLInputElement).value)*60000)" required></label><label class="check small-check"><input type="checkbox" v-model="s.fixedAudio"> Theo audio</label></div>
                <p class="hint">Phần nghe: dùng audio của đề ở ngoài ứng dụng, tự bắt đầu đồng hồ cùng audio. Không tự điều khiển hay đồng bộ audio; không chuyển phút dư giữa các phần.</p>
                <a :href="config.sourceUrl" target="_blank" rel="noopener noreferrer">Nguồn tham khảo chính thức ↗</a><p class="hint">Chưa xác minh năm {{config.year}} · {{config.version}}</p>
              </section>
              <section class="card preflight"><h2>03. Trước khi bắt đầu</h2><p><strong>Strategy Practice</strong> · Official Simulation đang khóa vì cấu hình chưa VERIFIED.</p><p>Chuyển tab / khóa màn hình vẫn tính giờ. Tạm dừng được ghi log và đánh dấu không tương đương thi thật. Hết giờ sẽ khóa phần; phần tiếp theo chỉ bắt đầu khi bạn chủ động bấm.</p><label class="check"><input type="checkbox" v-model="setup.acknowledged" required> Tôi đã chỉnh thời lượng theo đề và hiểu đây là phiên tự luyện.</label><p v-if="formError" class="error" role="alert">{{ formError }}</p><button class="primary" type="submit">Bắt đầu bấm giờ →</button></section>
            </form>
          </template>

          <template v-if="page==='timer'">
            <div class="section-heading"><div><div class="eyebrow">02 / TẬP TRUNG</div><h1 class="page-title">Giữ nhịp làm bài</h1></div><button @click="fullscreen">Toàn màn hình ⛶</button></div>
            <template v-if="active">
              <div class="timer-layout"><section class="card timer-card"><div class="section-heading"><span class="pill">{{active.config.exam}} · {{active.config.level}}</span><span class="muted">Phần {{active.index+1}} / {{active.config.sections.length}}</span></div><h2>{{ active.config.sections[active.index]!.name }}</h2><p>{{ active.material }} · Strategy Practice</p><div class="timer" data-testid="timer" :class="{expired:remaining===0}" role="timer" aria-label="Thời gian còn lại">{{format(remaining)}}</div><p>Đã dùng {{format(used)}} / {{format(active.config.sections[active.index]!.budgetMs)}}</p><progress :value="used" :max="active.config.sections[active.index]!.budgetMs" aria-label="Thời gian đã dùng"></progress>
                <p v-if="active.config.sections[active.index]!.fixedAudio" class="notice">Theo audio của đề. Pause ứng dụng không pause audio ngoài; tự kiểm soát audio và ghi nhận gián đoạn.</p>
                <div class="actions" v-if="active.status==='RUNNING'"><button @click="store.action('pause')">Tạm dừng</button><button class="primary" @click="finish">Kết thúc phần</button></div>
                <div v-if="active.status==='PAUSED'" class="notice"><p>Đã tạm dừng · Không tương đương thi thật.</p><button class="primary" @click="store.action('resume')">Tiếp tục bấm giờ</button><button @click="finish">Kết thúc phần</button></div>
                <div v-if="active.status==='BETWEEN'" class="notice" role="status"><p>Phần đã kết thúc. Không cộng thời gian dư sang phần sau.</p><button class="primary" @click="store.action('next')">Bắt đầu phần tiếp theo →</button></div>
                <p v-if="active.flags.length" class="hint">Ghi nhận: {{active.flags.join(' · ')}}. Khôi phục sau reload dùng đồng hồ thiết bị; không thể đảm bảo độ chính xác nếu đồng hồ bị chỉnh trong lúc đóng trang.</p>
              </section><section class="card form-card"><h2>Đánh dấu checkpoint</h2><p class="hint">Bấm khi đổi hoạt động, không cần ghi từng câu.</p><form @submit.prevent="addSplit"><label>Tên checkpoint<input v-model="splitLabel" maxlength="200" placeholder="Bắt đầu đọc"></label><label>Mốc dự kiến từ đầu phần (phút)<input type="number" min="0" max="240" step="any" :value="splitPlan ?? ''" @input="splitPlan=numberInput($event)" placeholder="Để trống nếu chưa đặt"></label><button class="primary full" :disabled="active.status!=='RUNNING' || active.events.length>=4900">+ Ghi split</button></form><p v-if="formError" class="error" role="alert">{{formError}}</p><div class="timeline"><div v-for="e in active.events.filter(e=>e.kind==='CHECKPOINT').slice(-8).reverse()" :key="e.id"><span>{{format(e.elapsedMs)}}</span><div>{{e.label}}<small>{{active.config.sections.find(s=>s.id===e.sectionId)?.name}}</small></div></div><p v-if="!active.events.some(e=>e.kind==='CHECKPOINT')" class="empty">Chưa có split. Mốc đầu tiên sẽ xuất hiện ở đây.</p></div></section></div>
            </template>
            <section v-else class="card empty"><h2>Không có phiên đang chạy</h2><button v-if="store.attempts[0]?.status==='COMPLETED'" class="primary" @click="openResult(store.attempts[0]!.id)">Nhập điểm & xem chiến lược →</button><button v-else class="primary" @click="go('selector')">Tạo phiên mới</button></section>
          </template>

          <template v-if="page==='result' && current">
            <div class="eyebrow">03–04 / NHÌN LẠI & ĐIỀU CHỈNH</div><h1 class="page-title">Kết quả & chiến lược</h1><p class="lead">{{current.config.exam}} {{current.config.level}} · {{current.material}} · {{date(current.createdAt)}}</p><div class="notice">Strategy Practice · UNVERIFIED · {{current.config.version}}. Không suy ra điểm chuẩn hóa JLPT/BJT hay kết luận đỗ/trượt từ % đúng. Điểm báo cáo là dữ liệu bạn tự nhập, không phải kết quả được ứng dụng xác thực.</div>
            <section class="card form-card"><p class="hint">Đây là các phần bấm giờ tự đặt, chưa mô hình hóa nhóm điểm chính thức (có thể khác phần bấm giờ). Chỉ ghi điểm khi biết đúng nhóm và nguồn; không áp dụng cutoff.</p><div class="section-heading"><h2>Nhập kết quả từng phần</h2><span class="muted">Để trống nếu chưa biết · không thay bằng 0</span></div>
              <form @submit.prevent="saveScores"><div v-for="(r,i) in scoreDraft" :key="i" class="score-section"><h3>{{current.config.sections[i]!.name}}</h3><div class="score-grid"><label>Tổng câu<input type="number" min="0" max="10000" :value="r.total ?? ''" @input="r.total=numberInput($event)"></label><label>Đã làm<input type="number" min="0" max="10000" :value="r.answered ?? ''" @input="r.answered=numberInput($event)"></label><label>Đúng<input type="number" min="0" max="10000" :value="r.correct ?? ''" @input="r.correct=numberInput($event)"></label><label>Loại điểm<select v-model="r.scoreKind"><option value="RAW_CORRECT_COUNT">Số câu đúng thô</option><option value="MOCK_ESTIMATED">Điểm đề mock</option><option value="OFFICIAL_SCALED">Điểm báo cáo chính thức</option><option value="PERCENT_ACCURACY">Phần trăm tự nhập</option></select></label><label>Điểm báo cáo<input type="number" min="0" max="10000" step="any" :value="r.score ?? ''" @input="r.score=numberInput($event)"></label><label>Thang điểm<input type="number" min="0.01" max="10000" step="any" :value="r.max ?? ''" @input="r.max=numberInput($event)"></label><label>Nguồn điểm<select v-model="r.provenance"><option value="SELF_REPORTED">Tự ghi nhận</option><option value="MOCK_PROVIDER">Nhà cung cấp đề mock</option><option value="OFFICIAL_SCORE_SHEET">Phiếu điểm chính thức (tự nhập)</option></select></label></div><p v-if="resultErrors(r)" class="error" role="alert">{{resultErrors(r)}}</p></div><p v-if="formError" class="error" role="alert">{{formError}}</p><button class="primary" :disabled="scoreDraft.some(r=>!!resultErrors(r))">Lưu điểm & phân tích →</button></form>
            </section>
            <div class="section-heading"><h2>Thời gian × kết quả đã lưu</h2><span>{{algorithmVersion}}</span></div><section class="card table-wrap"><table><thead><tr><th>Phần</th><th>Đã dùng / dự kiến</th><th>Đã làm / tổng</th><th>Chưa làm</th><th>Đúng / đã làm</th><th>Điểm báo cáo</th></tr></thead><tbody><tr v-for="(s,i) in current.config.sections" :key="s.id"><th>{{s.name}}</th><td>{{format(current.elapsed[i]!)}} / {{format(s.budgetMs)}}<progress :value="current.elapsed[i]" :max="s.budgetMs" :aria-label="s.name+' thời gian'"></progress></td><td>{{current.results[i]!.answered ?? 'N/A'}} / {{current.results[i]!.total ?? 'N/A'}}</td><td>{{current.results[i]!.total!==null && current.results[i]!.answered!==null ? current.results[i]!.total! - current.results[i]!.answered! : 'N/A'}}</td><td>{{rawAccuracy(current.results[i]!)}}</td><td>{{current.results[i]!.score ?? 'N/A'}} / {{current.results[i]!.max ?? 'N/A'}}<small>{{current.results[i]!.scoreKind}}</small></td></tr></tbody></table></section>
            <p class="hint">Đúng/đã làm là accuracy trên câu đã làm, không phải phần trăm tổng đề. Các nhận định tốc độ/accuracy dùng ngưỡng pilot: thấp &lt; {{thresholds.lowAccuracy*100}}%, cao ≥ {{thresholds.highAccuracy*100}}%, nhanh ≤ {{thresholds.fastTime*100}}% thời lượng, chậm ≥ {{thresholds.slowTime*100}}%. Chưa được hiệu chuẩn; không kết luận nhân quả.</p>
            <div class="findings"><article class="card finding" v-for="(f,i) in report" :key="i"><div class="eyebrow">{{f.section}} · {{f.certainty}}</div><h3>{{f.code}}</h3><p class="evidence">{{f.evidence}}</p><p>{{f.recommendation}}</p><small><strong>Lần sau:</strong> {{f.trial}}</small></article></div>
            <section class="card form-card"><h2>Timeline & splits</h2><div class="table-wrap"><table><thead><tr><th>Phần</th><th>Sự kiện</th><th>Từ đầu phần</th><th>Mốc dự kiến</th></tr></thead><tbody><tr v-for="e in current.events" :key="e.id"><td>{{current.config.sections.find(s=>s.id===e.sectionId)?.name}}</td><td>{{e.kind}}<small>{{e.label}}</small></td><td>{{format(e.elapsedMs)}}</td><td>{{e.plannedMs===null?'N/A':format(e.plannedMs)}}</td></tr></tbody></table></div></section>
            <section class="card form-card"><h2>So sánh với lần khác</h2><label>Chọn phiên đã hoàn tất<select v-model="otherId"><option value="">Chọn một phiên…</option><option v-for="a in completed.filter(a=>a.id!==current?.id)" :key="a.id" :value="a.id">{{a.material}} · {{date(a.createdAt)}}</option></select></label><template v-if="comparison && other"><p :class="comparison.ok?'success':'error'">{{comparison.ok?'COMPARABLE · Cùng cấu hình và điều kiện tự khai báo':'NOT_COMPARABLE · Chỉ xem song song'}}</p><ul v-if="!comparison.ok"><li v-for="reason in comparison.reasons" :key="reason">{{reason}}</li></ul><div class="table-wrap"><table><thead><tr><th>Chỉ số</th><th>{{current.material}}</th><th>{{other.material}}</th></tr></thead><tbody><tr><th>Tổng thời gian</th><td>{{format(duration(current))}}</td><td>{{format(duration(other))}}</td></tr><tr v-for="(s,i) in current.config.sections" :key="s.id"><th>{{s.name}} · accuracy thô</th><td>{{rawAccuracy(current.results[i]!)}}</td><td>{{other.results[i]?rawAccuracy(other.results[i]!):'N/A'}}<small>{{other.config.sections[i]?.name ?? 'Không có phần tương ứng'}}</small></td></tr></tbody></table></div><p class="hint">Cùng nhóm độ khó là tự khai báo, không phải phép đo độ khó chuẩn hóa. Khác cấu hình chỉ xem dữ liệu gốc, không suy ra tiến bộ.</p></template></section>
          </template>

          <template v-if="page==='history'">
            <div class="eyebrow">NHẬT KÝ TRÊN THIẾT BỊ</div><h1 class="page-title">Lịch sử luyện tập</h1><p class="lead">{{store.attempts.length}} phiên · Mỗi lần luyện là một điểm dữ liệu, chưa phải kết luận năng lực.</p><div v-if="!store.attempts.length" class="card empty"><h2>Chưa có phiên luyện nào</h2><p>Bắt đầu từ đề sách hoặc PDF bạn đang có.</p><button class="primary" @click="go('selector')">Tạo phiên đầu tiên →</button></div><div class="history-list"><article v-for="a in store.attempts" :key="a.id" class="card history-item"><div><span class="pill">{{a.config.exam}} · {{a.config.level}}</span><h3>{{a.material}}</h3><small>{{date(a.createdAt)}} · {{a.status}} · {{format(duration(a))}}</small><p class="hint">Strategy Practice · UNVERIFIED{{a.flags.length?' · '+a.flags.join(', '):''}}</p></div><button @click="a.status==='COMPLETED'?openResult(a.id):go('timer')">{{a.status==='COMPLETED'?'Kết quả & so sánh →':'Tiếp tục →'}}</button></article></div>
          </template>
          <template v-if="page==='data'">
            <div class="eyebrow">GUEST · LOCAL-FIRST</div><h1 class="page-title">Dữ liệu thuộc về bạn</h1><p class="lead">Không có đăng nhập hay đồng bộ đám mây. IndexedDB lưu lịch sử trong trình duyệt này.</p><section class="card form-card"><h2>Backup & khôi phục</h2><p>Xóa dữ liệu trình duyệt có thể mất toàn bộ lịch sử. File export chỉ chứa exam configs, attempts, scores và events; không chứa PDF, CV hay audio. JSON chưa mã hóa: hãy giữ file ở nơi riêng tư.</p><div class="actions"><button class="primary" @click="download">Xuất backup JSON</button><label class="file-button">Nhập backup JSON<input type="file" accept="application/json,.json" @change="upload"></label></div><p class="hint">Schema v1 · Tối đa 5 MB / 500 phiên · Nhập sẽ thay thế toàn bộ dữ liệu exam sau khi kiểm tra và xác nhận.</p></section><section class="card form-card"><h2>Xóa dữ liệu local</h2><p>Xóa cả lịch sử và phiên đang làm. Xuất backup trước nếu cần giữ lại.</p><button class="danger-button" @click="clearData">Xóa toàn bộ dữ liệu exam</button></section>
          </template>
        </template>
        <footer><span>BRSE Interview Trainer</span><span>Guest-first · Không quy đổi điểm thi chuẩn hóa</span></footer>
      </main>
    </div>
  </div>
</template>
