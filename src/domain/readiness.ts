import {z} from 'zod'
export const readinessItems = [
 {id:'audio',group:'Thiết bị',text:'Đã thử nghe và nói bằng thiết bị sẽ dùng'},
 {id:'camera',group:'Thiết bị',text:'Đã kiểm tra camera, khung hình và ánh sáng'},
 {id:'power',group:'Thiết bị',text:'Đã chuẩn bị nguồn điện và tắt thông báo'},
 {id:'network',group:'Kết nối',text:'Đã thử kết nối và đường dẫn cuộc họp'},
 {id:'backup',group:'Kết nối',text:'Đã có phương án mất mạng và cách liên hệ lại'},
 {id:'space',group:'Không gian',text:'Đã chuẩn bị nơi yên tĩnh và nền phù hợp'},
 {id:'materials',group:'Không gian',text:'Đã mở CV, JD và ghi chú được phép dùng'},
 {id:'time',group:'Ứng xử',text:'Đã xác nhận múi giờ và thời điểm tham gia'},
 {id:'clarify',group:'Ứng xử',text:'Đã chuẩn bị cách xin nhắc lại hoặc làm rõ bằng tiếng Nhật'},
 {id:'close',group:'Ứng xử',text:'Đã chuẩn bị lời chào, câu hỏi và lời cảm ơn'},
] as const
export const readinessSchema=z.object({format:z.literal('BRSE_READINESS_BACKUP'),schemaVersion:z.literal(1),checked:z.array(z.enum(readinessItems.map(i=>i.id))).max(10).refine(v=>new Set(v).size===v.length),note:z.string().max(2000),updatedAt:z.number().int().nonnegative().max(8e15).nullable()}).strict()
export type Readiness=z.infer<typeof readinessSchema>
export const emptyReadiness=():Readiness=>({format:'BRSE_READINESS_BACKUP',schemaVersion:1,checked:[],note:'',updatedAt:null})
export function parseReadiness(text:string){if(text.length>20000)throw new Error('Backup vượt 20 KB.');return readinessSchema.parse(JSON.parse(text))}
