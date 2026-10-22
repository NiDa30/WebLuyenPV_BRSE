<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,watch} from 'vue'
import {VoiceController,initialVoiceState} from '../voice/controller'
import {browserVoiceDependencies,voiceCapabilities,japaneseVoices,canSpeak,type VoiceCapabilities} from '../voice/browser'
import {useInterviewStore} from '../stores/interview'
const props=defineProps<{attemptId:string;prompt:string}>()
const store=useInterviewStore(),capabilities=ref<VoiceCapabilities>({recording:false,recognition:false,synthesis:false,secure:false})
const state=ref(initialVoiceState()),recordConsent=ref(false),asrConsent=ref(false),ttsConsent=ref(false),reviewed=ref(false),reviewText=ref(''),applyMode=ref<'replace'|'append'>('replace'),message=ref(''),applying=ref(false)
const voices=ref<SpeechSynthesisVoice[]>([]),voiceUri=ref(''),speaking=ref(false)
const selectedVoice=computed(()=>voices.value.find(v=>v.voiceURI===voiceUri.value))
const busy=computed(()=>state.value.phase!=='IDLE')
const lowConfidence=computed(()=>state.value.confidence!==null&&state.value.confidence<0.7)
let controller:VoiceController|undefined,utterance:SpeechSynthesisUtterance|undefined,ttsGeneration=0
function refreshVoices(){if(!capabilities.value.synthesis)return;voices.value=japaneseVoices(speechSynthesis.getVoices());if(!voices.value.some(v=>v.voiceURI===voiceUri.value))voiceUri.value=voices.value[0]?.voiceURI??''}
function stopSpeaking(){ttsGeneration++;if(utterance){utterance.onend=null;utterance.onerror=null;utterance=undefined}if(capabilities.value.synthesis)speechSynthesis.cancel();speaking.value=false}
function speak(){
  if(!canSpeak(selectedVoice.value,ttsConsent.value)||busy.value)return
  stopSpeaking();const generation=++ttsGeneration
  try{utterance=new SpeechSynthesisUtterance(props.prompt);utterance.lang='ja-JP';utterance.voice=selectedVoice.value!;utterance.rate=0.9;utterance.onend=()=>{if(generation===ttsGeneration)speaking.value=false};utterance.onerror=()=>{if(generation===ttsGeneration){speaking.value=false;message.value='Chưa phát được giọng đọc. Bạn vẫn có thể đọc câu hỏi trên màn hình.'}};speaking.value=true;speechSynthesis.speak(utterance)}catch{speaking.value=false;message.value='Trình duyệt chưa phát được giọng Nhật. Dùng nội dung text.'}
}
function interruptCapture(){
  stopSpeaking()
  if(state.value.phase==='REQUESTING')controller?.cancelPending()
  else if(state.value.phase==='RECORDING')controller?.stopRecording()
  else if(state.value.phase==='RECOGNIZING')controller?.abortRecognition()
  message.value='Đã dừng voice khi rời/ẩn trang. Dữ liệu text vẫn giữ nguyên.'
}
function visibilityChanged(){if(document.hidden)interruptCapture()}
function record(){stopSpeaking();void controller?.record(recordConsent.value)}
function recognize(){stopSpeaking();reviewed.value=false;controller?.recognize(asrConsent.value)}
async function apply(){
  if(!reviewed.value||!reviewText.value.trim()||busy.value||applying.value)return
  const attempt=store.attempts.find(a=>a.id===props.attemptId);if(!attempt)return
  if(applyMode.value==='replace'&&attempt.draft.trim()&&!confirm('Thay thế bản nháp hiện tại bằng transcript đã kiểm tra?'))return
  const text=applyMode.value==='append'&&attempt.draft.trim()?attempt.draft.trim()+'\n'+reviewText.value.trim():reviewText.value.trim()
  applying.value=true
  try{await store.applyVoice(props.attemptId,text,{source:'BROWSER_ASR_REVIEWED',lang:'ja-JP',reviewConfirmed:true,mergeMode:applyMode.value==='append'?'APPEND':'REPLACE',confidence:state.value.confidence,captureDurationMs:state.value.captureDurationMs,reviewedAt:Date.now()});message.value='Đã đưa transcript đã kiểm tra vào bản nháp. Chưa gửi/chấm câu trả lời.'}
  catch(e){message.value=e instanceof Error?e.message:'Không lưu được transcript.'}finally{applying.value=false}
}
watch(reviewText,()=>{reviewed.value=false})
onMounted(()=>{
  document.addEventListener('visibilitychange',visibilityChanged);window.addEventListener('pagehide',interruptCapture)
  capabilities.value=voiceCapabilities()
  controller=new VoiceController(browserVoiceDependencies(),next=>{const changed=next.transcript!==state.value.transcript;state.value=next;if(changed){reviewText.value=next.transcript;reviewed.value=false}})
  if(capabilities.value.synthesis){refreshVoices();speechSynthesis.addEventListener('voiceschanged',refreshVoices)}
})
onUnmounted(()=>{document.removeEventListener('visibilitychange',visibilityChanged);window.removeEventListener('pagehide',interruptCapture);controller?.dispose();stopSpeaking();if(capabilities.value.synthesis)speechSynthesis.removeEventListener('voiceschanged',refreshVoices)})
</script>
<template>
  <section class="voice-panel" aria-label="Luyện giọng nói">
    <h3>Nghe câu hỏi & trả lời bằng giọng nói</h3><p class="hint">Voice là tùy chọn. Text luôn dùng được. Không có điểm phát âm từ transcript nhận dạng.</p>
    <div v-if="!capabilities.secure" class="notice">Microphone cần HTTPS hoặc một secure local origin. Bạn vẫn có thể nhập text.</div>
    <details><summary>Nghe câu hỏi bằng TTS của trình duyệt</summary><p class="hint">Đọc nội dung do ứng dụng biên soạn, không phải audio từ Jisho/Immersion Kit. Giọng có nhãn “dịch vụ ngoài” có thể gửi câu hỏi tới dịch vụ giọng đọc của trình duyệt.</p>
      <label>Giọng đọc tiếng Nhật<select v-model="voiceUri" :disabled="speaking||busy"><option value="">Chọn giọng Nhật…</option><option v-for="v in voices" :key="v.voiceURI" :value="v.voiceURI">{{v.name}} · {{v.localService?'trên thiết bị':'dịch vụ ngoài'}}</option></select></label>
      <p v-if="!voices.length" class="hint">Chưa có giọng Nhật trên trình duyệt này. Có thể cài giọng Nhật trong hệ điều hành hoặc đọc câu hỏi text.</p>
      <label v-if="selectedVoice&&!selectedVoice.localService" class="check"><input type="checkbox" v-model="ttsConsent" :disabled="speaking"> Tôi đồng ý dùng dịch vụ giọng đọc ngoài của trình duyệt cho câu hỏi này.</label>
      <div class="actions"><button type="button" :disabled="!canSpeak(selectedVoice,ttsConsent)||busy||speaking" @click="speak">Đọc câu hỏi tiếng Nhật</button><button type="button" v-if="speaking" @click="stopSpeaking">Dừng đọc câu hỏi</button><button type="button" @click="refreshVoices" :disabled="speaking">Làm mới giọng đọc</button></div>
    </details>
    <details><summary>Ghi âm để tự nghe lại (local)</summary><p class="hint">Xin quyền microphone khi bạn bấm ghi. Audio chỉ giữ trong bộ nhớ trang, tối đa 2 phút/10 MiB; không vào IndexedDB, backup hay backend. Rời màn hình/reload sẽ mất bản ghi. Chuyển tab/ẩn trang sẽ dừng voice.</p><label class="check"><input type="checkbox" v-model="recordConsent" :disabled="busy"> Tôi đồng ý mở microphone để ghi âm local.</label><div class="actions"><button type="button" @click="record" :disabled="!capabilities.recording||!recordConsent||busy">Bắt đầu ghi âm local</button><button type="button" v-if="state.phase==='RECORDING'" @click="controller?.stopRecording()">Dừng ghi âm local</button><button type="button" v-if="state.phase==='REQUESTING'" @click="controller?.cancelPending()">Hủy chờ microphone</button></div><p v-if="!capabilities.recording" class="hint">Trình duyệt chưa hỗ trợ ghi âm MediaRecorder hoặc microphone chưa khả dụng. Nhập text vẫn hoạt động.</p><div v-if="state.audioUrl" class="local-recording"><audio :src="state.audioUrl" controls preload="metadata" aria-label="Nghe lại bản ghi microphone của bạn"></audio><button type="button" @click="controller?.clearAudio()" :disabled="busy">Xóa bản ghi local</button></div></details>
    <details><summary>Nhận dạng tiếng Nhật & kiểm tra transcript</summary><p class="hint">Đây là Web Speech Recognition, không phải ASR của backend. Tùy trình duyệt, audio có thể được gửi tới dịch vụ do trình duyệt chọn; không đảm bảo offline và không kiểm soát được retention của dịch vụ đó. Bản ghi local ở trên không được tự tải lên để nhận dạng.</p><label class="check"><input type="checkbox" v-model="asrConsent" :disabled="busy"> Tôi đồng ý dùng nhận dạng của trình duyệt, có thể gửi giọng nói tới dịch vụ bên ngoài.</label><div class="actions"><button type="button" @click="recognize" :disabled="!capabilities.recognition||!asrConsent||busy">Bắt đầu nhận dạng tiếng Nhật</button><button type="button" v-if="state.phase==='RECOGNIZING'" @click="controller?.stopRecognition()">Dừng & kiểm tra transcript</button><button type="button" v-if="state.phase==='RECOGNIZING'" @click="controller?.abortRecognition()">Hủy nhận dạng</button></div><p v-if="!capabilities.recognition" class="hint">Speech Recognition chưa được hỗ trợ ở trình duyệt này. Hãy nhập câu trả lời bằng text hoặc tự nghe lại bản ghi local.</p>
      <p v-if="state.interim" class="hint" aria-live="polite">Tạm nhận dạng (chưa đưa vào câu trả lời): {{state.interim}}</p>
      <template v-if="state.transcript"><label>Transcript nhận dạng — sửa trước khi dùng<textarea v-model="reviewText" maxlength="10000" rows="4" :disabled="busy"></textarea></label><p v-if="lowConfidence" class="notice">Độ tin cậy nhận dạng thấp theo ngưỡng thử nghiệm 0,7. Hãy kiểm tra từng ý; đây không phải điểm phát âm.</p><p class="hint">Confidence do trình duyệt báo: {{state.confidence===null?'N/A':state.confidence.toFixed(2)}} · Dù cao vẫn cần xác nhận nội dung. Thời gian mở nhận dạng: {{Math.round(state.captureDurationMs/1000)}} giây, không phải thời gian nói chính xác.</p><label>Cách đưa vào bản nháp<select v-model="applyMode" :disabled="busy"><option value="replace">Thay thế bản nháp (có xác nhận)</option><option value="append">Nối vào cuối bản nháp</option></select></label><label class="check"><input type="checkbox" v-model="reviewed" :disabled="busy"> Tôi đã kiểm tra và sửa transcript nhận dạng.</label><button type="button" class="primary" :disabled="!reviewed||!reviewText.trim()||busy||applying" @click="apply">Dùng transcript đã kiểm tra</button></template>
    </details>
    <p v-if="state.message" class="notice" :role="state.error?'alert':'status'">{{state.message}}</p><p v-if="message" role="status" class="notice">{{message}}</p>
  </section>
</template>
