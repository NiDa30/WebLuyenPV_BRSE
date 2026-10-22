import {test,expect,type Page} from '@playwright/test'
test.use({launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}})
interface Harness {starts:number;aborts:number;spoken:string[];cancels:number;recognition:{onresult:((e:unknown)=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null}|null}
async function installSpeechFixture(page:Page,unsupported=false){
 await page.addInitScript(({unsupported})=>{
  const harness:Harness={starts:0,aborts:0,spoken:[],cancels:0,recognition:null}
  Object.assign(window,{__voiceFixture:harness})
  class FixtureRecognition {
   lang='';continuous=false;interimResults=false;maxAlternatives=1;onresult:((e:unknown)=>void)|null=null;onend:(()=>void)|null=null;onerror:((e:{error:string})=>void)|null=null
   constructor(){harness.recognition=this}start(){harness.starts++}stop(){this.onend?.()}abort(){harness.aborts++}
  }
  Object.defineProperty(window,'SpeechRecognition',{value:unsupported?undefined:FixtureRecognition,configurable:true})
  Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true})
  class Utterance {lang='';voice:unknown=null;rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(public text:string){}}
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:Utterance,configurable:true})
  const target=new EventTarget()
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{voiceURI:'local-ja',name:'Local Japanese Fixture',lang:'ja-JP',localService:true},{voiceURI:'remote-ja',name:'Remote Japanese Fixture',lang:'ja-JP',localService:false}],addEventListener:target.addEventListener.bind(target),removeEventListener:target.removeEventListener.bind(target),cancel:()=>{harness.cancels++},speak:(utterance:Utterance)=>{harness.spoken.push(utterance.text);setTimeout(()=>utterance.onend?.(),10)}},configurable:true})
 },{unsupported})
}
async function start(page:Page){await page.goto('/');await page.getByRole('button',{name:'Phỏng vấn & Retry',exact:true}).click();await page.getByRole('article').filter({has:page.getByRole('heading',{name:'Vai trò trong dự án',exact:true})}).getByRole('button').click()}
async function finalTranscript(page:Page,text='私は画面の実装を担当しました。',confidence=.45){await page.evaluate(({text,confidence})=>{const h=(window as unknown as {__voiceFixture:Harness}).__voiceFixture;h.recognition!.onresult?.({results:[{isFinal:true,0:{transcript:text,confidence}}]});h.recognition!.onend?.()},{text,confidence})}
test('fixture Japanese ASR -> editable transcript -> explicit review -> draft -> feedback -> reload without audio',async({page})=>{
 await installSpeechFixture(page);await start(page)
 await page.getByText('Nhận dạng tiếng Nhật & kiểm tra transcript',{exact:true}).click()
 const startButton=page.getByRole('button',{name:'Bắt đầu nhận dạng tiếng Nhật',exact:true})
 await expect(startButton).toBeDisabled();expect(await page.evaluate(()=>(window as unknown as {__voiceFixture:Harness}).__voiceFixture.starts)).toBe(0)
 await page.getByLabel('Tôi đồng ý dùng nhận dạng của trình duyệt').check();await startButton.click()
 await page.evaluate(()=>{const h=(window as unknown as {__voiceFixture:Harness}).__voiceFixture;h.recognition!.onresult?.({results:[{isFinal:false,0:{transcript:'担当',confidence:.3}}]})})
 await expect(page.getByLabel('Câu trả lời tiếng Nhật (text)')).toBeEmpty();await expect(page.getByText('Tạm nhận dạng (chưa đưa vào câu trả lời): 担当')).toBeVisible()
 await finalTranscript(page)
 await expect(page.getByText('Độ tin cậy nhận dạng thấp',{exact:false})).toBeVisible()
 await page.getByLabel('Transcript nhận dạng — sửa trước khi dùng').fill('私は入力チェックとAPI連携を担当しました。')
 const apply=page.getByRole('button',{name:'Dùng transcript đã kiểm tra',exact:true});await expect(apply).toBeDisabled()
 await page.getByLabel('Tôi đã kiểm tra và sửa transcript nhận dạng').check();await apply.click()
 await expect(page.getByLabel('Câu trả lời tiếng Nhật (text)')).toHaveValue('私は入力チェックとAPI連携を担当しました。')
 await expect(page.getByRole('heading',{name:'Evidence Inspector',exact:true})).not.toBeVisible()
 await page.getByRole('button',{name:'Gửi câu trả lời & xem feedback'}).click()
 await expect(page.getByTestId('interview-transcript')).toHaveText('私は入力チェックとAPI連携を担当しました。')
 await expect(page.getByText('Có nội dung nhận dạng tiếng Nhật của trình duyệt',{exact:false})).toContainText('REPLACE')
 await expect(page.getByText('Phát âm/âm thanh: N/A',{exact:false})).toBeVisible()
 await page.reload();await page.getByRole('button',{name:'Phỏng vấn & Retry',exact:true}).click();await page.getByRole('button',{name:'Lịch sử Interview',exact:true}).click();await page.getByRole('button',{name:'Mở feedback & retry'}).click()
 await expect(page.getByText('Có nội dung nhận dạng tiếng Nhật của trình duyệt',{exact:false})).toContainText('REPLACE')
 const data=await page.evaluate(async()=>{const req=indexedDB.open('brse-interviews');const db:IDBDatabase=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=reject});const get=db.transaction('attempts').objectStore('attempts').getAll();return new Promise<string>((resolve,reject)=>{get.onsuccess=()=>{db.close();resolve(JSON.stringify(get.result))};get.onerror=reject})})
 expect(data).toContain('BROWSER_ASR_REVIEWED');expect(data).not.toMatch(/blob:|audioUrl|data:audio/)
})
test('ASR errors and unsupported browser retain text fallback; remote TTS needs separate consent',async({page})=>{
 await installSpeechFixture(page);await start(page)
 await page.getByText('Nghe câu hỏi bằng TTS của trình duyệt',{exact:true}).click()
 await page.getByRole('button',{name:'Đọc câu hỏi tiếng Nhật',exact:true}).click()
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {__voiceFixture:Harness}).__voiceFixture.spoken.length)).toBe(1)
 await page.getByLabel('Giọng đọc tiếng Nhật').selectOption('remote-ja')
 await expect(page.getByRole('button',{name:'Đọc câu hỏi tiếng Nhật',exact:true})).toBeDisabled()
 await page.getByLabel('Tôi đồng ý dùng dịch vụ giọng đọc ngoài').check();await page.getByRole('button',{name:'Đọc câu hỏi tiếng Nhật',exact:true}).click()
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {__voiceFixture:Harness}).__voiceFixture.spoken.length)).toBe(2)
 await page.getByText('Nhận dạng tiếng Nhật & kiểm tra transcript',{exact:true}).click();await page.getByLabel('Tôi đồng ý dùng nhận dạng của trình duyệt').check();await page.getByRole('button',{name:'Bắt đầu nhận dạng tiếng Nhật',exact:true}).click()
 await page.evaluate(()=>(window as unknown as {__voiceFixture:Harness}).__voiceFixture.recognition!.onerror?.({error:'not-allowed'}))
 await expect(page.locator('.voice-panel').getByRole('alert')).toContainText('bị từ chối')
 await page.getByLabel('Câu trả lời tiếng Nhật (text)').fill('テキストで回答します。');await page.getByRole('button',{name:'Gửi câu trả lời & xem feedback'}).click();await expect(page.getByTestId('interview-transcript')).toHaveText('テキストで回答します。')
 await page.evaluate(()=>{Object.defineProperty(window,'SpeechRecognition',{value:undefined,configurable:true});Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true})});await page.getByRole('button',{name:'Kho câu hỏi',exact:true}).click();await page.getByRole('article').first().getByRole('button').click();await page.getByText('Nhận dạng tiếng Nhật & kiểm tra transcript',{exact:true}).click();await expect(page.getByText('Speech Recognition chưa được hỗ trợ',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'Bắt đầu nhận dạng tiếng Nhật',exact:true})).toBeDisabled();await expect(page.getByLabel('Câu trả lời tiếng Nhật (text)')).toBeEditable()
})
test('real browser MediaRecorder with synthetic microphone stops tracks and does not persist local audio',async({page,context})=>{
 await context.grantPermissions(['microphone']);await installSpeechFixture(page)
 await page.addInitScript(()=>{const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async constraints=>{const stream=await original(constraints);Object.assign(window,{__testStream:stream});return stream}})
 await page.setViewportSize({width:360,height:800});await start(page)
 await page.getByText('Ghi âm để tự nghe lại (local)',{exact:true}).click();await expect(page.getByRole('button',{name:'Bắt đầu ghi âm local',exact:true})).toBeDisabled()
 await page.getByLabel('Tôi đồng ý mở microphone để ghi âm local').check();await page.getByRole('button',{name:'Bắt đầu ghi âm local',exact:true}).click();await expect(page.getByRole('button',{name:'Dừng ghi âm local',exact:true})).toBeVisible()
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {__testStream:MediaStream}).__testStream.active)).toBe(true)
 await page.waitForTimeout(500);await page.getByRole('button',{name:'Dừng ghi âm local',exact:true}).click()
 await expect(page.getByLabel('Nghe lại bản ghi microphone của bạn')).toHaveAttribute('src',/^blob:/)
 expect(await page.evaluate(()=>(window as unknown as {__testStream:MediaStream}).__testStream.getTracks().every(t=>t.readyState==='ended'))).toBe(true)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.getByRole('button',{name:'Xóa bản ghi local',exact:true}).click();await expect(page.locator('.voice-panel audio')).toHaveCount(0)
 await page.getByRole('button',{name:'Bắt đầu ghi âm local',exact:true}).click();await expect(page.getByRole('button',{name:'Dừng ghi âm local',exact:true})).toBeVisible()
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))})
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {__testStream:MediaStream}).__testStream.getTracks().every(t=>t.readyState==='ended'))).toBe(true)
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'))})
 await page.getByRole('button',{name:'Bắt đầu ghi âm local',exact:true}).click();await expect(page.getByRole('button',{name:'Dừng ghi âm local',exact:true})).toBeVisible();await page.getByRole('button',{name:'Lịch sử Interview',exact:true}).click()
 expect(await page.evaluate(()=>(window as unknown as {__testStream:MediaStream}).__testStream.getTracks().every(t=>t.readyState==='ended'))).toBe(true)
})
