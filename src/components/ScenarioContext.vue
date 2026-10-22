<script setup lang="ts">
import {computed} from 'vue'
import {useInterviewStore} from '../stores/interview'
import {sessionReport} from '../domain/interview'
import {scenarioById} from '../domain/scenarios'
const props=defineProps<{sessionId:string;attemptId:string}>()
const store=useInterviewStore()
const session=computed(()=>store.sessions.find(s=>s.id===props.sessionId)!)
const scenario=computed(()=>scenarioById(session.value.scenarioId!))
const report=computed(()=>sessionReport(session.value,store.attempts))
const index=computed(()=>session.value.attemptIds.indexOf(props.attemptId))
const current=computed(()=>report.value.turns[index.value]!)
const context=computed(()=>report.value.turns.slice(0,index.value).map(a=>{
  const version=current.value.status==='REVIEWED'?current.value.scenarioContext?.find(c=>c.attemptId===a.id)?.version:a.revisions.at(-1)?.version
  return {attempt:a,revision:a.revisions.find(r=>r.version===version)}
}))
</script>
<template>
  <section class="card form-card scenario-context" data-testid="scenario-context">
    <span class="pill">AUTHOR_CREATED · KỊCH BẢN CỐ ĐỊNH</span><h2>{{scenario.title}}</h2><p>{{scenario.brief}}</p>
    <p class="hint">Khách phản hồi theo kịch bản tự biên soạn, chưa thích ứng theo câu trả lời. Independent chỉ ẩn gợi ý và đáp án của lần luyện trước; vẫn đọc được các lượt trong cuộc trao đổi hiện tại.</p>
    <div v-if="index>0" class="mode-box"><h3>Kết quả kiểm tra của nhóm (giả lập)</h3><p>{{scenario.teamUpdate}}</p></div>
    <div v-for="(item,i) in context" :key="item.attempt.id" class="mode-box">
      <h3>Ngữ cảnh lượt {{i+1}} · transcript v{{item.revision?.version??'chưa gửi'}}</h3>
      <p lang="ja"><strong>Khách:</strong> {{item.attempt.prompt}}</p>
      <blockquote data-testid="scenario-prior-answer">{{item.revision?.text??'Lượt trước chưa gửi. Quay lại báo cáo phiên để hoàn tất.'}}</blockquote>
    </div>
    <p v-if="report.staleIds.includes(attemptId)" class="notice danger" role="alert">Ngữ cảnh đã thay đổi. Feedback/điểm lượt này thuộc bản trao đổi cũ và không được cộng vào tổng phiên. Chọn Sửa transcript, rà soát và gửi lại sau khi các lượt trước hợp lệ.</p>
  </section>
</template>
