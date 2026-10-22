import {test,expect,type Page} from '@playwright/test'
const sentence='私は画面の実装とAPI連携を担当しました。'
async function prepare(page:Page){
 await page.goto('/');await page.getByRole('button',{name:'Phỏng vấn & Retry',exact:true}).click()
 await page.getByRole('article').filter({has:page.getByRole('heading',{name:'Vai trò trong dự án',exact:true})}).getByRole('button').click()
 await page.getByLabel('Câu trả lời tiếng Nhật (text)').fill(sentence);await page.getByRole('button',{name:'Gửi câu trả lời & xem feedback'}).click();await expect(page.getByRole('heading',{name:'Evidence Inspector',exact:true})).toBeVisible()
}
function fixture(body:Record<string,unknown>){return {source:'AI_MODEL',provider:'openai',model:'fixture-model',rubricVersion:'job-text-v1',utteranceId:body.utteranceId,transcriptVersion:body.transcriptVersion,criteria:['intent','specificity','structure'].map(id=>({criterionId:id,score:2,annotations:[{id:crypto.randomUUID(),criterionId:id,utteranceId:body.utteranceId,transcriptVersion:body.transcriptVersion,quote:body.text,startOffset:0,endOffset:(body.text as string).length,startMs:0,endMs:body.endMs,reason:'Nhận xét từ fixture kiểm thử, không phải AI thật.',suggestion:'Bổ sung kết quả có căn cứ nếu đúng trải nghiệm.',certainty:'MODEL_ASSESSMENT'}]})),followUp:{question:'その作業の結果を教えてください。',quote:body.text,reason:'Fixture follow-up gắn chứng cứ.'},limitation:'Kết quả mô hình có thể sai.'}}
async function mockAvailable(page:Page,invalid=false){
 const id=crypto.randomUUID(),token='fixture-memory-only-token-'.repeat(2)
 let sent=0,removed=0
 await page.route('**/api/v1/system/provider-capabilities',route=>route.fulfill({json:{aiFeedback:{available:true,state:'AVAILABLE',provider:'openai',model:'fixture-model',retentionSeconds:900},externalMedia:{showText:false,playAudio:false,embedImage:false,cache:false}}}))
 await page.route('**/api/v1/ai/interviews',route=>route.fulfill({status:201,json:{id,capabilityToken:token,expiresAt:'2026-10-21T00:15:00Z'}}))
 await page.route(`**/api/v1/ai/interviews/${id}/feedback`,route=>{sent++;expect(route.request().headers().authorization).toBe(`Bearer ${token}`);const result=fixture(route.request().postDataJSON());if(invalid)result.criteria[0]!.annotations[0]!.quote='fabricated quote';return route.fulfill({json:result})})
 await page.route(`**/api/v1/ai/interviews/${id}`,route=>{removed++;return route.fulfill({status:204})})
 return {sent:()=>sent,removed:()=>removed,token}
}
test('real Spring backend advertises disabled AI; local practice still completes without consent or provider',async({page,request})=>{
 const response=await request.get('http://127.0.0.1:8080/api/v1/system/provider-capabilities');expect(response.ok()).toBe(true);expect((await response.json()).aiFeedback.available).toBe(false)
 await prepare(page)
 await expect(page.getByRole('button',{name:'Yêu cầu AI đánh giá',exact:true})).toBeDisabled()
 await expect(page.locator('.ai-panel').getByRole('status')).toContainText('Backend chưa cấu hình AI')
 await expect(page.getByTestId('interview-transcript')).toHaveText(sentence)
 await expect(page.getByText('Điểm tự đánh giá: N/A',{exact:true})).toBeVisible()
})
test('consent gates fixture AI, exact evidence persists, token is absent from backup, editing invalidates AI',async({page})=>{
 const mock=await mockAvailable(page);await prepare(page)
 await expect(page.getByRole('button',{name:'Yêu cầu AI đánh giá',exact:true})).toBeDisabled();expect(mock.sent()).toBe(0)
 await page.getByLabel('Tôi đồng ý gửi câu hỏi, rubric').check();await page.getByRole('button',{name:'Yêu cầu AI đánh giá',exact:true}).click()
 await expect(page.getByText('Điểm AI tham khảo: 67 / 100',{exact:true})).toBeVisible();await expect.poll(mock.removed).toBe(1)
 await expect(page.getByText('Điểm tự đánh giá: N/A',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Đánh dấu chứng cứ trên transcript'}).first().click();await expect(page.getByTestId('interview-transcript').locator('mark')).toHaveText(sentence)
 const stored=await page.evaluate(async()=>{const request=indexedDB.open('brse-interviews');const db:IDBDatabase=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=reject});const tx=db.transaction('attempts');const req=tx.objectStore('attempts').getAll();return await new Promise<string>((resolve,reject)=>{req.onsuccess=()=>{db.close();resolve(JSON.stringify(req.result))};req.onerror=reject})})
 expect(stored).not.toContain(mock.token);expect(stored).toContain('AI_MODEL')
 await page.reload();await page.getByRole('button',{name:'Phỏng vấn & Retry',exact:true}).click();await page.getByRole('button',{name:'Lịch sử Interview',exact:true}).click();await page.getByRole('button',{name:'Mở feedback & retry'}).click();await expect(page.getByText('Điểm AI tham khảo: 67 / 100',{exact:true})).toBeVisible()
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Sửa transcript',exact:true}).click();await expect(page.getByText('Điểm AI tham khảo: 67 / 100',{exact:true})).not.toBeVisible()
 await page.getByRole('button',{name:'Gửi câu trả lời & xem feedback'}).click();await expect(page.getByRole('heading',{name:'Transcript v2'})).toBeVisible();await expect(page.getByText('Điểm AI tham khảo: 67 / 100',{exact:true})).not.toBeVisible()
})
test('invalid fixture evidence and provider outage preserve saved local answer and self-review',async({page})=>{
 await mockAvailable(page,true);await prepare(page);await page.getByLabel('Tôi đồng ý gửi câu hỏi, rubric').check();await page.getByRole('button',{name:'Yêu cầu AI đánh giá',exact:true}).click()
 await expect(page.locator('.ai-panel').getByRole('status')).toContainText('feedback local')
 await expect(page.getByText('Điểm AI tham khảo: 67 / 100',{exact:true})).not.toBeVisible();await expect(page.getByTestId('interview-transcript')).toHaveText(sentence)
 await page.route('**/api/v1/ai/interviews/*/feedback',route=>route.fulfill({status:503,json:{code:'PROVIDER_UNAVAILABLE'}}))
 await page.getByRole('button',{name:'Yêu cầu AI đánh giá',exact:true}).click();await expect(page.locator('.ai-panel').getByRole('status')).toContainText('AI provider chưa khả dụng')
 await expect(page.getByTestId('interview-transcript')).toHaveText(sentence)
})
test('fixture AI criterion can be explicitly queued with model provenance and no automatic retry',async({page})=>{
 await mockAvailable(page);await prepare(page);await page.getByLabel('Tôi đồng ý gửi câu hỏi, rubric').check();await page.getByRole('button',{name:'Yêu cầu AI đánh giá',exact:true}).click();await expect(page.getByText('Điểm AI tham khảo: 67 / 100',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Đưa AI feedback này vào hàng đợi',exact:true}).first().click();await page.getByRole('button',{name:'Hàng đợi luyện lại',exact:true}).click();const item=page.getByTestId('queue-item');await expect(item).toContainText('AI_MODEL');await expect(item).toContainText('fixture-model');await expect(item).toContainText('Chưa tạo retry.');await expect(item.getByRole('button',{name:'Tự đánh dấu đã luyện',exact:true})).toBeDisabled()
})
