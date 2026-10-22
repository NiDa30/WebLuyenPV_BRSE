import {test,expect,type Page} from '@playwright/test'
import {readFile} from 'node:fs/promises'
const reply='影響を確認します。十時三十分に調査状況を報告します。'
async function start(page:Page,scenario:'production'|'CSV'){
  await page.goto('/');await page.getByRole('button',{name:'Phỏng vấn & Retry',exact:true}).click();await page.getByLabel('Track luyện tập').selectOption('BRSE');await page.getByRole('button',{name:`Bắt đầu tình huống ${scenario}`,exact:true}).click()
}
async function send(page:Page,text=reply){await page.getByLabel('Câu trả lời tiếng Nhật (text)').fill(text);await page.getByRole('button',{name:'Gửi câu trả lời & xem feedback'}).click();await expect(page.getByRole('heading',{name:'Evidence Inspector',exact:true})).toBeVisible()}
async function complete(page:Page){for(let i=1;i<=3;i++){
  await page.getByRole('button',{name:`Trả lời lượt ${i}`,exact:true}).click();await expect(page.getByTestId('scenario-context').getByTestId('scenario-prior-answer')).toHaveCount(i-1)
  if(i>1)await expect(page.getByTestId('scenario-context')).toContainText('Kết quả kiểm tra của nhóm')
  await send(page);await page.getByRole('button',{name:'← Báo cáo phiên · chọn lượt tiếp theo',exact:true}).click()
}}
test('production conversation -> evidence-bound action minutes -> text export -> edit invalidation -> re-review and backup',async({page})=>{
  test.setTimeout(60000);await start(page,'production');await expect(page.getByTestId('session-report')).toContainText('Sự cố lưu đơn production');await complete(page)
  const minutes=page.getByTestId('session-minutes');await expect(minutes.getByRole('button',{name:'Xuất biên bản TXT',exact:true})).toBeDisabled()
  await minutes.getByRole('combobox',{name:'Loại mục',exact:true}).selectOption('ACTION');await minutes.getByLabel('Nội dung biên bản', {exact:true}).fill('Báo cáo điều tra lúc10:30, chưa cam kết khôi phục. <img src=x onerror="window.bad=true">')
  await minutes.getByLabel('Người phụ trách', {exact:true}).fill('BrSE — đề xuất');await minutes.getByLabel('Mốc phản hồi / hạn', {exact:true}).fill('10:30 — cập nhật, không phải ETA')
  await minutes.getByRole('combobox',{name:'Lượt chứng cứ',exact:true}).selectOption({index:3});await minutes.getByLabel('Trích dẫn cho biên bản', {exact:true}).fill('invented')
  await minutes.getByRole('button',{name:'Lưu mục biên bản',exact:true}).click();await expect(minutes.getByRole('alert')).toContainText('không khớp')
  await minutes.getByLabel('Trích dẫn cho biên bản', {exact:true}).fill('十時三十分に調査状況を報告します。');await minutes.getByRole('button',{name:'Lưu mục biên bản',exact:true}).click();await expect(minutes.getByRole('status')).toContainText('Đã lưu mục')
  await expect(minutes.locator('img')).toHaveCount(0);await expect(page.getByTestId('session-report')).toContainText('Tự đánh giá toàn phiên: N/A')
  await minutes.getByRole('button',{name:'Đánh dấu đã rà soát biên bản',exact:true}).click();await expect(minutes).toContainText('ĐÃ RÀ SOÁT · TỰ KHAI')
  const pending=page.waitForEvent('download');await minutes.getByRole('button',{name:'Xuất biên bản TXT',exact:true}).click();const file=await pending;expect(file.suggestedFilename()).toBe('brse-minutes.txt');const exported=await readFile((await file.path())!,'utf8');expect(exported).toContain('KHÔNG PHẢI XÁC NHẬN CỦA KHÁCH');expect(exported).toContain('Đề xuất');expect(exported).toContain('CANDIDATE')
  await page.reload();await page.getByRole('button',{name:'Phỏng vấn & Retry',exact:true}).click();await page.getByRole('button',{name:'Phiên nhiều lượt',exact:true}).click();await page.getByRole('button',{name:'Mở phiên',exact:true}).click();await expect(minutes.getByRole('button',{name:'Xuất biên bản TXT',exact:true})).toBeEnabled()
  await minutes.getByRole('button',{name:'Mở lượt chứng cứ',exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Sửa transcript',exact:true}).click();await send(page);await page.getByRole('button',{name:'← Báo cáo phiên · chọn lượt tiếp theo',exact:true}).click()
  await expect(minutes.getByRole('alert')).toContainText('Biên bản cần rà soát lại');await expect(minutes.getByRole('button',{name:'Xuất biên bản TXT',exact:true})).toBeDisabled()
  await minutes.getByRole('button',{name:'Đánh dấu đã rà soát biên bản',exact:true}).click();await expect(minutes.getByRole('alert').filter({hasText:'Chứng cứ/ngữ cảnh'})).toBeVisible()
  await minutes.getByRole('button',{name:'Sửa mục',exact:true}).click();await minutes.getByRole('button',{name:'Lưu mục biên bản',exact:true}).click();await minutes.getByRole('button',{name:'Đánh dấu đã rà soát biên bản',exact:true}).click();await expect(minutes.getByRole('button',{name:'Xuất biên bản TXT',exact:true})).toBeEnabled();await expect(minutes).toContainText('v2')
  await page.getByRole('button',{name:'Backup Interview',exact:true}).click();const backupPending=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất Interview JSON',exact:true}).click();const backupPath=await (await backupPending).path()
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Xóa toàn bộ Interview',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Đã xóa dữ liệu Interview.'})).toBeVisible();page.once('dialog',d=>d.accept());await page.locator('.interview-workspace input[type=file]').setInputFiles(backupPath!);await expect(page.getByRole('status').filter({hasText:'Đã khôi phục dữ liệu Interview.'})).toBeVisible()
  await page.getByRole('button',{name:'Phiên nhiều lượt',exact:true}).click();await page.getByRole('button',{name:'Mở phiên',exact:true}).click();await expect(minutes.getByRole('button',{name:'Xuất biên bản TXT',exact:true})).toBeEnabled()
  await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
test('customer-source minutes remain self-reported and do not leak into independent scenario retry',async({page})=>{
  await start(page,'CSV');await complete(page);const minutes=page.getByTestId('session-minutes')
  await minutes.getByRole('combobox',{name:'Loại mục',exact:true}).selectOption('DECISION');await minutes.getByLabel('Nội dung biên bản',{exact:true}).fill('PARENT-MINUTE-SECRET');await minutes.getByRole('combobox',{name:'Lượt chứng cứ',exact:true}).selectOption({index:3});await minutes.getByRole('combobox',{name:'Nguồn trích dẫn',exact:true}).selectOption('CUSTOMER')
  await minutes.getByRole('combobox',{name:'Mức xác nhận (tự khai)',exact:true}).selectOption('CONFIRMED');await minutes.getByLabel('Trích dẫn cho biên bản',{exact:true}).fill('一人百件まで');await minutes.getByRole('button',{name:'Lưu mục biên bản',exact:true}).click();await expect(minutes).toContainText('Đã xác nhận (tự khai)');await expect(minutes).toContainText('Lời khách trong kịch bản')
  await minutes.getByRole('button',{name:'Đánh dấu đã rà soát biên bản',exact:true}).click();await page.getByRole('button',{name:'Independent Retry toàn phiên',exact:true}).click();await expect(minutes).toContainText('CHƯA CÓ MỤC');await expect(page.getByText('PARENT-MINUTE-SECRET',{exact:true})).toHaveCount(0);await expect(minutes.getByRole('button',{name:'Xuất biên bản TXT',exact:true})).toBeDisabled()
})
test('background IndexedDB autosave does not disable or swallow answer submission',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Phỏng vấn & Retry',exact:true}).click();await page.getByRole('article').filter({has:page.getByRole('heading',{name:'Vai trò trong dự án',exact:true})}).getByRole('button',{name:'Luyện câu này'}).click();await expect(page.getByText('Đã lưu Interview trên thiết bị',{exact:true})).toBeVisible()
  await page.evaluate(async()=>{
    const request=indexedDB.open('brse-interviews');const db=await new Promise<IDBDatabase>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=reject})
    let hold=true;const tx=db.transaction('attempts','readwrite');tx.oncomplete=()=>db.close();const pump=()=>{if(!hold)return;const req=tx.objectStore('attempts').get('__test_lock__');req.onsuccess=pump};pump();(window as unknown as {releaseInterviewLock:()=>void}).releaseInterviewLock=()=>{hold=false}
  })
  await page.getByLabel('Câu trả lời tiếng Nhật (text)').fill('私は画面の実装を担当しています。');await expect(page.getByText('Đang lưu Interview…',{exact:true})).toBeVisible()
  const button=page.getByRole('button',{name:'Gửi câu trả lời & xem feedback'});await expect(button).toBeEnabled();await button.click();await expect(page.getByRole('heading',{name:'Evidence Inspector',exact:true})).toBeVisible()
  await page.evaluate(()=>(window as unknown as {releaseInterviewLock:()=>void}).releaseInterviewLock());await expect(page.getByText('Đã lưu Interview trên thiết bị',{exact:true})).toBeVisible();await expect(page.getByTestId('interview-transcript')).toHaveText('私は画面の実装を担当しています。')
})
