export const MAX_VOICE_MS=120000
export const MAX_AUDIO_BYTES=10*1024*1024
export interface VoiceStream {getTracks():{stop():void}[]}
export interface Recorder {
  state:string;mimeType:string
  ondataavailable:((e:{data:Blob})=>void)|null
  onstop:(()=>void)|null;onerror:(()=>void)|null
  start(timeslice?:number):void;stop():void
}
export interface RecognitionResult {isFinal:boolean;0:{transcript:string;confidence:number}}
export interface Recognition {
  lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number
  onresult:((e:{results:ArrayLike<RecognitionResult>})=>void)|null
  onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null
  start():void;stop():void;abort():void
}
export interface VoiceDependencies {
  getStream:()=>Promise<VoiceStream>
  recorder:(stream:VoiceStream)=>Recorder
  recognition?:(()=>Recognition)
  createUrl:(blob:Blob)=>string;revokeUrl:(url:string)=>void;now:()=>number
}
export interface VoiceState {
  phase:'IDLE'|'REQUESTING'|'RECORDING'|'STOPPING'|'RECOGNIZING'
  audioUrl:string|null;transcript:string;interim:string;confidence:number|null;captureDurationMs:number;message:string;error:string|null
}
export const initialVoiceState=():VoiceState=>({phase:'IDLE',audioUrl:null,transcript:'',interim:'',confidence:null,captureDurationMs:0,message:'',error:null})
const errorMessages:Record<string,string>={
  NotAllowedError:'Microphone bị từ chối. Bạn vẫn có thể nhập câu trả lời bằng text.',
  NotFoundError:'Không tìm thấy microphone. Hãy dùng text hoặc kiểm tra thiết bị.',
  NotReadableError:'Microphone đang bận hoặc không đọc được. Hãy dùng text và thử lại sau.',
  'not-allowed':'Quyền nhận dạng giọng nói bị từ chối. Bạn vẫn có thể nhập text.',
  'service-not-allowed':'Dịch vụ nhận dạng của trình duyệt không được phép. Hãy dùng text.',
  'audio-capture':'Không thu được âm thanh từ microphone. Hãy kiểm tra thiết bị hoặc nhập text.',
  network:'Dịch vụ nhận dạng không kết nối được. Không giả định nhận dạng chạy offline; hãy dùng text.',
  'no-speech':'Chưa nhận được tiếng nói. Thử lại hoặc nhập text.',
  'language-not-supported':'Trình duyệt chưa hỗ trợ nhận dạng tiếng Nhật. Hãy dùng text.',
}
export class VoiceController {
  private state=initialVoiceState();private generation=0;private disposed=false
  private stream:VoiceStream|null=null;private recorder:Recorder|null=null;private recognition:Recognition|null=null
  private timer:ReturnType<typeof setTimeout>|undefined;private startAt=0
  constructor(private deps:VoiceDependencies,private changed:(state:VoiceState)=>void){}
  private update(patch:Partial<VoiceState>){if(this.disposed)return;this.state={...this.state,...patch};this.changed({...this.state})}
  private clearTimer(){clearTimeout(this.timer);this.timer=undefined}
  private releaseStream(){this.stream?.getTracks().forEach(t=>t.stop());this.stream=null}
  private duration(){return Math.min(MAX_VOICE_MS,Math.max(0,this.deps.now()-this.startAt))}
  private fail(code:string){this.clearTimer();this.releaseStream();this.update({phase:'IDLE',error:code,message:errorMessages[code]??'Không dùng được âm thanh lúc này. Bạn vẫn có thể nhập text.'})}
  async record(consent:boolean){
    if(this.disposed||this.state.phase!=='IDLE')return
    if(!consent){this.update({error:'CONSENT_REQUIRED',message:'Cần đồng ý ghi âm local trước khi mở microphone.'});return}
    const generation=++this.generation;this.update({phase:'REQUESTING',error:null,message:'Đang xin quyền microphone…'})
    try{
      const stream=await this.deps.getStream()
      if(this.disposed||generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return}
      this.stream=stream;const recorder=this.deps.recorder(stream);this.recorder=recorder
      let chunks:Blob[]=[],bytes=0,tooLarge=false
      recorder.ondataavailable=e=>{if(this.disposed||generation!==this.generation)return;bytes+=e.data.size;if(bytes>MAX_AUDIO_BYTES){tooLarge=true;chunks=[];this.stopRecording();return}if(!tooLarge&&e.data.size)chunks.push(e.data)}
      recorder.onstop=()=>{
        if(this.disposed||generation!==this.generation)return
        this.clearTimer();this.releaseStream();this.recorder=null
        if(tooLarge){this.update({phase:'IDLE',error:'AUDIO_TOO_LARGE',message:'Bản ghi vượt 10 MiB và đã được bỏ. Hãy ghi một đoạn ngắn hơn.'});return}
        const blob=new Blob(chunks,{type:recorder.mimeType||chunks[0]?.type||'audio/webm'});chunks=[]
        if(!blob.size){this.fail('EMPTY_RECORDING');return}
        if(this.state.audioUrl)this.deps.revokeUrl(this.state.audioUrl)
        this.update({phase:'IDLE',audioUrl:this.deps.createUrl(blob),error:null,message:'Bản ghi của bạn chỉ ở bộ nhớ trang này. Không tải lên hoặc lưu vào lịch sử.'})
      }
      recorder.onerror=()=>{if(generation!==this.generation||this.disposed)return;this.generation++;this.recorder=null;this.fail('RECORDING_FAILED');try{if(recorder.state!=='inactive')recorder.stop()}catch{}}
      this.startAt=this.deps.now();recorder.start(1000);this.update({phase:'RECORDING',message:'Đang ghi âm local. Tự dừng sau tối đa 2 phút.',error:null});this.timer=setTimeout(()=>this.stopRecording(),MAX_VOICE_MS)
    }catch(error){if(generation===this.generation&&!this.disposed){this.generation++;const recorder=this.recorder;this.recorder=null;this.fail(error instanceof Error?error.name:'MIC_FAILED');try{if(recorder&&recorder.state!=='inactive')recorder.stop()}catch{}}}
  }
  stopRecording(){
    if(!this.recorder||!['RECORDING','REQUESTING'].includes(this.state.phase))return
    this.clearTimer();this.update({phase:'STOPPING'});this.releaseStream()
    this.timer=setTimeout(()=>{this.generation++;this.recorder=null;this.fail('RECORDING_STOP_TIMEOUT')},2000)
    try{if(this.recorder.state!=='inactive')this.recorder.stop()}catch{this.recorder=null;this.fail('RECORDING_FAILED')}
  }
  recognize(consent:boolean){
    if(this.disposed||this.state.phase!=='IDLE')return
    if(!consent){this.update({error:'ASR_CONSENT_REQUIRED',message:'Cần đồng ý riêng với dịch vụ nhận dạng của trình duyệt.'});return}
    if(!this.deps.recognition){this.update({error:'ASR_UNSUPPORTED',message:'Trình duyệt chưa có Speech Recognition. Dùng ghi âm local hoặc nhập text.'});return}
    const generation=++this.generation;let recognition:Recognition
    try{recognition=this.deps.recognition()}catch{this.fail('ASR_START_FAILED');return}this.recognition=recognition
    recognition.lang='ja-JP';recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=1
    this.startAt=this.deps.now();this.update({phase:'RECOGNIZING',transcript:'',interim:'',confidence:null,error:null,captureDurationMs:0,message:'Đang nhận dạng tiếng Nhật. Chỉ bản nhận dạng cuối mới được chuyển sang bước kiểm tra.'})
    recognition.onresult=e=>{
      if(generation!==this.generation||this.disposed)return
      let text='',interim='';const confidence:number[]=[];let missing=false
      for(let i=0;i<e.results.length;i++){
        const result=e.results[i],alternative=result?.[0]
        if(!result||typeof result.isFinal!=='boolean'||!alternative||typeof alternative.transcript!=='string'){this.abortRecognition();this.update({error:'ASR_RESULT_INVALID',message:'Trình duyệt trả về kết quả nhận dạng không hợp lệ. Hãy dùng text hoặc thử lại.'});return}
        if(result.isFinal){text+=alternative.transcript;const c=alternative.confidence;if(Number.isFinite(c)&&c>=0&&c<=1)confidence.push(c);else missing=true}
        else interim+=alternative.transcript
      }
      if(text.length+interim.length>10000){this.abortRecognition();this.update({transcript:'',interim:'',error:'TRANSCRIPT_TOO_LONG',message:'Nhận dạng vượt 10.000 ký tự. Kết quả không được tự cắt/chấm; hãy thử đoạn ngắn hơn.'});return}
      this.update({transcript:text,interim,confidence:!missing&&confidence.length?Math.min(...confidence):null,captureDurationMs:this.duration()})
    }
    recognition.onerror=e=>{if(generation!==this.generation||this.disposed)return;this.generation++;this.recognition=null;this.fail(e.error);try{recognition.abort()}catch{}}
    recognition.onend=()=>{if(generation!==this.generation||this.disposed)return;this.clearTimer();this.recognition=null;this.update({phase:'IDLE',interim:'',captureDurationMs:this.duration(),message:this.state.transcript?'Hãy sửa và xác nhận transcript trước khi dùng làm câu trả lời.':'Chưa có transcript cuối. Bạn có thể thử lại hoặc nhập text.'})}
    try{recognition.start();this.timer=setTimeout(()=>this.stopRecognition(),MAX_VOICE_MS)}catch{this.recognition=null;this.fail('ASR_START_FAILED')}
  }
  stopRecognition(){if(!this.recognition||this.state.phase!=='RECOGNIZING')return;this.clearTimer();this.update({phase:'STOPPING',captureDurationMs:this.duration()});this.timer=setTimeout(()=>this.abortRecognition(),2000);try{this.recognition.stop()}catch{this.abortRecognition()}}
  abortRecognition(){const recognition=this.recognition;this.recognition=null;this.generation++;this.clearTimer();try{recognition?.abort()}catch{}this.update({phase:'IDLE',interim:'',message:'Đã dừng nhận dạng. Chưa gửi/chấm câu trả lời.'})}
  cancelPending(){if(this.state.phase!=='REQUESTING')return;this.generation++;this.update({phase:'IDLE',message:'Đã hủy chờ microphone. Nếu trình duyệt vẫn hiện hộp quyền, bạn có thể đóng nó.'})}
  clearAudio(){if(this.state.audioUrl)this.deps.revokeUrl(this.state.audioUrl);this.update({audioUrl:null,message:'Đã xóa bản ghi khỏi bộ nhớ trang.'})}
  dispose(){
    this.disposed=true;this.generation++;this.clearTimer();this.releaseStream()
    if(this.recorder){this.recorder.ondataavailable=null;this.recorder.onstop=null;this.recorder.onerror=null;try{if(this.recorder.state!=='inactive')this.recorder.stop()}catch{}this.recorder=null}
    if(this.recognition){this.recognition.onresult=null;this.recognition.onerror=null;this.recognition.onend=null;try{this.recognition.abort()}catch{}this.recognition=null}
    if(this.state.audioUrl)this.deps.revokeUrl(this.state.audioUrl)
  }
}
