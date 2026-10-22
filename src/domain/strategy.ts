import type { Attempt } from './model'
export const algorithmVersion = 'rules-v1-pilot'
// Explicit pilot heuristics, not validated diagnostic thresholds.
export const thresholds = { lowAccuracy: 0.6, highAccuracy: 0.85, fastTime: 0.7, slowTime: 0.9 }
export interface Finding { code: string; section: string; evidence: string; certainty: 'OBSERVED' | 'LIKELY' | 'UNDETERMINED'; recommendation: string; trial: string }
export function analyze(a: Attempt): Finding[] {
  const out: Finding[] = []
  a.config.sections.forEach((s,i) => {
    const r = a.results[i]!, used = a.elapsed[i]!, ratio = used/s.budgetMs
    const push = (code: string, evidence: string, recommendation: string, trial: string, certainty: Finding['certainty'] = 'OBSERVED') => out.push({code, section: s.name, evidence, recommendation, trial, certainty})
    const unfinished = r.total !== null && r.answered !== null ? r.total-r.answered : null
    if (unfinished !== null && unfinished > 0) push('UNFINISHED_QUESTIONS', `Còn ${unfinished} câu chưa làm; dùng ${(used/60000).toFixed(1)}/${s.budgetMs/60000} phút.`, 'Thử checkpoint sớm hơn và giới hạn thời gian câu khó; chưa đủ chứng cứ để kết luận nguyên nhân.', 'Theo dõi số câu còn lại ở lần sau.')
    for (const e of a.events.filter(e => e.sectionId === s.id && e.kind === 'CHECKPOINT' && e.plannedMs !== null && e.elapsedMs > e.plannedMs)) {
      push('LATE_CHECKPOINT', `${e.label}: trễ ${Math.round((e.elapsedMs-e.plannedMs!)/1000)} giây so với mốc tự đặt.`, 'Thử chuyển hoạt động ở mốc đã đặt.', 'Đo độ trễ tại cùng checkpoint; không tự suy ra điểm mất.')
    }
    if (r.correct === null || r.answered === null || r.answered === 0 || used === 0) {
      push('INSUFFICIENT_EVIDENCE','N/A: thiếu số đúng/đã làm hoặc thời gian.', 'Bổ sung dữ liệu nếu có; không suy đoán accuracy hay nguyên nhân.', 'Ghi số câu và checkpoint.', 'UNDETERMINED'); return
    }
    const accuracy = r.correct/r.answered
    const evidence = `${r.correct}/${r.answered} đúng (${Math.round(accuracy*100)}%); dùng ${Math.round(ratio*100)}% thời lượng tự đặt.`
    if (accuracy < thresholds.lowAccuracy && ratio >= thresholds.slowTime) push('SLOW_AND_INACCURATE', evidence, 'Ưu tiên xem lại kiến thức và phân loại lỗi trước khi ép tốc độ.', 'Giữ thời lượng; ghi loại lỗi ở lần sau.', 'LIKELY')
    else if (accuracy >= thresholds.highAccuracy && ratio >= thresholds.slowTime) push('ACCURATE_BUT_SLOW', evidence, s.fixedAudio ? 'Phần nghe theo audio: không rút ngắn bằng ép tốc độ phát.' : 'Thử tăng tốc nhẹ với điều kiện giữ độ chính xác.', s.fixedAudio ? 'Theo dõi số câu bỏ lỡ, giữ đúng audio đề.' : 'Chỉ giảm tối đa 5% thời lượng; dừng thử nếu accuracy giảm.', 'LIKELY')
    else if (accuracy < thresholds.lowAccuracy && ratio <= thresholds.fastTime) push('FAST_BUT_INACCURATE', evidence, 'Thử chậm lại để kiểm chứng căn cứ chọn đáp án.', 'Giữ thời lượng; đo accuracy và số câu bỏ trống.', 'LIKELY')
    else if (accuracy >= thresholds.highAccuracy && ratio <= thresholds.fastTime) push('EFFICIENT', evidence, 'Kiểm tra độ ổn định trên đề có độ khó tương đương.', 'So sánh ít nhất hai lần; chưa suy ra năng lực thi thật.', 'LIKELY')
    else push('BALANCED_OR_UNCERTAIN', evidence, 'Chưa thấy mẫu rõ theo ngưỡng thử nghiệm.', 'Thu thập thêm lần luyện tương đương.', 'UNDETERMINED')
  })
  if (!a.events.some(e => e.kind === 'CHECKPOINT')) out.push({code:'NO_SPLITS',section:'Toàn phiên',evidence:'N/A: chưa ghi checkpoint nội bộ.',certainty:'UNDETERMINED',recommendation:'Không thể xác định bottleneck trong phần.',trial:'Ghi mốc kết thúc ngữ pháp/bắt đầu đọc ở lần sau.'})
  return out
}
export function comparable(a: Attempt, b: Attempt): { ok: boolean; reasons: string[] } {
  const reasons: string[] = []
  if (a.id === b.id) reasons.push('Cần hai phiên khác nhau.')
  if (a.status !== 'COMPLETED' || b.status !== 'COMPLETED') reasons.push('Phiên chưa hoàn tất.')
  if (JSON.stringify(a.config) !== JSON.stringify(b.config)) reasons.push('Khác kỳ thi/cấp/cấu hình/phiên bản/thời lượng.')
  if (a.mode !== b.mode || JSON.stringify([...a.flags].sort()) !== JSON.stringify([...b.flags].sort())) reasons.push('Khác điều kiện luyện hoặc gián đoạn.')
  if (!a.difficulty || !b.difficulty || a.difficulty !== b.difficulty) reasons.push('Độ khó chưa biết hoặc không tương đương.')
  if (a.material === b.material) reasons.push('Cùng đề có hiệu ứng ghi nhớ; chỉ xem song song.')
  if (JSON.stringify(a.results.map(r => [r.scoreKind,r.max,r.provenance])) !== JSON.stringify(b.results.map(r => [r.scoreKind,r.max,r.provenance]))) reasons.push('Khác loại điểm/thang điểm/nguồn điểm.')
  return {ok: reasons.length === 0, reasons}
}
