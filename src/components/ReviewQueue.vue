<script setup lang="ts">
import {computed,ref} from 'vue'
import {useInterviewStore} from '../stores/interview'
import {questions,rubrics} from '../domain/interview'
import {queueState} from '../domain/review-queue'
const store=useInterviewStore()
const emit=defineEmits<{openSource:[id:string];openRetry:[target:{attemptId:string;sessionId:string|null}]}>()
const status=ref('OPEN'),track=ref('ALL'),editId=ref(''),nextStep=ref(''),priority=ref<'NORMAL'|'HIGH'>('NORMAL'),error=ref(''),notice=ref('')
const rows=computed(()=>store.reviewQueue.map(item=>({item,state:queueState(item,store.attempts,store.sessions)})).filter(({item,state})=>(track.value==='ALL'||state.source?.track===track.value)&&(status.value==='ALL'||status.value==='STALE'&&state.stale||item.status===status.value)).sort((a,b)=>Number(b.item.priority==='HIGH')-Number(a.item.priority==='HIGH')||a.item.createdAt-b.item.createdAt))
async function run(id:string,mode:'GUIDED'|'INDEPENDENT'){try{error.value='';const target=await store.retryQueue(id,mode);emit('openRetry',target)}catch(e){error.value=e instanceof Error?e.message:'Không tạo được retry.'}}
async function finish(id:string,done:boolean){try{error.value='';await store.finishQueue(id,done);notice.value=done?'Đã tự đánh dấu đã luyện. Không có xác nhận mastery hoặc điểm tiến bộ tự động.':'Đã mở lại mục.'}catch(e){error.value=e instanceof Error?e.message:'Không cập nhật được.'}}
function edit(id:string){const item=store.reviewQueue.find(i=>i.id===id)!;editId.value=id;nextStep.value=item.nextStep;priority.value=item.priority}
async function save(){try{await store.planQueue(editId.value,nextStep.value,priority.value);editId.value='';error.value='';notice.value='Đã lưu kế hoạch luyện lại.'}catch{error.value='Hành động cần từ 1–1.000 ký tự; chưa thay đổi kế hoạch đã lưu.'}}
async function remove(id:string){if(!confirm('Xóa mục khỏi hàng đợi? Transcript, điểm và các retry vẫn được giữ.'))return;try{await store.removeQueue(id);notice.value='Đã xóa mục hàng đợi.';error.value=''}catch{error.value='Không xóa được mục.'}}
</script>
<template>
  <section data-testid="review-queue">
    <h2>Hàng đợi luyện lại</h2><p>Chọn việc cần sửa từ chứng cứ của bạn hoặc AI. Không tự kết luận năng lực từ điểm tự chấm, guided retry hoặc việc đánh dấu đã luyện.</p>
    <div class="card form-card"><div class="field-row"><label>Trạng thái hàng đợi<select v-model="status"><option value="OPEN">Đang mở</option><option value="DONE">Đã luyện (tự khai)</option><option value="STALE">Nguồn đã thay đổi</option><option value="ALL">Tất cả</option></select></label><label>Track trong hàng đợi<select v-model="track"><option value="ALL">Cả hai track</option><option value="JOB">Phỏng vấn IT/SE/BrSE</option><option value="BRSE">Role-play khách Nhật</option></select></label></div><p class="hint">{{store.reviewQueue.length}} mục đã lưu · tối đa 300 mục / 10 retry mỗi mục. Ưu tiên cao hiện trước; chưa có SRS hoặc lịch tự động.</p></div>
    <p v-if="error" class="notice danger" role="alert">{{error}}</p><p v-if="notice" role="status">{{notice}}</p>
    <div v-if="!rows.length" class="card empty">Không có mục phù hợp. Mở feedback, tự đánh giá có chứng cứ rồi chọn tiêu chí để thêm.</div>
    <article v-for="{item,state} in rows" :key="item.id" class="card form-card" data-testid="queue-item">
      <span class="pill">{{state.source?.track}} · {{item.snapshot.source}} · {{item.priority==='HIGH'?'ƯU TIÊN CAO':'BÌNH THƯỜNG'}} · {{item.status==='DONE'?'ĐÃ LUYỆN (TỰ KHAI)':'ĐANG MỞ'}}</span>
      <h3>{{questions.find(q=>q.id===state.source?.questionId)?.title}} · {{state.source?rubrics[state.source.track].criteria.find(c=>c.id===item.criterionId)?.name:''}}</h3>
      <p v-if="state.stale" class="notice danger" role="alert">Nguồn đã thay đổi. Snapshot dưới đây thuộc version cũ; rà soát feedback hiện tại rồi thêm mục mới. Không tự gán trích dẫn cũ vào version mới.</p>
      <p class="hint">Snapshot khi thêm · transcript v{{item.version}} · ký tự {{item.snapshot.startOffset}}–{{item.snapshot.endOffset}} · điểm {{item.snapshot.score??'N/A'}} / 3. {{item.snapshot.source==='AI_MODEL'?item.snapshot.provider+' / '+item.snapshot.model:'Do người học tự đánh giá'}}.</p>
      <blockquote>{{item.snapshot.quote}}</blockquote><p>{{item.snapshot.reason}}</p><p><strong>Việc muốn sửa:</strong> {{item.nextStep}}</p>
      <p class="hint">{{item.retries.length}} / 10 lần luyện liên kết. {{state.target?'Lần gần nhất: '+state.target.mode+' · '+state.target.status:'Chưa tạo retry.'}} {{item.status==='DONE'&&!state.canFinish?'Nguồn hoặc retry không còn hiện hành; dấu đã luyện chỉ là lịch sử tự khai.':''}}</p>
      <div class="actions"><button @click="emit('openSource',item.attemptId)">Mở nguồn hiện tại</button><button :disabled="store.busy" @click="edit(item.id)">Sửa kế hoạch</button><button :disabled="store.busy" @click="remove(item.id)">Xóa mục hàng đợi</button></div>
      <form v-if="editId===item.id" @submit.prevent="save"><label>Hành động lần tới<textarea v-model="nextStep" maxlength="1000" required rows="2"></textarea></label><label>Ưu tiên mục<select v-model="priority"><option value="NORMAL">Bình thường</option><option value="HIGH">Cao</option></select></label><div class="actions"><button class="primary" :disabled="store.busy">Lưu kế hoạch luyện lại</button><button type="button" @click="editId=''">Hủy sửa kế hoạch</button></div></form>
      <p v-if="state.source && store.sessions.some(s=>s.scenarioId&&s.attemptIds.includes(item.attemptId))" class="hint">Cần hoàn tất phiên nguồn; retry sẽ tạo lại toàn bộ tình huống để giữ ngữ cảnh.</p>
      <div class="actions"><button :disabled="store.busy||state.stale||item.retries.length>=10||!!state.target&&!state.retryComplete" @click="run(item.id,'GUIDED')">Guided từ hàng đợi</button><button :disabled="store.busy||state.stale||item.retries.length>=10||!!state.target&&!state.retryComplete" @click="run(item.id,'INDEPENDENT')">Independent từ hàng đợi</button><button v-if="item.retries.length" @click="emit('openRetry',item.retries[item.retries.length-1]!)">Mở retry gần nhất</button><button v-if="item.status==='OPEN'" :disabled="store.busy||!state.canFinish" @click="finish(item.id,true)">Tự đánh dấu đã luyện</button><button v-else :disabled="store.busy" @click="finish(item.id,false)">Mở lại mục luyện</button></div>
    </article>
  </section>
</template>
