import { createAttempt, finishSection, nextSection } from '../../src/domain/timer'
import { practiceConfig } from '../../src/domain/profiles'
import { test, expect, type Page } from '@playwright/test'
async function start(page:Page, seconds=60) {
  await page.getByRole('button',{name:'Bắt đầu một phiên luyện'}).click()
  await page.getByLabel('Tên / mã đề sách hoặc PDF').fill('Sách N3 · Đề 01')
  await page.getByLabel('Nhóm độ khó tương đương').fill('N3 cơ bản')
  for(let i=0;i<3;i++) await page.locator(`#minutes-${i}`).fill(String(seconds/60))
  await page.getByLabel('Tôi đã chỉnh thời lượng').check()
  await page.getByRole('button',{name:'Bắt đầu bấm giờ'}).click()
  await expect(page.getByTestId('timer')).toBeVisible()
}
async function endSection(page:Page) {
  page.once('dialog',d=>d.accept())
  await page.getByRole('button',{name:'Kết thúc phần',exact:true}).click()
}
test('guest -> selector -> timer -> split -> pause/reload -> scores -> strategy -> history -> export/import',async({page})=>{
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Luyện có mục tiêu.'})).toBeVisible()
  await start(page)
  await page.getByLabel('Mốc dự kiến từ đầu phần').fill('0')
  await page.getByRole('button',{name:'+ Ghi split'}).click()
  await expect(page.locator('.timeline')).toContainText('Bắt đầu đọc')
  await page.getByRole('button',{name:'Tạm dừng',exact:true}).click()
  await page.reload()
  await page.getByRole('button',{name:'Exam Time & Strategy'}).click()
  await expect(page.getByRole('button',{name:'Tiếp tục bấm giờ'})).toBeVisible()
  await expect(page.locator('.timeline')).toContainText('Bắt đầu đọc')
  await page.getByRole('button',{name:'Tiếp tục bấm giờ'}).click()
  for(let i=0;i<3;i++) {
    await endSection(page)
    if(i<2) await page.getByRole('button',{name:'Bắt đầu phần tiếp theo'}).click()
  }
  await expect(page.getByRole('heading',{name:'Kết quả & chiến lược'})).toBeVisible()
  const first=page.locator('.score-section').first()
  await first.getByLabel('Tổng câu',{exact:true}).fill('20')
  await first.getByLabel('Đã làm',{exact:true}).fill('17')
  await first.getByLabel('Đúng',{exact:true}).fill('18')
  await expect(page.getByRole('button',{name:'Lưu điểm & phân tích'})).toBeDisabled()
  await expect(first.getByRole('alert')).toContainText('không được vượt')
  await first.getByLabel('Đúng',{exact:true}).fill('12')
  await page.getByRole('button',{name:'Lưu điểm & phân tích'}).click()
  await expect(page.locator('.findings')).toContainText('Còn 3 câu chưa làm')
  await expect(page.locator('.findings')).toContainText('INSUFFICIENT_EVIDENCE')
  await page.getByRole('button',{name:'Lịch sử luyện tập'}).click()
  await expect(page.locator('.history-list')).toContainText('Sách N3 · Đề 01')
  await page.reload(); await page.getByRole('button',{name:'Lịch sử luyện tập'}).click()
  await page.getByRole('button',{name:'Kết quả & so sánh'}).click()
  await expect(page.locator('.findings')).toContainText('Còn 3 câu chưa làm')
  await page.getByRole('button',{name:'Dữ liệu của tôi'}).click()
  const downloadPromise=page.waitForEvent('download')
  await page.getByRole('button',{name:'Xuất backup JSON'}).click()
  const download=await downloadPromise;const path=await download.path();expect(path).toBeTruthy()
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Xóa toàn bộ dữ liệu exam'}).click()
  await expect(page.getByRole('status')).toContainText('Đã xóa')
  await page.getByRole('button',{name:'Lịch sử luyện tập'}).click();await expect(page.getByText('Chưa có phiên luyện nào')).toBeVisible()
  await page.getByRole('button',{name:'Dữ liệu của tôi'}).click()
  page.once('dialog',d=>d.accept());await page.locator('input[type=file]').setInputFiles(path!)
  await expect(page.getByRole('status')).toContainText('Đã khôi phục')
  await page.getByRole('button',{name:'Lịch sử luyện tập'}).click();await expect(page.locator('.history-list')).toContainText('Sách N3')
})
test('running reload recovers elapsed, auto-expiry locks one part and starts next explicitly',async({page})=>{
  await page.goto('/'); await start(page,2)
  await page.waitForTimeout(700); await page.reload();await page.getByRole('button',{name:'Exam Time & Strategy'}).click()
  await expect(page.getByRole('button',{name:'Bắt đầu phần tiếp theo'})).toBeVisible({timeout:5000})
  await expect(page.getByTestId('timer')).toHaveText('00:00')
  await page.waitForTimeout(300)
  await expect(page.getByText('Phần 1 / 3')).toBeVisible()
  await page.getByRole('button',{name:'Bắt đầu phần tiếp theo'}).click()
  await expect(page.getByText('Phần 2 / 3')).toBeVisible()
})
test('invalid import preserves current data and mobile layout has no horizontal overflow',async({page})=>{
  await page.setViewportSize({width:360,height:800});await page.goto('/');await start(page)
  await page.getByRole('button',{name:'Dữ liệu của tôi'}).click()
  await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":99}')})
  await expect(page.getByRole('status')).toContainText('Không nhập được')
  await page.getByRole('button',{name:'Lịch sử luyện tập'}).click();await expect(page.locator('.history-list')).toContainText('Sách N3')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
test('production shell and exam workflow run offline after initial cache is ready',async({page,context})=>{
  await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready})
  await context.setOffline(true);await page.reload()
  await expect(page.getByRole('heading',{name:'Luyện có mục tiêu.'})).toBeVisible()
  await start(page)
  await page.getByRole('button',{name:'+ Ghi split'}).click()
  await expect(page.locator('.timeline')).toContainText('Bắt đầu đọc')
  for(let i=0;i<3;i++) {
    await endSection(page)
    if(i<2) await page.getByRole('button',{name:'Bắt đầu phần tiếp theo'}).click()
  }
  await page.getByRole('button',{name:'Lưu điểm & phân tích'}).click()
  await expect(page.locator('.findings')).toContainText('INSUFFICIENT_EVIDENCE')
  await page.reload()
  await page.getByRole('button',{name:'Lịch sử luyện tập'}).click()
  await page.getByRole('button',{name:'Kết quả & so sánh'}).click()
  await expect(page.locator('.findings')).toContainText('INSUFFICIENT_EVIDENCE')
  await context.setOffline(false)
})

