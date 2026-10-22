<script setup lang="ts">
import { computed,onMounted,onUnmounted,ref,toRaw,watch } from 'vue'
import type { Interview } from '../domain/interview'
import type { AiEvidence } from '../domain/ai-feedback'
import { rubrics } from '../domain/interview'
import { useInterviewStore } from '../stores/interview'
import { providerCapabilities,requestAiFeedback,aiErrorMessage } from '../ai-client'
const props=defineProps<{attempt:Interview}>()
const emit=defineEmits<{selectEvidence:[evidence:AiEvidence];queueCriterion:[criterionId:string]}>()
const store=useInterviewStore(),consent=ref(false),available=ref(false),checking=ref(false),busy=ref(false),message=ref(''),model=ref('')
let controller:AbortController|undefined,capController:AbortController|undefined,serial=0
const criteria=computed(()=>rubrics[props.attempt.track].criteria)
const ai=computed(()=>props.attempt.aiFeedback)
const weighted=computed(()=>{
  if(!ai.value||ai.value.criteria.some(c=>c.score===null))return null
  return Math.round(criteria.value.reduce((sum,c)=>sum+ai.value!.criteria.find(v=>v.criterionId===c.id)!.score!/3*c.weight,0))
})
async function check(){checking.value=true;capController?.abort();capController=new AbortController();const timeout=setTimeout(()=>capController?.abort(),6000);try{const caps=await providerCapabilities(capController.signal);available.value=caps.aiFeedback.available;model.value=caps.aiFeedback.model;message.value=available.value?'AI sẵn sàng. Chỉ gửi nội dung khi bạn đồng ý.':'Backend chưa cấu hình AI; rules và tự đánh giá vẫn hoạt động.'}catch{available.value=false;message.value='Chưa kết nối được backend AI. Luồng local vẫn hoạt động.'}finally{clearTimeout(timeout);checking.value=false}}
async function analyze(){
  if(!consent.value||busy.value||!available.value)return
  const id=++serial,snapshot=structuredClone(toRaw(props.attempt)),revision=snapshot.revisions.at(-1)!
  busy.value=true;message.value='Đang yêu cầu AI kiểm tra theo rubric…';controller=new AbortController();const active=controller;const timeout=setTimeout(()=>active.abort(),35000)
  try{const feedback=await requestAiFeedback(snapshot,active.signal);if(serial!==id||active.signal.aborted)return;await store.attachAi(snapshot.id,revision.version,revision.text,feedback);if(serial===id)message.value='Đã lưu đánh giá AI có chứng cứ. Hãy kiểm tra lại vì mô hình có thể sai.'}
  catch(error){if(serial===id)message.value=aiErrorMessage(error)}finally{clearTimeout(timeout);if(serial===id)busy.value=false}
}
function cancel(){serial++;controller?.abort();busy.value=false;message.value='Đã hủy yêu cầu. Không thay đổi feedback local.'}
watch(()=>[props.attempt.id,props.attempt.status,props.attempt.revisions.at(-1)?.version],()=>{cancel();consent.value=false})
onMounted(check)
onUnmounted(()=>{serial++;controller?.abort();capController?.abort()})
</script>
<template>
  <section class="card form-card ai-panel">
    <div class="section-heading"><h2>Đánh giá AI có chứng cứ</h2><span class="pill">{{available?'PROVIDER AVAILABLE':'AI CHƯA KHẢ DỤNG'}}</span></div>
    <p>AI chỉ đánh giá câu trả lời text theo rubric, không xác minh CV, kinh nghiệm hoặc năng lực tuyển dụng. Kết quả AI và điểm tự chấm được lưu riêng.</p>
    <p class="hint">Backend giữ capability phiên tạm thời tối đa 15 phút, không lưu transcript vào database. Nội dung gửi tới AI có thể chịu chính sách dữ liệu của provider; tùy chọn không lưu request không thay thế chính sách retention của provider.</p>
    <div class="actions"><button :disabled="checking||busy" @click="check">{{checking?'Đang kiểm tra…':'Kiểm tra kết nối AI'}}</button><span v-if="model" class="hint">Model: {{model}}</span></div>
    <p v-if="message" role="status" class="notice">{{message}}</p>
    <label class="check"><input type="checkbox" v-model="consent" :disabled="busy"> Tôi đồng ý gửi câu hỏi, rubric và câu trả lời hiện tại tới backend và AI provider để đánh giá.</label>
    <div class="actions"><button class="primary" :disabled="!consent||!available||busy" @click="analyze">{{busy?'AI đang đánh giá…':'Yêu cầu AI đánh giá'}}</button><button v-if="busy" @click="cancel">Hủy đánh giá AI</button></div>
    <template v-if="ai"><div class="rubric-summary"><strong>Điểm AI tham khảo: {{weighted??'N/A'}}{{weighted!==null?' / 100':''}}</strong><small>{{ai.provider}} · {{ai.model}} · {{ai.rubricVersion}} · transcript v{{ai.transcriptVersion}}. Không phải điểm tự đánh giá.</small></div><p class="hint">{{ai.limitation}}</p>
      <div v-for="c in ai.criteria" :key="c.criterionId" class="ai-criterion"><h3>{{criteria.find(v=>v.id===c.criterionId)?.name}} · {{c.score??'N/A'}} / 3</h3><button v-if="c.annotations.length" :disabled="store.busy" @click="emit('queueCriterion',c.criterionId)">Đưa AI feedback này vào hàng đợi</button><p v-if="!c.annotations.length" class="hint">Chưa đủ chứng cứ để đánh giá tiêu chí này.</p><article v-for="e in c.annotations" :key="e.id" class="ai-evidence"><blockquote>{{e.quote}}</blockquote><p>{{e.reason}}</p><p><strong>Gợi ý sửa:</strong> {{e.suggestion}}</p><small>MODEL_ASSESSMENT · criterion {{e.criterionId}} · transcript v{{e.transcriptVersion}} · mốc soạn thảo {{e.startMs}}–{{e.endMs}} ms (không phải audio).</small><button @click="emit('selectEvidence',e)">Đánh dấu chứng cứ trên transcript</button></article></div>
      <div v-if="ai.followUp" class="mode-box"><h3>Câu hỏi đào sâu do AI đề xuất</h3><p lang="ja" class="jp-question">{{ai.followUp.question}}</p><blockquote>{{ai.followUp.quote}}</blockquote><p>{{ai.followUp.reason}}</p><p class="hint">Đề xuất để tự luyện thêm; chưa phải hội thoại nhiều lượt. Không tự tăng điểm khi xem câu hỏi.</p></div>
    </template>
  </section>
</template>
