import type {Recognition,Recorder,VoiceDependencies} from './controller'
export interface VoiceCapabilities {recording:boolean;recognition:boolean;synthesis:boolean;secure:boolean}
export function voiceCapabilities():VoiceCapabilities {
  const speech=window as unknown as {SpeechRecognition?:unknown;webkitSpeechRecognition?:unknown}
  return {secure:window.isSecureContext,recording:window.isSecureContext&&!!navigator.mediaDevices?.getUserMedia&&typeof MediaRecorder!=='undefined',recognition:window.isSecureContext&&!!(speech.SpeechRecognition||speech.webkitSpeechRecognition),synthesis:typeof speechSynthesis!=='undefined'}
}
export function browserVoiceDependencies():VoiceDependencies {
  const speech=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition}
  const Constructor=speech.SpeechRecognition||speech.webkitSpeechRecognition
  return {getStream:()=>navigator.mediaDevices.getUserMedia({audio:true,video:false}),recorder:stream=>{
    const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(type=>MediaRecorder.isTypeSupported(type))
    return new MediaRecorder(stream as MediaStream,mime?{mimeType:mime}:undefined) as unknown as Recorder
  },recognition:Constructor?()=>new Constructor():undefined,createUrl:blob=>URL.createObjectURL(blob),revokeUrl:url=>URL.revokeObjectURL(url),now:()=>performance.now()}
}
export function japaneseVoices(voices:SpeechSynthesisVoice[]){return voices.filter(v=>/^ja(?:-|$)/i.test(v.lang)).sort((a,b)=>Number(b.localService)-Number(a.localService)||a.name.localeCompare(b.name))}
export function canSpeak(voice:Pick<SpeechSynthesisVoice,'localService'>|undefined,remoteConsent:boolean){return !!voice&&(voice.localService||remoteConsent)}
