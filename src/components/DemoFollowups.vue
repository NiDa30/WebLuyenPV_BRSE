<script setup lang="ts">
import {computed,ref,toRaw,watch} from 'vue'
import {demoCriteria,demoFollowup,demoFollowupReview,type DemoSession} from '../domain/demo'
const props=defineProps<{session:DemoSession;busy:boolean}>()
const emit=defineEmits<{change:[session:DemoSession]}>()
const criterion=ref<'role'|'tradeoff'|'outcome'>('role'),answer=ref(''),quote=ref(''),next=ref(''),error=ref('')
const saved=computed(()=>props.session.followups.find(a=>a.criterion===criterion.value))
watch(()=>[props.session.id,criterion.value,saved.value?.version,saved.value?.sourceVersion],()=>{answer.value=saved.value?.text??'';quote.value='';next.value='';error.value=''}, {immediate:true})
function save(){try{error.value='';emit('change',demoFollowup(toRaw(props.session),criterion.value,answer.value))}catch{error.value='Lưu nội dung trình bày trước; trả lời phản biện từ 1 đến 8.000 ký tự.'}}
function review(){try{error.value='';emit('change',demoFollowupReview(toRaw(props.session),criterion.value,quote.value,next.value))}catch{error.value='Cần trả lời hiện hành; trích dẫn đúng nguyên văn và hướng sửa từ 1 đến 2.000 ký tự.'}}
</script>
<template>
 <section class="card form-card"><h2>Phản biện kỹ thuật</h2><p>Ba câu hỏi cố định tự biên soạn, không phải AI hỏi tiếp thích ứng. Nội dung bạn tự nhập, không phải transcript âm thanh.</p>
 <p v-if="error" role="alert">{{error}}</p>
 <label>Câu hỏi phản biện<select v-model="criterion" :disabled="busy"><option v-for="c in demoCriteria" :key="c.id" :value="c.id">{{c.title}}</option></select></label>
 <h3>{{demoCriteria.find(c=>c.id===criterion)?.prompt}}</h3>
 <p v-if="saved" class="hint">Câu trả lời v{{saved.version}} · nguồn bài trình bày v{{saved.sourceVersion}} · {{saved.sourceVersion===session.version?'Hiện hành':'Lỗi thời: bài trình bày đã đổi; lưu lại câu trả lời sau khi kiểm tra.'}}</p>
 <form @submit.prevent="save"><label>Câu trả lời phản biện<textarea v-model="answer" :disabled="busy" maxlength="8000"></textarea></label><p class="hint">Lưu rõ ràng trước khi đổi câu hỏi/rời trang. Sửa câu trả lời hoặc xác nhận nguồn mới sẽ xóa review của câu đó.</p><button :disabled="busy||!session.text.trim()">Lưu trả lời phản biện</button></form>
 <form v-if="saved" @submit.prevent="review"><h3>Tự review câu trả lời · demo-qa-self-v1</h3><label>Trích dẫn phản biện nguyên văn<textarea v-model="quote" :disabled="busy" maxlength="2000"></textarea></label><label>Hướng sửa phản biện<textarea v-model="next" :disabled="busy" maxlength="2000"></textarea></label><button :disabled="busy||answer.trim()!==saved.text||saved.sourceVersion!==session.version">Lưu review phản biện</button></form>
 <article v-if="saved?.review" class="notice"><strong>SELF_REVIEW · câu trả lời v{{saved.review.version}} · {{saved.sourceVersion===session.version?'Hiện hành':'Lỗi thời theo bài trình bày'}}</strong><blockquote>{{saved.review.quote}}</blockquote><p>{{saved.review.next}}</p></article>
 <p>{{session.followups.filter(a=>a.sourceVersion===session.version).length}}/3 câu trả lời hiện hành · Không quy thành điểm năng lực.</p>
 </section>
</template>
<style scoped>textarea{width:100%;min-height:100px;box-sizing:border-box}blockquote{white-space:pre-wrap;overflow-wrap:anywhere}</style>
