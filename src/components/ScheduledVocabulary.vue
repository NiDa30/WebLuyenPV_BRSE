<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,watch} from 'vue'
import {useVocabularyStore} from '../stores/vocabulary'
import {flashcardBack,reviewState,cardContentKey} from '../domain/vocabulary'
import {grades,gradeLabels,nextInterval,dayMs,type Grade} from '../domain/spaced-review'
const store=useVocabularyStore(),clock=ref(Date.now()),activeId=ref(''),revealed=ref(false),busy=ref(false),message=ref(''),error=ref(''),manageId=ref('')
const expected=ref<{contentVersion:number;count:number;contentKey:string}|null>(null)
const states=computed(()=>store.bookmarks.map(b=>({b,state:reviewState(b,clock.value)})))
const due=computed(()=>states.value.filter(x=>x.state.due&&!x.state.full).sort((a,b)=>a.state.dueAt-b.state.dueAt||a.b.id.localeCompare(b.b.id)))
const active=computed(()=>store.bookmarks.find(b=>b.id===activeId.value)),back=computed(()=>active.value?flashcardBack(active.value):null)
const activeState=computed(()=>active.value?reviewState(active.value,clock.value):null)
const managed=computed(()=>store.bookmarks.find(b=>b.id===manageId.value))
const recent=computed(()=>store.bookmarks.flatMap(b=>(b.schedule?.events??[]).map((event,i)=>({term:b.term,id:b.id+':'+i,event,current:b.schedule?.contentVersion===b.contentVersion}))).sort((a,b)=>b.event.at-a.event.at).slice(0,10))
const date=(at:number)=>new Date(at).toLocaleString('vi-VN')
function pick(){activeId.value=due.value[0]?.b.id??'';revealed.value=false;expected.value=null}
watch(()=>due.value.map(x=>x.b.id).join(','),()=>{if(!active.value)pick()},{immediate:true})
watch(()=>[active.value?.id,active.value?.contentVersion,active.value?cardContentKey(active.value):null,active.value?.schedule?.events.length],()=>{revealed.value=false;expected.value=null})
function reveal(){if(!active.value)return;revealed.value=true;expected.value={contentVersion:active.value.contentVersion,count:active.value.schedule?.events.length??0,contentKey:cardContentKey(active.value)}}
function preview(grade:Grade){const days=nextInterval(activeState.value?.days??0,grade);return days?`${days} ngày`:'1 phút'}
async function rate(grade:Grade){if(!active.value||!revealed.value||!expected.value||busy.value)return;busy.value=true;const term=active.value.term;try{await store.review(active.value.id,grade,expected.value);clock.value=Date.now();message.value=`Đã lưu mức nhớ tự khai cho ${term}: ${gradeLabels[grade]}.`;error.value='';pick()}catch(e){error.value=e instanceof Error?e.message:'Không lưu được lượt ôn.'}finally{busy.value=false}}
async function reset(){if(!managed.value||!confirm('Đặt lại lịch và xóa lịch sử ôn của từ này? Ghi chú/tags được giữ. Hãy xuất backup trước nếu muốn giữ lịch sử.'))return;try{await store.resetSchedule(managed.value.id);clock.value=Date.now();error.value='';message.value='Đã đặt lại lịch; từ trở thành thẻ mới đến hạn.';pick()}catch(e){error.value=e instanceof Error?e.message:'Không đặt lại được lịch.'}}
let interval:ReturnType<typeof setInterval>|undefined
onMounted(()=>{interval=setInterval(()=>{clock.value=Date.now()},1000)})
onUnmounted(()=>clearInterval(interval))
</script>
<template>
 <section data-testid="scheduled-vocabulary">
  <h2>Ôn từ theo lịch</h2><p>Mức nhớ do bạn tự khai. Lịch quy tắc thử nghiệm, không dự đoán độ nhớ và không tăng điểm phỏng vấn/mastery. Dùng đồng hồ thiết bị; chưa có nhắc lịch ngoài ứng dụng.</p>
  <div class="card form-card"><p><strong>{{due.length}} thẻ đến hạn</strong> · {{states.filter(x=>x.state.eligible&&!x.state.stale&&!x.state.full&&!x.state.due).length}} thẻ chờ · {{states.filter(x=>!x.state.eligible).length}} thẻ thiếu ghi chú · {{states.filter(x=>x.state.stale).length}} thẻ đã đổi nội dung · {{states.filter(x=>x.state.full).length}} thẻ đạt giới hạn</p><p class="hint">Thẻ mới đến hạn ngay. Chưa nhớ:1 phút; các mức còn lại bắt đầu1/3/7 ngày rồi tăng theo quy tắc, tối đa180 ngày. Tối đa100 lượt/thẻ trước khi đặt lại lịch. Ôn flashcard tự do không đổi lịch.</p></div>
  <p v-if="error" class="notice danger" role="alert">{{error}}</p><p v-if="message" class="notice" role="status">{{message}}</p>
  <section class="card form-card flashcard" data-testid="scheduled-card">
   <template v-if="active&&back&&activeState"><span class="pill">{{active.source==='AUTHOR_CREATED'?'TỰ BIÊN SOẠN':'GHI CHÚ CÁ NHÂN · THAM CHIẾU'}} · {{activeState.count}} lượt đã lưu</span><h3 class="flashcard-term" lang="ja">{{active.term}}</h3><p class="hint">{{activeState.stale?'Nội dung đã đổi; đặt lại lịch để ôn theo mặt sau mới.':activeState.full?'Đã đạt giới hạn100 lượt.':activeState.due?'Đến hạn':'Hẹn ôn: '+date(activeState.dueAt)}}</p>
    <button v-if="!revealed" class="primary" @click="reveal">Lật thẻ để tự chấm</button>
    <div v-else data-testid="scheduled-back"><p lang="ja">{{back.reading}}</p><p>{{back.meaning||'Mặt sau chỉ có ghi chú cá nhân; không lưu định nghĩa provider.'}}</p><blockquote v-if="back.example" lang="ja">{{back.example}}</blockquote><p>{{back.note||'Chưa có ghi chú cá nhân.'}}</p><div class="actions"><button v-for="grade in grades" :key="grade" :disabled="busy||store.saving||!activeState.due||activeState.full" @click="rate(grade)">{{gradeLabels[grade]}} · {{preview(grade)}}</button></div></div>
   </template><template v-else><h3>Không có thẻ đến hạn</h3><p>Thẻ Jisho cần ghi chú cá nhân. Thẻ đổi nội dung hoặc đạt100 lượt cần rà soát/đặt lại lịch. Bạn vẫn có thể ôn flashcard tự do.</p></template>
   <button v-if="due.length && (!active || !activeState?.due)" @click="pick">Mở thẻ đến hạn tiếp theo</button>
  </section>
  <section class="card form-card"><h3>Quản lý lịch từng từ</h3><label>Chọn từ quản lý lịch<select v-model="manageId"><option value="">Chọn từ…</option><option v-for="b in store.bookmarks" :key="b.id" :value="b.id">{{b.term}} · {{b.source}}</option></select></label><template v-if="managed"><p>{{managed.schedule?.events.length??0}} lượt trong lịch hiện tại · {{reviewState(managed,clock).stale?'Nội dung đã đổi':reviewState(managed,clock).eligible?'Có thể ôn':'Cần ghi chú cá nhân'}}</p><p v-if="managed.schedule">Hẹn từ lịch cũ/hiện tại: {{date(reviewState(managed,clock).dueAt)}}</p><button :disabled="store.saving||!managed.schedule" @click="reset">Đặt lại lịch của từ</button></template></section>
  <section class="card form-card"><h3>Lượt ôn gần đây</h3><p v-if="!recent.length">Chưa có lượt ôn theo lịch.</p><article v-for="entry in recent" :key="entry.id" class="mode-box"><strong lang="ja">{{entry.term}}</strong><p>{{gradeLabels[entry.event.grade]}} · {{date(entry.event.at)}}{{entry.current?'':' · Nội dung thuộc phiên bản cũ'}}</p></article><p class="hint">Hiển thị10 lượt mới nhất. Backup giữ tối đa100 lượt/thẻ; đặt lại lịch sẽ xóa lịch sử của riêng từ đó.</p></section>
 </section>
</template>
