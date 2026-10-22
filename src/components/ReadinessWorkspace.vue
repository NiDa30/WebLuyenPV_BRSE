<script setup lang="ts">
import {onMounted,ref} from 'vue'
import {emptyReadiness,parseReadiness,readinessItems,type Readiness} from '../domain/readiness'
import {loadReadiness,saveReadiness} from '../readiness-storage'
const state=ref(emptyReadiness()),ready=ref(false),failed=ref(false),busy=ref(false),message=ref(''),note=ref('')
onMounted(async()=>{try{state.value=await loadReadiness();note.value=state.value.note}catch{failed.value=true;message.value='Không đọc được checklist. Chưa cho phép ghi đè; bạn có thể nhập backup hợp lệ.'}finally{ready.value=true}})
async function commit(next:Readiness,preserveDraft=false){busy.value=true;message.value='';try{await saveReadiness(next);state.value=next;if(!preserveDraft)note.value=next.note;failed.value=false;message.value='Đã lưu trên thiết bị.';return true}catch{message.value='Không lưu được. Dữ liệu đã lưu trước đó được giữ; hãy thử lại.';return false}finally{busy.value=false}}
function save(){void commit({...state.value,checked:[...state.value.checked],note:note.value,updatedAt:Date.now()})}
async function toggle(id:Readiness['checked'][number],event:Event){const input=event.target as HTMLInputElement,previous=state.value.checked.includes(id);const saved=await commit({...state.value,checked:previous?state.value.checked.filter(v=>v!==id):[...state.value.checked,id],updatedAt:Date.now()},true);if(!saved)input.checked=previous}
function reset(){if(window.confirm('Xóa các dấu kiểm và ghi chú để chuẩn bị lại? Hãy xuất backup nếu cần giữ.'))void commit(emptyReadiness())}
function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(state.value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='brse-readiness.json';a.click();URL.revokeObjectURL(url)}
async function upload(e:Event){const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>20000)throw Error();const next=parseReadiness(await file.text());if(window.confirm('Thay thế checklist hiện tại bằng backup này?'))await commit(next)}catch{message.value='Backup không hợp lệ; không thay thế dữ liệu.'}finally{input.value=''}}
</script>
<template>
 <div class="eyebrow">CHUẨN BỊ · TỰ KIỂM TRA</div><h1 class="page-title">Checklist phỏng vấn</h1>
 <p class="lead">Kiểm tra lại trước mỗi cuộc phỏng vấn trực tuyến.</p>
 <div class="notice">Các dấu kiểm do bạn tự xác nhận. Ứng dụng không đo mạng, camera hay microphone, không đánh giá tính cách và không kết luận đủ năng lực. Không xin quyền thiết bị.</div>
 <p v-if="message" role="status">{{message}}</p><p v-if="!ready">Đang đọc dữ liệu…</p>
 <template v-if="ready"><section class="card form-card"><h2>{{state.checked.length}} / {{readinessItems.length}} mục tự xác nhận</h2><p class="hint">Kiểm tra lại khi đổi thiết bị hoặc điều kiện. Đây không phải điểm readiness.</p><p>Lưu gần nhất: {{state.updatedAt===null?'Chưa lưu':new Date(state.updatedAt).toLocaleString('vi-VN')}}</p>
 <fieldset v-for="group in ['Thiết bị','Kết nối','Không gian','Ứng xử']" :key="group" :disabled="busy||failed"><legend>{{group}}</legend><label v-for="item in readinessItems.filter(i=>i.group===group)" :key="item.id" class="check"><input type="checkbox" :checked="state.checked.includes(item.id)" @change="toggle(item.id,$event)">{{item.text}}</label></fieldset>
 <form @submit.prevent="save"><label>Ghi chú chuẩn bị<textarea v-model="note" maxlength="2000" :disabled="busy||failed" placeholder="Chỉ ghi thông tin cần thiết; tránh mật khẩu hoặc đường dẫn họp riêng tư."></textarea></label><button :disabled="busy||failed" class="primary">Lưu ghi chú</button></form></section>
 <section class="card form-card"><h2>Backup checklist riêng</h2><p>JSON chưa mã hóa, chỉ chứa checklist và ghi chú. Không chứa dữ liệu Exam, Interview hay Sổ từ. Xóa dữ liệu trình duyệt sẽ mất checklist nếu chưa backup.</p><div class="actions"><button :disabled="busy||failed" @click="download">Xuất checklist JSON</button><label class="file-button">Nhập checklist JSON<input type="file" accept=".json,application/json" :disabled="busy" @change="upload"></label><button :disabled="busy||failed" @click="reset">Chuẩn bị lại</button></div></section></template>
</template>
<style scoped>fieldset{border:1px solid #dfe5e1;border-radius:10px;margin:18px 0;padding:16px}legend{font-weight:700}textarea{min-height:100px;width:100%;box-sizing:border-box}</style>
