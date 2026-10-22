import {afterEach,describe,it,expect,vi} from 'vitest'
import {VoiceController,initialVoiceState,MAX_AUDIO_BYTES,MAX_VOICE_MS,type VoiceState,type Recorder,type Recognition,type VoiceDependencies,type VoiceStream} from '../src/voice/controller'
import {canSpeak,japaneseVoices} from '../src/voice/browser'
function setup(options:{denied?:boolean;unsupported?:boolean;pending?:boolean}={}){
 let now=0,state:VoiceState=initialVoiceState(),resolveStream:((s:{getTracks:()=>{stop:()=>void}[]})=>void)|undefined
 const stopTrack=vi.fn(),stream={getTracks:()=>[{stop:stopTrack}]}
 const recorder:Recorder={state:'inactive',mimeType:'audio/webm',ondataavailable:null,onstop:null,onerror:null,start:vi.fn(()=>{recorder.state='recording'}),stop:vi.fn(()=>{recorder.state='inactive';recorder.ondataavailable?.({data:new Blob(['synthetic-local-audio'],{type:'audio/webm'})});recorder.onstop?.()})}
 const recognition:Recognition={lang:'',continuous:false,interimResults:false,maxAlternatives:1,onresult:null,onerror:null,onend:null,start:vi.fn(),stop:vi.fn(()=>recognition.onend?.()),abort:vi.fn()}
 const deps:VoiceDependencies={getStream:vi.fn(()=>options.denied?Promise.reject(Object.assign(new Error('Denied'),{name:'NotAllowedError'})):options.pending?new Promise<VoiceStream>(resolve=>{resolveStream=resolve}):Promise.resolve(stream)),recorder:vi.fn(()=>recorder),recognition:options.unsupported?undefined:vi.fn(()=>recognition),now:()=>now,createUrl:vi.fn(()=>`blob:synthetic-${now}`),revokeUrl:vi.fn()}
 const controller=new VoiceController(deps,next=>{state=next})
 const final=(text:string,confidence=.9,isFinal=true)=>recognition.onresult?.({results:[{isFinal,0:{transcript:text,confidence}}]})
 return {controller,deps,stream,recorder,recognition,stopTrack,final,state:()=>state,setNow:(v:number)=>{now=v},resolve:()=>resolveStream?.(stream)}
}
afterEach(()=>vi.useRealTimers())
describe('consented bounded local audio lifecycle',()=>{
 it('does not request microphone or ASR without separate consent',async()=>{
  const s=setup();await s.controller.record(false);expect(s.deps.getStream).not.toHaveBeenCalled();expect(s.state().error).toBe('CONSENT_REQUIRED')
  s.controller.recognize(false);expect(s.deps.recognition).not.toHaveBeenCalled();expect(s.state().error).toBe('ASR_CONSENT_REQUIRED')
 })
 it('permission denied keeps text fallback; no recorder or recording URL',async()=>{
  const s=setup({denied:true});await s.controller.record(true);expect(s.state().phase).toBe('IDLE');expect(s.state().message).toContain('text');expect(s.state().error).toBe('NotAllowedError');expect(s.deps.recorder).not.toHaveBeenCalled();expect(s.deps.createUrl).not.toHaveBeenCalled()
 })
 it('records, stops every track, replays only a local blob and revokes replaced/deleted URLs',async()=>{
  const s=setup();await s.controller.record(true);expect(s.state().phase).toBe('RECORDING');expect(s.recorder.start).toHaveBeenCalledWith(1000)
  s.setNow(1000);s.controller.stopRecording();expect(s.stopTrack).toHaveBeenCalled();expect(s.state().audioUrl).toBe('blob:synthetic-1000')
  await s.controller.record(true);s.setNow(2000);s.controller.stopRecording();expect(s.deps.revokeUrl).toHaveBeenCalledWith('blob:synthetic-1000')
  s.controller.clearAudio();expect(s.deps.revokeUrl).toHaveBeenCalledWith('blob:synthetic-2000');expect(s.state().audioUrl).toBeNull();s.controller.dispose()
 })
 it('automatically stops at two minutes and rejects oversize audio',async()=>{
  vi.useFakeTimers();const s=setup();await s.controller.record(true);s.setNow(MAX_VOICE_MS);vi.advanceTimersByTime(MAX_VOICE_MS);expect(s.recorder.stop).toHaveBeenCalledTimes(1);expect(s.state().phase).toBe('IDLE');s.controller.dispose()
  const large=setup();await large.controller.record(true);large.recorder.ondataavailable?.({data:new Blob([new Uint8Array(MAX_AUDIO_BYTES+1)])});expect(large.state().error).toBe('AUDIO_TOO_LARGE');expect(large.deps.createUrl).not.toHaveBeenCalled();large.controller.dispose()
 })
 it('disposal or cancel while permission is pending releases a late stream and never records',async()=>{
  for(const dispose of [true,false]){
   const s=setup({pending:true}),pending=s.controller.record(true);if(dispose)s.controller.dispose();else s.controller.cancelPending();s.resolve();await pending
   expect(s.stopTrack).toHaveBeenCalledTimes(1);expect(s.deps.recorder).not.toHaveBeenCalled();s.controller.dispose()
  }
 })
 it('disposal stops recording/ASR and revokes existing audio; late callbacks are ignored',async()=>{
  const s=setup();await s.controller.record(true);s.controller.stopRecording();const url=s.state().audioUrl;await s.controller.record(true);s.controller.dispose();expect(s.stopTrack).toHaveBeenCalled();expect(s.recorder.stop).toHaveBeenCalledTimes(2);expect(s.deps.revokeUrl).toHaveBeenCalledWith(url)
  const a=setup();a.controller.recognize(true);const late=a.recognition.onresult;a.controller.dispose();late?.({results:[{isFinal:true,0:{transcript:'late',confidence:1}}]});expect(a.state().transcript).toBe('');expect(a.recognition.abort).toHaveBeenCalledTimes(1)
 })
 it('recorder error and stop watchdog return to text fallback and free microphone',async()=>{
  vi.useFakeTimers();const s=setup();await s.controller.record(true);s.recorder.onerror?.();expect(s.state().phase).toBe('IDLE');expect(s.stopTrack).toHaveBeenCalled();s.controller.dispose()
  const stalled=setup();await stalled.controller.record(true);stalled.recorder.stop=vi.fn();stalled.controller.stopRecording();vi.advanceTimersByTime(2000);expect(stalled.state().error).toBe('RECORDING_STOP_TIMEOUT');stalled.controller.dispose()
 })
})
describe('browser ASR transcript is provisional until user review',()=>{
 it('unsupported engine never opens microphone and provides text fallback',()=>{const s=setup({unsupported:true});s.controller.recognize(true);expect(s.state().error).toBe('ASR_UNSUPPORTED');expect(s.deps.getStream).not.toHaveBeenCalled()})
 it('uses Japanese and only final results become transcript; interim remains separate',()=>{
  const s=setup();s.controller.recognize(true);expect(s.recognition.lang).toBe('ja-JP');expect(s.recognition.interimResults).toBe(true)
  s.final('担当',.5,false);expect(s.state().transcript).toBe('');expect(s.state().interim).toBe('担当')
  s.setNow(5000);s.final('画面の実装を担当しました。',.45);s.recognition.onend?.();expect(s.state()).toMatchObject({phase:'IDLE',transcript:'画面の実装を担当しました。',confidence:.45,captureDurationMs:5000,interim:''});s.controller.dispose()
 })
 it('does not duplicate final segments on repeated recognition result events',()=>{
  const s=setup();s.controller.recognize(true);s.final('確認します。');s.final('確認します。');expect(s.state().transcript).toBe('確認します。');s.controller.dispose()
 })
 it('unknown confidence remains N/A and overlong transcripts are rejected without silently truncating',()=>{
  const s=setup();s.controller.recognize(true);s.final('確認します。',Number.NaN);expect(s.state().confidence).toBeNull()
  s.final('日'.repeat(10001));expect(s.state().error).toBe('TRANSCRIPT_TOO_LONG');expect(s.state().transcript).toBe('');expect(s.recognition.abort).toHaveBeenCalled();s.controller.dispose()
 })
 it.each(['not-allowed','network','no-speech','audio-capture','language-not-supported'])('%s error aborts recognition with text fallback',error=>{
  const s=setup();s.controller.recognize(true);s.recognition.onerror?.({error});expect(s.state().phase).toBe('IDLE');expect(s.state().error).toBe(error);expect(s.recognition.abort).toHaveBeenCalled();s.controller.dispose()
 })
 it('malformed browser events and engine constructor failures fail closed',()=>{
  const s=setup();s.controller.recognize(true);s.recognition.onresult?.({results:[{isFinal:true}]} as never);expect(s.state().error).toBe('ASR_RESULT_INVALID');expect(s.state().transcript).toBe('');s.controller.dispose()
  const broken=setup();broken.deps.recognition=()=>{throw new Error('Engine failure')};expect(()=>broken.controller.recognize(true)).not.toThrow();expect(broken.state().error).toBe('ASR_START_FAILED');broken.controller.dispose()
 })
 it('recognition has a two-minute limit and stop watchdog aborts engines that never finish',()=>{
  vi.useFakeTimers();const s=setup();s.controller.recognize(true);s.recognition.stop=vi.fn();s.setNow(MAX_VOICE_MS);vi.advanceTimersByTime(MAX_VOICE_MS);expect(s.recognition.stop).toHaveBeenCalled();expect(s.state().phase).toBe('STOPPING');vi.advanceTimersByTime(2000);expect(s.recognition.abort).toHaveBeenCalled();expect(s.state().phase).toBe('IDLE');s.controller.dispose()
 })
})
describe('authored Japanese TTS voice selection and privacy',()=>{
 it('lists Japanese only, local voices first and requires separate consent for remote service',()=>{
  const voices=[{lang:'en-US',localService:true,name:'English'},{lang:'ja-JP',localService:false,name:'Remote'},{lang:'ja-JP',localService:true,name:'Local'}] as SpeechSynthesisVoice[]
  expect(japaneseVoices(voices).map(v=>v.name)).toEqual(['Local','Remote']);expect(canSpeak(voices[1],false)).toBe(false);expect(canSpeak(voices[1],true)).toBe(true);expect(canSpeak(voices[2],false)).toBe(true);expect(canSpeak(undefined,true)).toBe(false)
 })
})
