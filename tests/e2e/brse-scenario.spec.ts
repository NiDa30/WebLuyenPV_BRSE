import {test,expect,type Page} from '@playwright/test'
const reply='要件と影響を確認します。明日、担当者から報告します。'
async function launch(page:Page){await page.goto('/');await page.getByRole('button',{name:'Phỏng vấn & Retry',exact:true}).click();await page.getByLabel('Track luyện tập').selectOption('BRSE');await page.getByRole('button',{name:'Bắt đầu tình huống CSV',exact:true}).click()}
async function send(page:Page,text=reply){await page.getByLabel('Câu trả lời tiếng Nhật (text)').fill(text);await page.getByRole('button',{name:'Gửi câu trả lời & xem feedback'}).click();await expect(page.getByRole('heading',{name:'Evidence Inspector',exact:true})).toBeVisible()}
async function back(page:Page){await page.getByRole('button',{name:'← Báo cáo phiên · chọn lượt tiếp theo',exact:true}).click()}
test('CSV conversation maintains versioned context, backup, safe rendering and downstream invalidation',async({page})=>{
  test.setTimeout(60000);await launch(page);const report=page.getByTestId('session-report')
  await expect(report).toContainText('Yêu cầu xuất CSV gấp');await expect(page.getByRole('button',{name:'Trả lời lượt 2',exact:true})).toBeDisabled()
  for(let i=1;i<=3;i++){
    await page.getByRole('button',{name:`Trả lời lượt ${i}`,exact:true}).click()
    const context=page.getByTestId('scenario-context');await expect(context).toContainText('KỊCH BẢN CỐ ĐỊNH')
    await expect(context.getByTestId('scenario-prior-answer')).toHaveCount(i-1)
    if(i>1){await expect(context).toContainText('Kết quả kiểm tra của nhóm');await expect(context.getByTestId('scenario-prior-answer').first()).toContainText('要件')}
    await send(page,i===1?reply+' <img src=x onerror="window.bad=true">':reply)
    await expect(context.locator('img')).toHaveCount(0)
    for(const criterion of ['clarify','impact','actions']){
      await page.getByLabel('Tiêu chí rubric').selectOption(criterion);await page.getByLabel('Trích dẫn chính xác từ transcript').fill('要件');await page.getByLabel('Giải thích điểm & việc cần sửa').fill('Cần xác nhận thông tin giả lập với khách.');await page.getByRole('button',{name:'Lưu tự đánh giá có chứng cứ'}).click();await expect(page.getByRole('status').filter({hasText:'Đã lưu tự đánh giá có chứng cứ'})).toBeVisible()
    }
    await back(page)
  }
  await expect(report).toContainText('3/3 lượt đã gửi');await expect(report).toContainText('Tự đánh giá toàn phiên: 33 / 100')
  await page.getByRole('button',{name:'Mở chứng cứ lượt 1',exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Sửa transcript',exact:true}).click();await send(page,'要件をもう一度確認します。');await back(page)
  await expect(report.getByRole('alert')).toContainText('Ngữ cảnh đã thay đổi ở 2 lượt');await expect(report).toContainText('Tự đánh giá toàn phiên: N/A')
  await expect(page.getByRole('button',{name:'Independent Retry toàn phiên',exact:true})).toHaveCount(0)
  await page.getByRole('button',{name:'Backup Interview',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất Interview JSON',exact:true}).click();const path=await (await pending).path()
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Xóa toàn bộ Interview',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Đã xóa dữ liệu Interview.'})).toBeVisible()
  page.once('dialog',d=>d.accept());await page.locator('.interview-workspace input[type=file]').setInputFiles(path!);await expect(page.getByRole('status').filter({hasText:'Đã khôi phục dữ liệu Interview.'})).toBeVisible()
  await page.reload();await page.getByRole('button',{name:'Phỏng vấn & Retry',exact:true}).click();await page.getByRole('button',{name:'Phiên nhiều lượt',exact:true}).click();await page.getByRole('button',{name:'Mở phiên',exact:true}).click()
  await expect(report.getByRole('alert')).toContainText('2 lượt');await expect(page.getByRole('button',{name:'Mở chứng cứ lượt 3',exact:true})).toBeDisabled()
  await page.getByRole('button',{name:'Mở chứng cứ lượt 2',exact:true}).click();await expect(page.getByTestId('scenario-context')).toContainText('transcript v1');await expect(page.getByTestId('scenario-context').getByRole('alert')).toContainText('Ngữ cảnh đã thay đổi')
  await expect(page.locator('.ai-panel')).toHaveCount(0);await expect(page.getByRole('button',{name:'Lưu tự đánh giá có chứng cứ'})).toHaveCount(0)
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Sửa transcript',exact:true}).click();await expect(page.getByTestId('scenario-context')).toContainText('transcript v2');await send(page);await back(page)
  await expect(report.getByRole('alert')).toContainText('1 lượt')
  await page.getByRole('button',{name:'Mở chứng cứ lượt 3',exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Sửa transcript',exact:true}).click();await send(page);await back(page)
  await expect(report).toContainText('3/3 lượt đã gửi');await expect(report.getByRole('alert')).toHaveCount(0);await expect(report).toContainText('Tự đánh giá toàn phiên: N/A')
  await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
test('whole-scenario guided and independent retries separate parent answers from current context',async({page})=>{
  test.setTimeout(60000);await launch(page)
  for(let i=1;i<=3;i++){await page.getByRole('button',{name:`Trả lời lượt ${i}`,exact:true}).click();await send(page,'親の回答だけの特別な文章です。');await back(page)}
  await page.getByRole('button',{name:'Guided Retry toàn phiên',exact:true}).click();await page.getByRole('button',{name:'Trả lời lượt 1',exact:true}).click();await expect(page.getByRole('heading',{name:'Gợi ý Guided Retry'})).toBeVisible();await expect(page.getByLabel('Câu trả lời tiếng Nhật (text)')).toBeEmpty()
  await page.getByRole('button',{name:'Phiên nhiều lượt',exact:true}).click();await page.getByRole('button',{name:'Mở phiên',exact:true}).last().click();await page.getByRole('button',{name:'Independent Retry toàn phiên',exact:true}).click()
  await page.getByRole('button',{name:'Trả lời lượt 1',exact:true}).click();await expect(page.getByRole('heading',{name:'Gợi ý Guided Retry'})).toHaveCount(0);await expect(page.getByText('親の回答だけの特別な文章です。',{exact:true})).toHaveCount(0);await send(page,'今回の会話の確認です。');await back(page)
  await page.getByRole('button',{name:'Trả lời lượt 2',exact:true}).click();await expect(page.getByTestId('scenario-context')).toContainText('今回の会話の確認です。');await expect(page.getByText('親の回答だけの特別な文章です。',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Câu trả lời tiếng Nhật (text)')).toBeEmpty()
})
