import { z } from 'zod'
import { capabilitiesSchema } from './domain/ai-feedback'
import type { Interview } from './domain/interview'
const sessionSchema=z.object({id:z.string().uuid(),capabilityToken:z.string().min(40).max(100),expiresAt:z.string().datetime()})
export class AiRequestError extends Error {
  constructor(readonly code:string) {super(code)}
}
async function json(response:Response) {
  const text=await response.text()
  if(text.length>150000)throw new AiRequestError('RESPONSE_TOO_LARGE')
  let body:unknown
  try{body=JSON.parse(text)}catch{throw new AiRequestError('INVALID_RESPONSE')}
  if(!response.ok){const problem=z.object({code:z.string().max(100)}).safeParse(body);throw new AiRequestError(problem.success?problem.data.code:'SERVER_UNAVAILABLE')}
  return body
}
export async function providerCapabilities(signal?:AbortSignal){return capabilitiesSchema.parse(await json(await fetch('/api/v1/system/provider-capabilities',{signal,cache:'no-store'})))}
export async function requestAiFeedback(a:Interview,signal:AbortSignal) {
  const revision=a.revisions.at(-1)
  if(a.status!=='REVIEWED'||!revision)throw new AiRequestError('TRANSCRIPT_REQUIRED')
  // Token stays in this function only; never Pinia/IndexedDB/backup/URL.
  const session=sessionSchema.parse(await json(await fetch('/api/v1/ai/interviews',{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({track:a.track,rubricVersion:a.rubricVersion,consent:true})})))
  try {
    return await json(await fetch(`/api/v1/ai/interviews/${session.id}/feedback`,{method:'POST',signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.capabilityToken}`},body:JSON.stringify({utteranceId:a.utteranceId,transcriptVersion:revision.version,questionId:a.questionId,mode:a.mode,text:revision.text,endMs:Math.round(revision.endMs)})}))
  }finally {
    // Fresh bounded signal also allows cleanup when the analysis was cancelled.
    void fetch(`/api/v1/ai/interviews/${session.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${session.capabilityToken}`},signal:AbortSignal.timeout(5000)}).catch(()=>{})
  }
}
export function aiErrorMessage(error:unknown) {
  if(error instanceof DOMException&&['AbortError','TimeoutError'].includes(error.name))return 'Đã hủy hoặc hết thời gian chờ AI. Dữ liệu local vẫn được giữ.'
  if(!(error instanceof AiRequestError))return 'Không kết nối được AI hoặc response sai contract. Bạn vẫn có thể dùng feedback local.'
  const messages:Record<string,string>={AI_NOT_CONFIGURED:'Backend chưa cấu hình AI. Tiếp tục luyện bằng rules và tự đánh giá.',PROVIDER_UNAVAILABLE:'AI provider chưa khả dụng. Thử lại sau; dữ liệu local được giữ.',PROVIDER_RATE_LIMITED:'AI provider đang giới hạn yêu cầu. Thử lại sau.',SESSION_LIMIT:'Đã đạt giới hạn phiên AI. Chờ rồi thử lại.',FEEDBACK_LIMIT:'Đã đạt giới hạn đánh giá AI của phiên.',SESSION_NOT_FOUND:'Phiên AI đã hết hạn hoặc không hợp lệ. Hãy yêu cầu đánh giá lại.',PROVIDER_EVIDENCE_INVALID:'AI trả về chứng cứ không khớp transcript. Kết quả đã bị từ chối.',PROVIDER_SCHEMA_MISMATCH:'AI trả về dữ liệu sai cấu trúc. Kết quả đã bị từ chối.',ORIGIN_DENIED:'Backend chưa cho phép địa chỉ giao diện hiện tại. Cần cấu hình origin của ứng dụng.',SERVER_BUSY:'Máy chủ AI đang bận. Hãy thử lại sau.'}
  return messages[error.code]??'Chưa lấy được kết quả AI hợp lệ. Dữ liệu local vẫn được giữ.'
}
