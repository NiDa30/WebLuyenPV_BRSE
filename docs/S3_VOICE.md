# S3 — browser-native Voice increment

## Implemented

Inside any draft Interview attempt (either track, initial/guided/independent), optional Voice controls support:

1. **Authored question TTS.** Browser Speech Synthesis, Japanese voices only, local voices first. Remote-service voices require separate consent. If Japanese voices are absent, the app explains how to use text/install a voice. No external media or provider audio is fetched by application code.
2. **Local self-recording.** Explicit local recording consent, then getUserMedia audio-only and MediaRecorder. Generated learner audio stays in in-memory Blob URLs, never IndexedDB/export/backend. Controls allow replay/delete. Limits are two minutes or 10 MiB, enforced by runtime timers/data callbacks. Stops microphone tracks when stopped, permission arrives after cancellation, recorder fails, page hides or the component unmounts; revokes URLs when replaced/deleted/disposed. A stopped-recorder watchdog avoids permanently stuck UI.
3. **Optional browser ASR.** Separate explicit consent explains that the browser may send audio to its own service, with unknown/provider-dependent retention and no guaranteed offline service. Uses SpeechRecognition/webkitSpeechRecognition in Japanese, single-utterance mode. It does not upload the local recording above and does not use an application API key. Unsupported, denied, no-speech, network, invalid output and timeout cases return to text fallback.
4. **Review before use.** Final results separated from interim; no answer submission or score change during capture. Editable transcript, low-confidence warning (pilot threshold 0.7), required review acknowledgement. Learner chooses replace (confirmation if draft nonempty) or append. Any subsequent correction in this review editor resets acknowledgement. Applying saves only a draft; a separate existing Submit button creates feedback.
5. **Provenance without media.** Optional reviewed voice metadata on draft/revision; exported together with text. Manual changes to the main answer draft clear the reviewed-voice stamp to avoid claiming unreviewed changes came from ASR. Editing a submitted attempt retains its old transcript versions but does not stamp the new revision as voice unless reviewed again. Retries start empty.

No recording starts on page load, checkbox alone, TTS, navigation, or a transcript submission. Voice capture and TTS do not run simultaneously. Hiding the page stops active voice; hard OS suspension can delay JavaScript callbacks, so runtime time/byte limits are not a certified hardware recording cutoff. Browser permission indicators/device controls remain authoritative.

## Metadata contract

Optional `draftVoice` on draft attempt; optional `voice` on a submitted revision:

```ts
{
  source: 'BROWSER_ASR_REVIEWED';
  lang: 'ja-JP';
  reviewConfirmed: true;
  mergeMode: 'REPLACE' | 'APPEND';
  confidence: number | null; // browser-reported [0,1], not pronunciation score
  captureDurationMs: number; // capped microphone/recognition interval, not exact speech time
  reviewedAt: number;
}
```

Unknown raw audio fields are rejected by the strict schema. Existing backups without optional voice metadata remain valid. As with optional AI fields, older strict application builds may reject enriched files; import using the current version. No capability tokens, mic recordings or native ASR partial results enter backups.

When appending, metadata identifies that the answer includes reviewed voice text, not that all pre-existing typed text was spoken. Existing transcript/AI evidence timestamps remain the composition interval from opening the prompt; there is no per-word audio alignment or diarization.

## Not implemented / NOT_RUN

- Backend TTS/ASR endpoints; this increment uses browser APIs, whose compatibility/voices/services vary.
- Real microphone Japanese recognition and audible Japanese TTS quality on physical devices; fixture tests do not establish these.
- Acoustic pronunciation assessment, word/audio timestamps, shadowing scoring, voice conversation orchestration or production voice retention controls.
- No automatic sending of recordings to existing AI gateway. If the learner submits reviewed text and later consents to AI analysis, only text is sent under the existing gateway contract.

## Verification

See ACCEPTANCE_TESTS.md for executed counts. Unit tests cover consent, bounds, URL/track lifecycle, late permissions, failures, ASR transcript/interim/confidence, malformed output, timeouts and voice provenance persistence. Browser tests use deterministic ASR/TTS fixtures; local MediaRecorder is additionally exercised using Chromium's **synthetic microphone**, including page-hide/unmount stop. These outcomes are kept separate from live Japanese speech quality.
