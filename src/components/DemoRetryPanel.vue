<script setup lang="ts">
import {computed} from 'vue'
import {demoCriteria,demoReadyForRetry,demoBaselineCurrent,type DemoSession} from '../domain/demo'
const props=defineProps<{session:DemoSession;parent?:DemoSession;blocked:boolean}>()
const emit=defineEmits<{retry:[mode:'GUIDED'|'INDEPENDENT']}>()
const visible=computed(()=>props.session.retry?.mode==='GUIDED'||demoReadyForRetry(props.session))
</script>
<template>
 <section class="card form-card"><h2>Luyện lại Demo</h2><p>Hoàn tất nội dung và ba câu phản biện hiện hành để tạo lượt mới. Lượt mới bắt đầu timer và câu trả lời trống; không tự đánh dấu đã tiến bộ.</p>
 <div class="actions"><button :disabled="blocked||!demoReadyForRetry(session)" @click="emit('retry','GUIDED')">Luyện lại Demo có hướng dẫn</button><button :disabled="blocked||!demoReadyForRetry(session)" @click="emit('retry','INDEPENDENT')">Luyện lại Demo độc lập</button></div>
 <template v-if="session.retry"><h3>Nguồn luyện lại · {{session.retry.mode}}</h3><p>ID lượt gốc: {{session.retry.parentId}} · bài trình bày v{{session.retry.baseline.version}}</p><p class="hint">{{demoBaselineCurrent(session,parent)?'Nguồn vẫn khớp bản chụp lúc tạo retry.':'Nguồn đã thay đổi sau khi tạo retry. So sánh dùng bản chụp cũ, không coi là bản hiện hành.'}}</p>
 <p v-if="!visible">Lượt độc lập ẩn bài cũ và gợi ý cho đến khi bạn hoàn tất trình bày cùng ba câu phản biện hiện hành.</p>
 <div v-else><h3>Bản chụp bài cũ</h3><p class="preserve">{{session.retry.baseline.text}}</p><article v-for="r in session.retry.baseline.reviews" :key="r.criterion" class="notice"><strong>{{demoCriteria.find(c=>c.id===r.criterion)?.title}} · tự review bài cũ</strong><blockquote>{{r.quote}}</blockquote><p>{{r.next}}</p></article>
 <article v-for="c in demoCriteria" :key="c.id"><h4>{{c.title}}</h4><p class="preserve">Cũ: {{session.retry.baseline.followups.find(a=>a.criterion===c.id)?.text}}</p><p v-if="session.retry.baseline.followups.find(a=>a.criterion===c.id)?.review" class="hint">Hướng sửa cũ: {{session.retry.baseline.followups.find(a=>a.criterion===c.id)?.review?.next}}</p><p v-if="demoReadyForRetry(session)" class="preserve">Mới: {{session.followups.find(a=>a.criterion===c.id)?.text}}</p></article><p v-if="demoReadyForRetry(session)">Đối chiếu nội dung tự ghi, không phải AI so sánh hay kết luận tiến bộ.</p></div></template>
 </section>
</template>
<style scoped>.preserve,blockquote{white-space:pre-wrap;overflow-wrap:anywhere}</style>
