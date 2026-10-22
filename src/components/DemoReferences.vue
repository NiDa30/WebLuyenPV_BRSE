<script setup lang="ts">
import {ref,toRaw,watch} from 'vue'
import {demoReferences,type DemoSession} from '../domain/demo'
const props=defineProps<{session:DemoSession;busy:boolean}>(),emit=defineEmits<{change:[session:DemoSession]}>()
const label=ref(''),url=ref(''),error=ref('')
watch(()=>props.session.id,()=>{label.value='';url.value='';error.value=''})
function add(){try{error.value='';emit('change',demoReferences(toRaw(props.session),[...toRaw(props.session.references),{label:label.value,url:url.value}]))}catch{error.value='Tối đa 3 URL HTTPS khác nhau; tên 1–80 ký tự, URL tối đa 500, không tài khoản/mật khẩu, query hoặc fragment.'}}
function remove(index:number){emit('change',demoReferences(toRaw(props.session),props.session.references.filter((_,i)=>i!==index).map(r=>toRaw(r))))}
</script>
<template><section class="card form-card" data-testid="demo-references"><h2>Portfolio & repo tham chiếu</h2><p>Chỉ lưu liên kết trên thiết bị. Không tải repo, đọc mã hay xác minh quyền sở hữu. Không nhập URL bí mật, token hoặc đường dẫn họp. Chỉ mở website ngoài khi bạn bấm liên kết; website đó có chính sách riêng.</p><p v-if="error" role="alert">{{error}}</p><article v-for="(r,i) in session.references" :key="r.url" class="notice"><strong>{{r.label}}</strong><p class="url">{{r.url}}</p><div class="actions"><a :href="r.url" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Mở {{r.label}} ↗</a><button :disabled="busy" @click="remove(i)">Xóa {{r.label}}</button></div></article><form @submit.prevent="add"><label>Tên tham chiếu<input v-model="label" maxlength="80" :disabled="busy"></label><label>URL portfolio hoặc repo<input v-model="url" maxlength="500" :disabled="busy" placeholder="https://github.com/example/project"></label><button :disabled="busy||session.references.length>=3">Lưu tham chiếu Demo</button></form><p class="hint">Đổi tham chiếu không sửa nội dung, timer hoặc review. Lượt retry sao chép các liên kết; bản chụp nguồn giữ tham chiếu cũ. Nháp form cần lưu trước khi đổi lượt.</p></section></template>
<style scoped>.url{overflow-wrap:anywhere}</style>
