<script setup lang="ts">
import {computed,ref,watch,toRaw} from 'vue'
import {useInterviewStore} from '../stores/interview'
import {sessionReport} from '../domain/interview'
import {minuteKinds,minutesState,type MinuteEntry,type Minutes} from '../domain/minutes'
const props=defineProps<{sessionId:string}>()
const emit=defineEmits<{openEvidence:[id:string]}>()
const store=useInterviewStore()
const session=computed(()=>store.sessions.find(s=>s.id===props.sessionId)!)
const report=computed(()=>sessionReport(session.value,store.attempts))
const minutes=computed<Minutes>(()=>session.value.minutes??{status:'DRAFT',entries:[],reviewedVersions:[]})
const state=computed(()=>minutesState(minutes.value,session.value,store.attempts))
const sources=computed(()=>report.value.turns.filter(a=>a.status==='REVIEWED'&&!report.value.staleIds.includes(a.id)))
const editId=ref(''),kind=ref<MinuteEntry['kind']>('SCOPE'),text=ref(''),owner=ref(''),due=ref(''),confirmation=ref<MinuteEntry['confirmation']>('PROPOSED'),attemptId=ref(''),source=ref<'CANDIDATE'|'CUSTOMER'>('CANDIDATE'),quote=ref(''),message=ref(''),error=ref('')
const selected=computed(()=>sources.value.find(a=>a.id===attemptId.value))
const sourceText=computed(()=>source.value==='CUSTOMER'?selected.value?.prompt??'':selected.value?.revisions.at(-1)?.text??'')
function reset(){editId.value='';kind.value='SCOPE';text.value='';owner.value='';due.value='';confirmation.value='PROPOSED';attemptId.value='';source.value='CANDIDATE';quote.value=''}
watch(()=>props.sessionId,()=>{reset();message.value='';error.value=''})
function edit(entry:MinuteEntry){editId.value=entry.id;kind.value=entry.kind;text.value=entry.text;owner.value=entry.owner;due.value=entry.due;confirmation.value=entry.confirmation;attemptId.value=entry.evidence.attemptId;source.value=entry.evidence.source;quote.value=entry.evidence.quote;message.value='Đang sửa mục; hãy đối chiếu với nguồn hiện tại trước khi lưu.';error.value=''}
async function save(){
  try{error.value='';if(!selected.value||!quote.value.trim())throw new Error('Chọn lượt hiện hành và trích dẫn chính xác.')
    const offset=sourceText.value.indexOf(quote.value);if(offset<0)throw new Error('Trích dẫn không khớp nguồn hiện tại.')
    const entry:MinuteEntry={id:editId.value||crypto.randomUUID(),kind:kind.value,text:text.value,owner:owner.value,due:due.value,confirmation:confirmation.value,evidence:{attemptId:attemptId.value,version:selected.value.revisions.at(-1)!.version,source:source.value,quote:quote.value,startOffset:offset,endOffset:offset+quote.value.length}}
    const entries=structuredClone(toRaw(minutes.value.entries));const index=entries.findIndex(e=>e.id===entry.id);if(index<0)entries.push(entry);else entries[index]=entry
    await store.saveMinutes(props.sessionId,{status:'DRAFT',entries,reviewedVersions:[]});reset();message.value='Đã lưu mục biên bản trên thiết bị; cần rà soát lại trước khi xuất.'
  }catch(e){error.value=e instanceof Error?e.message:'Không lưu được biên bản.'}
}
async function remove(id:string){if(!confirm('Xóa mục biên bản này? Transcript và điểm tự đánh giá được giữ nguyên.'))return;try{await store.saveMinutes(props.sessionId,{status:'DRAFT',entries:structuredClone(toRaw(minutes.value.entries.filter(e=>e.id!==id))),reviewedVersions:[]});reset();message.value='Đã xóa mục.';error.value=''}catch{error.value='Không xóa được mục biên bản.'}}
async function review(){try{await store.reviewMinutes(props.sessionId);message.value='Đã ghi nhận người học rà soát biên bản theo version hiện tại. Không phải khách hàng xác nhận.';error.value=''}catch(e){error.value=e instanceof Error?e.message:'Không rà soát được biên bản.'}}
function download(){try{const text=store.minutesText(props.sessionId),url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='brse-minutes.txt';a.click();URL.revokeObjectURL(url);error.value=''}catch(e){error.value=e instanceof Error?e.message:'Không xuất được biên bản.'}}
</script>
<template>
  <section class="card form-card session-minutes" data-testid="session-minutes">
    <h2>Biên bản chốt trao đổi</h2>
    <p>Ghi phạm vi, quyết định, hành động và câu hỏi còn mở, kèm chứng cứ. “Đã xác nhận” do bạn tự khai; trích dẫn đúng không chứng minh diễn giải đúng. Không tự gửi cho khách hoặc AI.</p>
    <p class="hint">Tối đa 12 mục. Nội dung đang gõ chỉ lưu khi chọn Lưu mục biên bản. Backup Interview gồm các mục đã lưu; bản TXT chỉ xuất sau khi rà soát với toàn hội thoại hiện hành.</p>
    <p v-if="minutes.status==='REVIEWED' && !state.exportable" class="notice danger" role="alert">Biên bản cần rà soát lại: nguồn hoặc ngữ cảnh hội thoại đã thay đổi. Bản đã rà soát cũ không thể xuất.</p>
    <p class="pill">{{state.exportable?'ĐÃ RÀ SOÁT · TỰ KHAI':minutes.entries.length?'BẢN NHÁP / CẦN RÀ SOÁT':'CHƯA CÓ MỤC'}}</p>
    <p v-if="error" class="notice danger" role="alert">{{error}}</p><p v-if="message" role="status">{{message}}</p>
    <article v-for="entry in minutes.entries" :key="entry.id" class="mode-box">
      <h3>{{minuteKinds[entry.kind]}} · {{entry.confirmation==='CONFIRMED'?'Đã xác nhận (tự khai)':entry.confirmation==='PROPOSED'?'Đề xuất':'Chưa xác định'}}</h3>
      <p>{{entry.text}}</p><p>Phụ trách: {{entry.owner||'Chưa xác định'}} · Mốc: {{entry.due||'Chưa xác định'}}</p>
      <blockquote>{{entry.evidence.quote}}</blockquote><p class="hint">{{entry.evidence.source==='CUSTOMER'?'Lời khách trong kịch bản':'Câu trả lời của bạn'}} · v{{entry.evidence.version}} · ký tự {{entry.evidence.startOffset}}–{{entry.evidence.endOffset}} {{state.staleIds.includes(entry.id)?'· NGUỒN ĐÃ THAY ĐỔI':''}}</p>
      <div class="actions"><button @click="emit('openEvidence',entry.evidence.attemptId)">Mở lượt chứng cứ</button><button :disabled="store.busy" @click="edit(entry)">Sửa mục</button><button :disabled="store.busy" @click="remove(entry.id)">Xóa mục</button></div>
    </article>
    <form @submit.prevent="save">
      <h3>{{editId?'Sửa mục biên bản':'Thêm mục có chứng cứ'}}</h3>
      <div class="field-row"><label>Loại mục<select v-model="kind"><option v-for="(label,key) in minuteKinds" :key="key" :value="key">{{label}}</option></select></label><label>Mức xác nhận (tự khai)<select v-model="confirmation"><option value="PROPOSED">Đề xuất</option><option value="CONFIRMED">Đã xác nhận (tự khai)</option><option value="UNKNOWN">Chưa xác định</option></select></label></div>
      <label>Nội dung biên bản<textarea v-model="text" maxlength="1000" rows="2" required></textarea></label>
      <div class="field-row"><label>Người phụ trách<input v-model="owner" maxlength="120" :required="kind==='ACTION'" placeholder="Chưa xác nhận / đầu mối đề xuất"></label><label>Mốc phản hồi / hạn<input v-model="due" maxlength="120" :required="kind==='ACTION'" placeholder="Chưa xác nhận / mốc đề xuất"></label></div>
      <div class="field-row"><label>Lượt chứng cứ<select v-model="attemptId" required><option value="">Chọn lượt đã gửi, ngữ cảnh hiện hành…</option><option v-for="a in sources" :key="a.id" :value="a.id">Lượt {{session.attemptIds.indexOf(a.id)+1}} · transcript v{{a.revisions.length}}</option></select></label><label>Nguồn trích dẫn<select v-model="source"><option value="CANDIDATE">Câu trả lời của bạn</option><option value="CUSTOMER">Lời khách trong kịch bản</option></select></label></div>
      <label>Nội dung nguồn hiện tại<textarea :value="sourceText" rows="3" readonly></textarea></label>
      <label>Trích dẫn cho biên bản<textarea v-model="quote" rows="2" maxlength="10000" required placeholder="Sao chép đúng đoạn từ nguồn phía trên"></textarea></label>
      <div class="actions"><button class="primary" :disabled="store.busy||!sources.length">Lưu mục biên bản</button><button v-if="editId" type="button" @click="reset">Hủy sửa mục</button></div>
    </form>
    <div class="actions"><button :disabled="store.busy||!report.complete||!minutes.entries.length" @click="review">Đánh dấu đã rà soát biên bản</button><button :disabled="!state.exportable||store.busy" @click="download">Xuất biên bản TXT</button></div>
  </section>
</template>