test('history compares matching conditions and flags a different configuration',async({page})=>{
  const make=(material:string)=>{
    const a=createAttempt(practiceConfig('JLPT','N3'),material,'N3 cơ bản',1000)
    for(let i=0;i<3;i++) { finishSection(a,10000+i*20000,i,true);if(i<2)nextSection(a,11000+i*20000) }
    a.results[0]={...a.results[0]!,total:20,answered:20,correct:18}
    return a
  }
  const a=make('Đề A'), b=make('Đề B')
  const importBackup=async()=>{
    page.once('dialog',d=>d.accept())
    await page.locator('input[type=file]').setInputFiles({name:'comparison.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'BRSE_EXAM_BACKUP',schemaVersion:1,attempts:[a,b]}))})
    await expect(page.getByRole('status')).toContainText('Đã khôi phục')
    await page.getByRole('button',{name:'Lịch sử luyện tập'}).click()
    await page.locator('.history-item').filter({has:page.getByRole('heading',{name:'Đề A',exact:true})}).getByRole('button').click()
    await page.getByLabel('Chọn phiên đã hoàn tất').selectOption(b.id)
  }
  await page.goto('/');await page.getByRole('button',{name:'Dữ liệu của tôi'}).click()
  await importBackup()
  await expect(page.getByText('COMPARABLE · Cùng cấu hình và điều kiện tự khai báo',{exact:true})).toBeVisible()
  b.config.version='different-version'
  await page.getByRole('button',{name:'Dữ liệu của tôi'}).click();await importBackup()
  await expect(page.getByText('NOT_COMPARABLE · Chỉ xem song song',{exact:true})).toBeVisible()
  await expect(page.getByText('Khác kỳ thi/cấp/cấu hình/phiên bản/thời lượng.',{exact:true})).toBeVisible()
})
