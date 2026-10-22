<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,watch} from 'vue'
import {corpus,normalizeQuery,localLookup,lookupMessages,type Lookup,type DictionaryEntry} from '../domain/dictionary'
import {searchDictionary} from '../dictionary-client'
import {useVocabularyStore} from '../stores/vocabulary'
const props=withDefaults(defineProps<{initialQuery?:string;contextLabel?:string}>(),{initialQuery:'',contextLabel:''})
const vocabulary=useVocabularyStore(),query=ref(props.initialQuery),online=ref(false),loading=ref(false),lookup=ref<Lookup|null>(null),error=ref(''),notice=ref('')
let sequence=0,controller:AbortController|undefined
const suggestions=computed(()=>corpus.slice(0,6))
function cancel(){sequence++;controller?.abort();loading.value=false}
watch(query,()=>{cancel();lookup.value=null;error.value='';notice.value=''})
watch(()=>props.initialQuery,value=>{query.value=value})
watch(online,()=>{cancel();try{if(query.value.trim())lookup.value=localLookup(query.value)}catch{lookup.value=null}})
async function search(){
 error.value='';notice.value='';let q:string
 try{q=normalizeQuery(query.value)}catch(e){error.value=e instanceof Error?e.message:'Cụm từ không hợp lệ.';return}
 cancel();const id=sequence
 if(!online.value){lookup.value=localLookup(q);return}
 const active=new AbortController();controller=active;loading.value=true;const timeout=setTimeout(()=>active.abort(),15000)
 try{const result=await searchDictionary(q,active.signal);if(id===sequence&&!active.signal.aborted)lookup.value=result}
 catch{if(id===sequence)lookup.value=localLookup(q,'PROVIDER_UNAVAILABLE')}
 finally{clearTimeout(timeout);if(id===sequence)loading.value=false}
}
async function suggest(term:string){query.value=term;await new Promise<void>(resolve=>queueMicrotask(resolve));await search()}
async function save(entry:DictionaryEntry){if(!lookup.value)return;try{await vocabulary.add(lookup.value.query,entry.source==='AUTHOR_CREATED'?'AUTHOR_CREATED':'JISHO_REFERENCE',entry.source==='AUTHOR_CREATED'?entry.id:null);notice.value='Đã lưu cụm tra cứu vào sổ từ. Định nghĩa Jisho không được lưu; thêm ghi chú của bạn trong Sổ từ vựng.'}catch(e){error.value=e instanceof Error?e.message:'Không lưu được từ.'}}
onMounted(()=>vocabulary.init());onUnmounted(cancel)
</script>
<template>
 <section class="dictionary-lookup" aria-label="Tra từ tiếng Nhật">
  <h2>Tra từ & cách dùng Business Japanese</h2><p v-if="contextLabel" class="hint">{{contextLabel}} · Tra từ không thay đổi điểm/feedback hiện tại.</p>
  <form @submit.prevent="search"><label>Cụm từ tiếng Nhật cần tra<input v-model="query" maxlength="200" placeholder="Ví dụ: 担当" autocomplete="off"></label><label class="check"><input type="checkbox" v-model="online"> Cho phép gửi cụm từ ngắn đã chọn tới Jisho qua backend. Không gửi toàn bộ CV/transcript.</label><div class="actions"><button class="primary" :disabled="loading" type="submit">{{loading?'Đang tra cứu…':'Tra cụm từ'}}</button><button v-if="loading" type="button" @click="cancel">Hủy tra cứu</button></div></form>
  <p class="hint">Mặc định dùng nội dung tự biên soạn offline. Jisho JSON chỉ bật khi operator đã rà soát điều kiện truy cập/sử dụng. Không có scraping kanji/câu ví dụ, audio, ảnh hay cache nội dung ngoài.</p>
  <p v-if="error" role="alert" class="error">{{error}}</p><p v-if="notice" role="status" class="notice">{{notice}}</p><p v-if="vocabulary.error" role="alert" class="error">{{vocabulary.error}}</p>
  <div v-if="!lookup&&!loading" class="dictionary-suggestions"><span class="hint">Gợi ý tự biên soạn:</span><button v-for="e in suggestions" :key="e.id" @click="suggest(e.term)">{{e.term}}</button></div>
  <template v-if="lookup"><p class="notice" role="status">{{lookupMessages[lookup.state]}}</p><p v-if="!lookup.entries.length" class="empty">Chưa có mục phù hợp. Thử một từ ngắn hơn; bạn vẫn có thể tiếp tục luyện tập.</p><div class="dictionary-results"><article class="card dictionary-entry" v-for="e in lookup.entries" :key="e.id"><span class="pill">{{e.source==='AUTHOR_CREATED'?'TỰ BIÊN SOẠN':'JISHO · TRA TRỰC TIẾP, KHÔNG CACHE'}}</span><h3 lang="ja">{{e.term}} <small v-if="e.reading">{{e.reading}}</small></h3><ul><li v-for="(sense,i) in e.senses" :key="i">{{sense}}</li></ul><blockquote v-if="e.businessExample" lang="ja">{{e.businessExample}}</blockquote><p v-if="e.usageNote" class="hint">{{e.usageNote}}</p><p v-if="e.source==='JISHO_JSON'" class="hint">Dữ liệu từ Jisho, nghĩa tiếng Anh theo provider; không tự suy ra sắc thái Business Japanese hoặc quyền tái phân phối. Chỉ lưu cụm tra cứu và ghi chú bạn tự viết.</p><a v-if="e.sourceUrl" :href="e.sourceUrl" target="_blank" rel="noopener noreferrer">Xem nguồn Jisho ↗</a><button @click="save(e)" :disabled="vocabulary.saving||vocabulary.loadFailed">Lưu cụm tra cứu</button></article></div></template>
 </section>
</template>
