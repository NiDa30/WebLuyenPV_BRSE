<script setup lang="ts">
import {technicalById} from '../domain/technical'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type {DashboardTarget} from '../domain/dashboard'
import ReviewQueue from './ReviewQueue.vue'
import SessionMinutes from './SessionMinutes.vue'
import {scenarios,scenarioById,isScenarioQuestion,type ScenarioId} from '../domain/scenarios'
import ScenarioContext from './ScenarioContext.vue'
import DictionaryLookup from './DictionaryLookup.vue'
import VoicePracticePanel from './VoicePracticePanel.vue'
import AiFeedbackPanel from './AiFeedbackPanel.vue'
import type { AiEvidence } from '../domain/ai-feedback'
import { useInterviewStore } from '../stores/interview'
import { questions, tracks, rubrics, questionById, reviewScore, compareInterviews, parseInterviewBackup, sessionReport, type Track, type Annotation } from '../domain/interview'
const props=defineProps<{initialTarget?:DashboardTarget}>()
const store=useInterviewStore()
const screen=ref<'bank'|'attempt'|'history'|'data'|'sessions'|'queue'>('bank'),track=ref<Track>('JOB'),query=ref(''),selectedId=ref(''),notice=ref(''),error=ref('')
const submitting=ref(false)
const dictionaryOpen=ref(false),dictionaryQuery=ref('')
const aiSelection=ref<AiEvidence|null>(null)
const selectedAnnotation=ref(''),criterionId=ref(''),quote=ref(''),note=ref(''),score=ref(1),compareId=ref('')
const current=computed(()=>store.attempts.find(a=>a.id===selectedId.value))
const sessionId=ref('')
const activeSession=computed(()=>store.sessions.find(s=>s.id===sessionId.value))
const report=computed(()=>activeSession.value?sessionReport(activeSession.value,store.attempts):null)
const parentSession=computed(()=>store.sessions.find(s=>s.id===activeSession.value?.parentId))
const sessionComparisons=computed(()=>activeSession.value&&parentSession.value?activeSession.value.attemptIds.map((id,i)=>compareSessionTurn(parentSession.value!.attemptIds[i]!,id)):[])
const containingSession=computed(()=>store.sessions.find(s=>s.attemptIds.includes(selectedId.value)))
async function startSession(parentId?:string,mode:'GUIDED'|'INDEPENDENT'='GUIDED',scenarioId?:ScenarioId){
  try{error.value='';const parent=store.sessions.find(s=>s.id===parentId);sessionId.value=await store.startSession(scenarioId?'BRSE':parent?.track??track.value,parentId,mode,scenarioId);screen.value='sessions'}catch(e){error.value=e instanceof Error?e.message:'Không lưu được phiên.'}
}
async function addQueue(criterionId:string,source:'SELF_REVIEW'|'AI_MODEL'){
  if(!current.value)return
  try{await store.queueCriterion(current.value.id,criterionId,source);notice.value='Đã lưu mục trong Hàng đợi luyện lại (mục trùng giữ nguyên).';error.value=''}catch(e){error.value=e instanceof Error?e.message:'Không thêm được mục luyện.'}
}
function openQueueRetry(target:{attemptId:string;sessionId:string|null}){if(target.sessionId)openSession(target.sessionId);else open(target.attemptId)}
function openSession(id:string){sessionId.value=id;screen.value='sessions';error.value=''}
function compareSessionTurn(beforeId:string,afterId:string){
  const result=compareInterviews(store.attempts.find(a=>a.id===beforeId)!,store.attempts.find(a=>a.id===afterId)!)
  if(isStale(beforeId)||isStale(afterId)){result.eligible=false;result.reasons.push('Ngữ cảnh hội thoại đã thay đổi; không so điểm cũ.')}
  return result
}
const contextStale=computed(()=>containingSession.value?sessionReport(containingSession.value,store.attempts).staleIds.includes(selectedId.value):false)
function isStale(id:string){const s=store.sessions.find(s=>s.attemptIds.includes(id));return !!s&&sessionReport(s,store.attempts).staleIds.includes(id)}
function canOpenTurn(i:number){return !!report.value&&(!activeSession.value?.scenarioId?i===0||report.value.turns[i-1]?.status==='REVIEWED':report.value.turns.slice(0,i).every(a=>a.status==='REVIEWED'&&!report.value!.staleIds.includes(a.id)))}
const question=computed(()=>current.value?questionById(current.value.questionId):null)
const technical=computed(()=>current.value?technicalById(current.value.questionId):undefined)
const transcript=computed(()=>current.value?.revisions.at(-1))
const criteria=computed(()=>current.value?rubrics[current.value.track].criteria:[])
const annotations=computed(()=>current.value?.feedback?.annotations??[])
const inspector=computed(()=>annotations.value.find(a=>a.id===selectedAnnotation.value)??annotations.value[0])
const highlight=computed(()=>aiSelection.value??inspector.value)
const filtered=computed(()=>questions.filter(q=>q.track===track.value && !isScenarioQuestion(q.id) && `${q.title} ${q.japanese} ${q.topic}`.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())))
const peers=computed(()=>current.value?store.attempts.filter(a=>a.rootId===current.value!.rootId && a.id!==current.value!.id):[])
const other=computed(()=>store.attempts.find(a=>a.id===compareId.value))
const comparison=computed(()=>current.value&&other.value?compareInterviews(other.value,current.value):null)
const time=(ms:number)=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`
const date=(ms:number)=>new Date(ms).toLocaleString('vi-VN')
function open(id:string){dictionaryOpen.value=false;dictionaryQuery.value='';aiSelection.value=null;selectedId.value=id;screen.value='attempt';selectedAnnotation.value='';compareId.value='';criterionId.value=store.attempts.find(a=>a.id===id)?.track==='BRSE'?'clarify':'intent';quote.value='';note.value='';notice.value='';error.value=''}
function start(id:string){try{open(store.start(id))}catch(e){error.value=e instanceof Error?e.message:'Không tạo được attempt.'}}
function retry(mode:'GUIDED'|'INDEPENDENT'){if(!current.value)return;try{const parent=current.value;open(store.start(parent.questionId,parent.id,mode))}catch(e){error.value=e instanceof Error?e.message:'Không tạo được retry.'}}
async function submit(){if(!current.value||submitting.value)return;submitting.value=true;try{error.value='';await store.submit(current.value.id);notice.value='Đã lưu transcript và feedback local. Chưa có chấm AI.'}catch(e){error.value=e instanceof Error?e.message:'Không lưu được câu trả lời.'}finally{submitting.value=false}}
async function edit(){if(!current.value || !confirm('Sửa transcript sẽ vô hiệu hóa feedback và điểm tự đánh giá hiện tại. Bạn cần gửi lại để tạo version mới. Tiếp tục?'))return;try{await store.edit(current.value.id);dictionaryOpen.value=false;dictionaryQuery.value='';aiSelection.value=null;notice.value='Feedback cũ đã vô hiệu hóa. Sửa câu trả lời rồi gửi lại.';selectedAnnotation.value='';quote.value='';note.value=''}catch(e){error.value=e instanceof Error?e.message:'Không sửa được transcript.'}}
function inspect(a:Annotation){aiSelection.value=null;selectedAnnotation.value=a.id;criterionId.value=a.criterionId}
function lookupSelection(){const text=window.getSelection()?.toString().trim()??'';if(!text||!transcript.value?.text.includes(text)||text===transcript.value.text.trim()||Array.from(text).length>50){error.value='Hãy chọn một từ/cụm từ từ 1–50 ký tự trong transcript; không gửi toàn bộ câu trả lời.';return}dictionaryQuery.value=text;dictionaryOpen.value=true;error.value=''}
function captureQuote(){const selection=window.getSelection()?.toString()??'';if(selection && transcript.value?.text.includes(selection))quote.value=selection;else error.value='Chọn một đoạn trong transcript hoặc sao chép đúng đoạn vào ô trích dẫn.'}
async function saveEvidence(){
  if(!current.value||!transcript.value)return
  const offset=transcript.value.text.indexOf(quote.value)
  if(!quote.value.trim()||offset<0){error.value='Trích dẫn phải xuất hiện chính xác trong transcript hiện tại.';return}
  try{error.value='';await store.review(current.value.id,{criterionId:criterionId.value,quote:quote.value,startOffset:offset,note:note.value,score:score.value});notice.value='Đã lưu tự đánh giá có chứng cứ. Đây không phải điểm AI/nhà tuyển dụng.';selectedAnnotation.value=annotations.value.find(a=>a.kind==='SELF_REVIEW'&&a.criterionId===criterionId.value)?.id??''}catch(e){error.value=e instanceof Error?e.message:'Không lưu được đánh giá.'}
}
function download(){const url=URL.createObjectURL(new Blob([store.exportText()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='brse-interviews.json';a.click();URL.revokeObjectURL(url)}
async function upload(e:Event){const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{
  if(file.size>5_000_000)throw new Error('File vượt 5 MB.')
  const text=await file.text();parseInterviewBackup(text)
  if(!confirm('Thay thế toàn bộ dữ liệu Interview (không đổi dữ liệu Exam)? Hãy xuất backup hiện tại trước.'))return
  await store.importText(text);selectedId.value='';notice.value='Đã khôi phục dữ liệu Interview.';error.value=''
}catch{error.value='Không nhập được: schema/version/liên kết/chứng cứ không hợp lệ hoặc không ghi được IndexedDB. File sai validation không làm mất dữ liệu hiện tại.'}finally{input.value=''}}
async function clear(){if(!confirm('Xóa toàn bộ dữ liệu Interview, gồm bản nháp, transcript, feedback và retries? Dữ liệu Exam được giữ nguyên.'))return;try{await store.clear();selectedId.value='';notice.value='Đã xóa dữ liệu Interview.'}catch{error.value='Không xóa được dữ liệu Interview.'}}
onMounted(async()=>{await store.init();const target=props.initialTarget;if(target?.kind==='INTERVIEW_DATA')screen.value='data';else if(target?.kind==='QUEUE')screen.value='queue';else if(target?.kind==='INTERVIEW_SESSION'){if(store.sessions.some(s=>s.id===target.id))openSession(target.id);else error.value='Phiên đã bị xóa hoặc thay thế; hãy chọn phiên hiện có.'}else if(target?.kind==='INTERVIEW_ATTEMPT'){if(store.attempts.some(a=>a.id===target.id))open(target.id);else error.value='Attempt đã bị xóa hoặc thay thế; hãy chọn bản hiện có.'}})
onUnmounted(()=>{void store.flush().catch(()=>{})})
</script>

<template>
  <div class="interview-workspace">
    <div class="eyebrow">TEXT INTERVIEW · GUEST LOCAL-FIRST</div>
    <h1 class="page-title">Phỏng vấn & luyện lại</h1>
    <p class="lead">Trả lời từ trải nghiệm thật. Nhìn lại chứng cứ. Thử diễn đạt độc lập.</p>
    <div class="notice">Chế độ offline: câu hỏi do ứng dụng biên soạn, feedback bằng rules và tự đánh giá. <strong>AI là tùy chọn, chỉ gửi nội dung khi bạn đồng ý trong panel AI.</strong> Không chấm ngữ pháp, giọng nói, phát âm hay năng lực tuyển dụng tự động.</div>
    <nav class="interview-tabs" aria-label="Điều hướng Interview"><button :class="{selected:screen==='bank'}" @click="screen='bank'">Kho câu hỏi</button><button :class="{selected:screen==='sessions'}" @click="screen='sessions'">Phiên nhiều lượt</button><button :class="{selected:screen==='queue'}" @click="screen='queue'">Hàng đợi luyện lại</button><button :class="{selected:screen==='history'}" @click="screen='history'">Lịch sử Interview</button><button :class="{selected:screen==='data'}" @click="screen='data'">Backup Interview</button><button v-if="current" :class="{selected:screen==='attempt'}" @click="screen='attempt'">Attempt đang xem</button></nav>
    <div v-if="store.error" class="notice danger" role="alert">{{store.error}}</div>
    <div v-if="error" class="notice danger" role="alert">{{error}}</div>
    <div v-if="notice" class="notice" role="status">{{notice}}</div>
    <p class="hint" role="status">{{store.busy?'Đang lưu Interview…':store.saved?'Đã lưu Interview trên thiết bị':'Bản nháp chưa được lưu hoàn tất'}}</p>
    <div v-if="!store.ready" class="card">Đang mở dữ liệu Interview…</div>
    <template v-else>
      <ReviewQueue v-if="screen==='queue'" @open-source="open" @open-retry="openQueueRetry"/>
      <template v-if="screen==='bank'">
        <div class="card form-card"><div class="field-row"><label>Track luyện tập<select v-model="track"><option value="JOB">Track A · Phỏng vấn IT / SE / BrSE</option><option value="BRSE">Track B · Role-play khách hàng Nhật</option></select></label><label>Tìm câu hỏi<input v-model="query" maxlength="100" placeholder="Dự án, API, yêu cầu…"></label></div><p class="hint">{{rubrics[track].version}} · Rubric tự luyện riêng theo track. Nguồn AUTHOR_CREATED · Nội dung tự biên soạn.</p></div>
        <section class="card form-card"><h2>Phiên 3 lượt cùng track</h2><p>Kịch bản cố định gồm 3 câu tự biên soạn theo track đang chọn. Lưu từng lượt; xem feedback và retry toàn phiên sau khi hoàn tất.</p><button class="primary" :disabled="store.busy||store.loadFailed" @click="startSession()">Bắt đầu phiên 3 lượt</button></section>
        <template v-if="track==='BRSE'"><section v-for="scenario in scenarios" :key="scenario.id" class="card form-card"><span class="pill">BRSE · HỘI THOẠI XUYÊN SUỐT</span><h2>{{scenario.title}}</h2><p>{{scenario.brief}}</p><button class="primary" :disabled="store.busy||store.loadFailed" @click="startSession(undefined,'GUIDED',scenario.id as ScenarioId)">{{scenario.id==='csv-change-v1'?'Bắt đầu tình huống CSV':'Bắt đầu tình huống production'}}</button></section></template>
        <div class="question-grid"><article v-for="q in filtered" :key="q.id" class="card question-card"><span class="pill">{{q.topic}} · AUTHOR_CREATED</span><h2>{{q.title}}</h2><p lang="ja" class="jp-question">{{q.japanese}}</p><p>{{q.intent}}</p><button class="primary" :disabled="store.loadFailed" @click="start(q.id)">Luyện câu này →</button></article></div>
        <div v-if="!filtered.length" class="card empty">Không có câu hỏi phù hợp. Hãy thử từ khóa khác.</div>
      </template>

      <template v-if="screen==='sessions'">
        <section v-if="activeSession && report" class="card form-card" data-testid="session-report">
          <h2>Báo cáo phiên 3 lượt</h2><p v-if="activeSession.scenarioId" class="pill">{{scenarioById(activeSession.scenarioId).title}} · kịch bản khách hàng xuyên suốt</p><p>{{tracks[activeSession.track]}} · {{activeSession.mode}} · {{report.reviewed}}/3 lượt đã gửi</p>
          <p class="notice">{{report.complete?'Đã hoàn tất transcript cả 3 lượt.':'Phiên đang thực hiện; có thể rời trang rồi tiếp tục.'}} Điểm dưới đây là tự đánh giá, không phải điểm AI hay kết luận tuyển dụng.</p>
          <p v-if="report.staleIds.length" class="notice danger" role="alert">Ngữ cảnh đã thay đổi ở {{report.staleIds.length}} lượt. Mở từng lượt từ trước đến sau, sửa transcript và gửi lại để rà soát theo ngữ cảnh mới.</p>
          <p><strong>Tự đánh giá toàn phiên: {{report.selfScore??'N/A'}}{{report.selfScore!==null?' / 100':''}}</strong></p>
          <p class="hint">Trung bình đều 3 lượt, chỉ hiện khi cả 9 tiêu chí có điểm và chứng cứ. Sửa một transcript sẽ làm tổng trở về N/A cho đến khi đánh giá lại.</p>
          <article v-for="(a,i) in report.turns" :key="a.id" class="mode-box">
            <h3>Lượt {{i+1}} · {{questionById(a.questionId).title}}</h3><p>{{report.staleIds.includes(a.id)?'CẦN RÀ SOÁT NGỮ CẢNH':a.status==='DRAFT'?'Chưa gửi / đang sửa':'Đã gửi · transcript v'+a.revisions.length}} · Tự đánh giá {{report.staleIds.includes(a.id)?'N/A (ngữ cảnh cũ)':reviewScore(a)??'N/A'}}</p>
            <template v-if="a.status==='REVIEWED'"><p v-for="c in rubrics[a.track].criteria" :key="c.id">{{c.name}}: {{a.reviews.find(r=>r.criterionId===c.id)?.score??'N/A'}} / 3 · {{a.reviews.find(r=>r.criterionId===c.id)?.note??c.hint}}</p></template>
            <button :disabled="!canOpenTurn(i)" @click="open(a.id)">{{a.status==='DRAFT'?'Trả lời lượt':'Mở chứng cứ lượt'}} {{i+1}}</button>
          </article>
          <div v-if="report.complete" class="actions"><button :disabled="store.busy" @click="startSession(activeSession.id,'GUIDED')">Guided Retry toàn phiên</button><button class="primary" :disabled="store.busy" @click="startSession(activeSession.id,'INDEPENDENT')">Independent Retry toàn phiên</button></div>
          <section v-if="parentSession && report.complete"><h3>Đối chiếu phiên cha theo từng lượt</h3><div v-for="(comparison,i) in sessionComparisons" :key="i" class="mode-box"><strong>Lượt {{i+1}} · {{comparison.eligible?'Cùng baseline; đối chiếu tự đánh giá':'Không kết luận tiến bộ độc lập'}}</strong><ul><li v-for="reason in comparison.reasons" :key="reason">{{reason}}</li></ul><p v-for="d in comparison.deltas" :key="d.id">{{d.name}}: {{d.before?.score??'N/A'}} → {{d.after?.score??'N/A'}} / 3 · Chênh {{comparison.eligible && d.delta!==null?d.delta:'N/A'}}</p></div></section>
          <p v-if="activeSession.parentId" class="hint">Retry liên kết từng lượt với phiên cha và version transcript gốc; guided không chứng minh tiến bộ độc lập.</p>
        </section>
        <SessionMinutes v-if="activeSession?.scenarioId" :key="activeSession.id" :session-id="activeSession.id" @open-evidence="open"/>
        <section class="card form-card"><h2>Các phiên đã lưu · {{store.sessions.length}}</h2><p v-if="!store.sessions.length">Chưa có phiên. Bắt đầu tại kho câu hỏi.</p><div v-for="s in store.sessions" :key="s.id" class="section-heading"><span>{{s.scenarioId?scenarioById(s.scenarioId).title:tracks[s.track]}} · {{s.mode}} · {{date(s.createdAt)}} · {{sessionReport(s,store.attempts).reviewed}}/3</span><button @click="openSession(s.id)">Mở phiên</button></div></section>
      </template>

      <template v-if="screen==='attempt' && current && question">
        <button v-if="containingSession" @click="openSession(containingSession.id)">← Báo cáo phiên · chọn lượt tiếp theo</button>
        <ScenarioContext v-if="containingSession?.scenarioId" :session-id="containingSession.id" :attempt-id="current.id"/>
        <div class="section-heading"><span class="pill">{{tracks[current.track]}} · {{current.mode}}</span><span>{{current.rubricVersion}}</span></div>
        <section v-if="technical" class="card form-card" data-testid="technical-reference"><h2>Technical Drill · {{technical.topic}}</h2><p>AUTHOR_CREATED · technical-drill-v1. Bài tập giả định; hãy nói rõ phần đã làm, phần đề xuất và điều chưa kiểm chứng. Rubric {{current.rubricVersion}} chỉ hỗ trợ tự review cách giải thích; không tự xác minh tính đúng kỹ thuật, chạy code/SQL hoặc audit bảo mật.</p><template v-if="current.mode!=='INDEPENDENT'||current.status==='REVIEWED'"><details><summary>Điểm đối chiếu kỹ thuật tự biên soạn</summary><ul><li v-for="point in technical.referencePoints" :key="point">{{point}}</li></ul></details></template><p v-else>Chế độ độc lập ẩn điểm đối chiếu đến khi gửi câu trả lời.</p></section>
        <section class="card form-card"><h2>{{question.title}}</h2><p class="jp-question" lang="ja">{{current.prompt}}</p><p v-if="current.mode!=='INDEPENDENT' || current.status!=='DRAFT'">{{question.intent}}</p>
          <template v-if="current.status==='DRAFT'">
            <div v-if="current.mode==='INDEPENDENT'" class="notice">Independent Retry: không hiện gợi ý hoặc câu trả lời của lần luyện trước trong màn hình soạn thảo. Đây là luyện tự giác, không phải chế độ giám sát thi.</div>
            <div v-else-if="current.mode==='GUIDED'" class="mode-box"><h3>Gợi ý Guided Retry</h3><ul><li v-for="hint in question.hints" :key="hint">{{hint}}</li></ul><p class="hint">Chỉ dùng chi tiết thật. Các gợi ý không khẳng định bạn đã làm công việc nào.</p></div>
            <details v-else><summary>Xem hướng dẫn trả lời (tự luyện có hỗ trợ)</summary><ul><li v-for="hint in question.hints" :key="hint">{{hint}}</li></ul></details>
            <VoicePracticePanel :key="current.id" :attempt-id="current.id" :prompt="current.prompt"/>
            <form @submit.prevent="submit"><label>Câu trả lời tiếng Nhật (text)<textarea :value="current.draft" @input="store.draft(current.id,($event.target as HTMLTextAreaElement).value)" maxlength="10000" rows="8" required placeholder="Viết câu trả lời của bạn…"></textarea></label><p class="hint">{{current.draft.length}} / 10.000 ký tự · Nháp tự lưu sau khi ngừng gõ. {{containingSession?'Timestamp tính từ lúc tạo phiên, gồm cả thời gian chờ lượt.':'Timestamp tính từ lúc tạo câu hỏi.'}} Không phải thời gian nói.</p><button class="primary" :disabled="!current.draft.trim()||submitting">Gửi câu trả lời & xem feedback →</button></form>
            <p v-if="current.revisions.length" class="hint">Đang chỉnh sau transcript v{{current.revisions.length}}. Điểm/feedback trước đã vô hiệu hóa.</p>
          </template>
          <template v-else-if="transcript">
            <div class="section-heading"><h3>Transcript v{{transcript.version}}</h3><button @click="edit">Sửa transcript</button></div>
            <p v-if="transcript.voice" class="hint">Có nội dung nhận dạng tiếng Nhật của trình duyệt đã được người học kiểm tra ({{transcript.voice.mergeMode}}). Không có audio lưu kèm; confidence không phải điểm phát âm.</p>
            <p class="hint">CANDIDATE · 0:00–{{time(transcript.endMs)}} {{containingSession?'từ lúc tạo phiên đến gửi text (gồm thời gian chờ lượt)':'từ lúc tạo câu hỏi đến gửi text'}}; không gán timestamp cho từng từ hoặc suy ra tốc độ nói.</p>
            <div class="transcript" data-testid="interview-transcript" tabindex="0"><template v-if="highlight">{{transcript.text.slice(0,highlight.startOffset)}}<mark>{{highlight.quote}}</mark>{{transcript.text.slice(highlight.endOffset)}}</template><template v-else>{{transcript.text}}</template></div>
            <div class="actions"><button @mousedown.prevent @click="lookupSelection">Tra cụm đang chọn trong transcript</button><button @click="dictionaryOpen=!dictionaryOpen">{{dictionaryOpen?'Đóng tra từ trong feedback':'Mở tra từ trong feedback'}}</button></div>
            <div v-if="dictionaryOpen" class="feedback-dictionary"><DictionaryLookup :initial-query="dictionaryQuery" :context-label="'Transcript v'+transcript.version+' · '+current.rubricVersion"/></div>
          </template>
        </section>

        <template v-if="current.status==='REVIEWED' && transcript">
          <div class="feedback-grid"><section class="card form-card"><h2>Feedback & rubric</h2><p class="hint">LOCAL_RULES_V1 · REVIEW_PROMPT là câu hỏi rà soát, không phải kết luận chấm thiếu. SELF_REPORTED là đánh giá của chính bạn.</p><div class="rubric-summary"><strong>{{contextStale?'Điểm lịch sử (ngữ cảnh cũ)':'Điểm tự đánh giá'}}: {{reviewScore(current)??'N/A'}}{{reviewScore(current)!==null?' / 100':''}}</strong><small>Chỉ tổng hợp khi cả 3 tiêu chí có điểm và chứng cứ. Không phải điểm AI hay thước đo tuyển dụng được kiểm chứng.</small></div>
            <div v-for="c in criteria" :key="c.id" class="rubric-row"><strong>{{c.name}} · {{c.weight}}%</strong><span>{{current.reviews.find(r=>r.criterionId===c.id)?.score??'N/A'}} / 3</span><p>{{c.hint}}</p><button v-if="!contextStale && current.reviews.some(r=>r.criterionId===c.id)" :disabled="store.busy" @click="addQueue(c.id,'SELF_REVIEW')">Đưa tiêu chí này vào hàng đợi</button></div>
            <p class="hint">Tiếng Nhật tự nhiên/ngữ pháp: N/A · Phát âm/âm thanh: N/A · Etiquette video: N/A.</p>
            <button v-for="a in annotations" :key="a.id" class="annotation-button" :class="{selected:inspector?.id===a.id}" @click="inspect(a)"><span class="pill">{{a.kind}} · {{a.certainty}}</span><strong>{{criteria.find(c=>c.id===a.criterionId)?.name}}</strong><span>{{a.reason}}</span></button>
          </section>
          <section class="card form-card" v-if="inspector"><h2>Evidence Inspector</h2><p class="hint">{{inspector.utteranceId.slice(0,8)}} · transcript v{{inspector.transcriptVersion}} · criterion {{inspector.criterionId}}</p><blockquote>{{inspector.quote}}</blockquote><p class="hint">Mốc utterance: {{time(inspector.startMs)}}–{{time(inspector.endMs)}} · Vị trí ký tự {{inspector.startOffset}}–{{inspector.endOffset}}. Mốc thời gian của cả câu trả lời text, không phải alignment audio.</p><h3>Vì sao hiển thị</h3><p>{{inspector.reason}}</p><h3>Hành động đề xuất</h3><p>{{inspector.suggestion}}</p>
            <details><summary>Gợi ý cấu trúc từ câu hỏi</summary><ul><li v-for="hint in question.hints" :key="hint">{{hint}}</li></ul><p class="hint">Không có đáp án cá nhân hóa bịa từ CV. Hãy điền sự kiện do bạn xác nhận.</p></details>
          </section></div>
          <p v-if="containingSession?.scenarioId" class="notice">AI từng lượt chỉ nhận câu hỏi và câu trả lời hiện tại khi có đồng ý riêng; chưa đánh giá toàn hội thoại hoặc tính nhất quán với các lượt trước.</p>
          <AiFeedbackPanel v-if="!contextStale" :attempt="current" @select-evidence="aiSelection=$event" @queue-criterion="addQueue($event,'AI_MODEL')"/>
          <section v-if="!contextStale" class="card form-card"><h2>Tự đánh giá có chứng cứ</h2><p class="hint">Thang tự luyện: 0 chưa thể hiện theo tự nhận định · 1 một phần · 2 rõ · 3 rõ và cụ thể. Mọi điểm, kể cả 0, cần trích dẫn và giải thích. Không xác minh tính đúng của trải nghiệm/tiếng Nhật.</p>
            <form @submit.prevent="saveEvidence"><div class="field-row"><label>Tiêu chí rubric<select v-model="criterionId"><option v-for="c in criteria" :key="c.id" :value="c.id">{{c.name}}</option></select></label><label>Điểm tự đánh giá<select v-model.number="score"><option :value="0">0 · Chưa thể hiện</option><option :value="1">1 · Một phần</option><option :value="2">2 · Rõ</option><option :value="3">3 · Rõ và cụ thể</option></select></label></div><button type="button" @click="captureQuote">Dùng đoạn đang chọn trong transcript</button><label>Trích dẫn chính xác từ transcript<textarea v-model="quote" rows="2" maxlength="10000" required></textarea></label><label>Giải thích điểm & việc cần sửa<textarea v-model="note" rows="2" maxlength="1000" required placeholder="Vì sao đoạn trên đáp ứng/chưa đáp ứng tiêu chí? Lần sau sửa gì?"></textarea></label><button class="primary" :disabled="store.busy">Lưu tự đánh giá có chứng cứ</button></form>
          </section>
          <section v-if="!containingSession?.scenarioId" class="card form-card"><h2>Luyện lại thành một attempt mới</h2><p>Guided có gợi ý. Independent đổi cách hỏi, ẩn hỗ trợ trong màn hình trả lời. Hai kiểu không được trộn để kết luận khả năng tự trả lời.</p><div class="actions"><button @click="retry('GUIDED')">Guided Retry</button><button class="primary" @click="retry('INDEPENDENT')">Independent Retry</button></div><p class="hint">Câu đào sâu tham khảo (tự biên soạn, chưa adaptive AI): <span lang="ja">{{question.followUp}}</span></p></section>
          <section v-if="peers.length && !containingSession?.scenarioId" class="card form-card"><h2>Đối chiếu attempts & chứng cứ</h2><label>Attempt trước để đối chiếu<select v-model="compareId"><option value="">Chọn một attempt…</option><option v-for="a in peers" :key="a.id" :value="a.id">{{a.mode}} · {{date(a.createdAt)}} · {{a.status}}</option></select></label><template v-if="comparison && other"><p :class="comparison.eligible?'success':'error'">{{comparison.eligible?'CÙNG RUBRIC · Có thể đối chiếu tự đánh giá':'KHÔNG SO SÁNH TIẾN BỘ ĐỘC LẬP'}}</p><ul><li v-for="reason in comparison.reasons" :key="reason">{{reason}}</li></ul><p class="hint">Dù tương thích, điểm vẫn là tự chấm; không tự gán mastery. Điểm khác nhau không chứng minh tác động của guided/independent.</p><div class="table-wrap"><table><thead><tr><th>Tiêu chí</th><th>Attempt được chọn · {{other.mode}}</th><th>Attempt hiện tại · {{current.mode}}</th><th>Chênh tự đánh giá</th></tr></thead><tbody><tr v-for="d in comparison.deltas" :key="d.id"><th>{{d.name}}</th><td>{{d.before?.score??'N/A'}} / 3<blockquote>{{d.before?.quote??'Chưa có chứng cứ'}}</blockquote></td><td>{{d.after?.score??'N/A'}} / 3<blockquote>{{d.after?.quote??'Chưa có chứng cứ'}}</blockquote></td><td>{{d.delta===null?'N/A':d.delta>0?'+'+d.delta:d.delta}}</td></tr></tbody></table></div></template></section>
        </template>
      </template>

      <template v-if="screen==='history'">
        <h2>Lịch sử Interview · {{store.attempts.length}} attempts</h2><div v-if="!store.attempts.length" class="card empty">Chưa có Interview. Chọn câu hỏi để bắt đầu.</div><div class="history-list"><article class="card history-item" v-for="a in store.attempts" :key="a.id"><div><span class="pill">{{a.track}} · {{a.mode}} · {{a.status}}</span><h3>{{questionById(a.questionId).title}}</h3><small>{{date(a.createdAt)}} · {{a.rubricVersion}} · transcript v{{a.revisions.length}}</small><p class="hint">Tự đánh giá {{isStale(a.id)?'N/A · Ngữ cảnh cũ':reviewScore(a)??'N/A'}} · {{a.reviews.length}}/3 tiêu chí có chứng cứ</p></div><button @click="open(a.id)">{{a.status==='DRAFT'?'Tiếp tục bản nháp':'Mở feedback & retry'}} →</button></article></div>
      </template>
      <template v-if="screen==='data'">
        <section class="card form-card"><h2>Backup Interview riêng biệt</h2><p>JSON chứa câu trả lời, lịch sử sửa, tự đánh giá, phiên nhiều lượt, hàng đợi luyện lại và liên kết retry. Không chứa CV/audio/PDF. Đây là dữ liệu cá nhân: backup chưa mã hóa, hãy giữ riêng tư. Chức năng backup Exam vẫn độc lập.</p><div class="actions"><button class="primary" @click="download">Xuất Interview JSON</button><label class="file-button">Nhập Interview JSON<input type="file" accept="application/json,.json" @change="upload"></label></div><p class="hint">Schema v1 · Tối đa 5 MB / 300 attempts. File có chứng cứ sai hoặc retry thiếu phiên gốc sẽ bị từ chối.</p></section><section class="card form-card"><h2>Xóa dữ liệu Interview</h2><p>Chỉ xóa Interview trên thiết bị này; không xóa Exam.</p><button class="danger-button" @click="clear">Xóa toàn bộ Interview</button></section>
      </template>
    </template>
  </div>
</template>
