# Contracts

## Implemented local interfaces (no HTTP backend in S1)

The source of truth is the exported TypeScript/Zod schema in `src/domain/model.ts`.

- `createAttempt(config, material, difficulty, nowMs): Attempt`
- `elapsed(attempt, nowMs): number` — clamped milliseconds in current section.
- `finishSection(attempt, nowMs, expectedIndex, early?)` — idempotent, requires matching current index.
- `checkpoint(attempt, nowMs, label, plannedMs|null)` — section-scoped timestamp and optional plan.
- `analyze(attempt): Finding[]` — `{code, section, evidence, certainty, recommendation, trial}`. Algorithm `rules-v1-pilot`; report recomputed from saved evidence, not editable/generated scoring.
- `comparable(a,b): {ok, reasons[]}`.
- `loadAttempts(): Promise<Attempt[]>`, `saveAttempts(attempts): Promise<void>` — validated IndexedDB storage; errors surfaced in UI.

Backup envelope:

```json
{"format":"BRSE_EXAM_BACKUP","schemaVersion":1,"attempts":[]}
```

Import: strict validation; max 5 MB/500 attempts/5000 events per attempt, unique IDs, max one non-completed attempt; transactionally replaces exam store only after explicit consent. Invalid payload does not write. Export excludes CV/voice/PDF because the implemented aggregate contains none of these. JSON is not encrypted.

Result per timing section:

```ts
{
  total: number | null; answered: number | null; correct: number | null;
  scoreKind: 'RAW_CORRECT_COUNT'|'PERCENT_ACCURACY'|'MOCK_ESTIMATED'|'OFFICIAL_SCALED';
  score: number | null; max: number | null;
  provenance: 'SELF_REPORTED'|'MOCK_PROVIDER'|'OFFICIAL_SCORE_SHEET';
}
```

Raw mode uses counts, not the score/max fields. Entered reported scores are kept separately; percentage kind requires max=100. Official reported scoring groups can differ from timed sections (e.g. JLPT combined sections); this first slice does **not** model verified official scoring groups or apply cutoffs. Do not use its section labels as a declaration of official scoring boundaries.

## Implemented Spring Boot API (S2B)

Formal schema: [backend/openapi.yaml](../backend/openapi.yaml). Runnable API/code/tests exist. Live provider inference remains NOT_RUN; no key/model was injected at implementation time. “Available” indicates configured inputs, not tested provider health.

| Method | Endpoint | Contract |
|---|---|---|
| GET | `/api/v1/system/provider-capabilities` | `{aiFeedback:{available,state,provider,model,retentionSeconds:900},externalMedia:{showText:false,playAudio:false,embedImage:false,cache:false}}` |
| POST | `/api/v1/ai/interviews` | `{track:JOB|BRSE,rubricVersion,consent:true}` → `201 {id,capabilityToken,expiresAt}` |
| POST | `/api/v1/ai/interviews/{id}/feedback` | Bearer capability + `{questionId,mode,utteranceId,transcriptVersion,text,endMs}` → synchronous `200 FeedbackResult` |
| DELETE | `/api/v1/ai/interviews/{id}` | Same capability → 204, revokes session |

No public learner login/signup. Tokens stay in the request function's memory, never URL/storage/backup. Sessions contain salted token hash, track/rubric, expiry and counters only. Transcript/request text is in memory only during evaluation; no server result persistence or GET-result endpoint. Consent required before creating a session. Browser cleans up the session after requests; TTL remains a fallback.

Feedback is `{source:AI_MODEL,provider:openai,model,rubricVersion,utteranceId,transcriptVersion,criteria:[{criterionId,score:0..3|null,annotations:[]}],followUp:null|{question,quote,reason},limitation}`. Every numeric score requires exact candidate quote evidence. Server computes evidence IDs, UTF-16 offsets and utterance/version/time bindings. Unknown/missing/duplicate criteria or fabricated quotes fail closed. Null is not a zero. The browser checks the same bindings before attaching a result to the unchanged attempt and saves it separately from local feedback/self-reviews.

API errors use sanitized Problem Details. 400 invalid fields/consent/rubric/question; 403 denied origin; 404 wrong/expired capability (same response, no ownership enumeration); 413 body limit; 429 resource/rate limits; 502 invalid provider schema/evidence; 503 disabled/unavailable/rate-limited provider or server capacity. No private payload/credential values in error bodies/logs. See backend README for exact limits and reverse-proxy requirements.

AI keys remain backend-only (`BRSE_AI_KEY`). The fixed production upstream is `https://api.openai.com/v1/chat/completions`; test fixture HTTP URI exists only through a package-private constructor. No client-supplied upstream URLs. External-media gates remain false.

## Planned API areas — not implemented

Adaptive multi-turn `/turns`, server-side retry orchestration, CV parsing, Immersion Kit, backend speech and cross-device sync are still design only. Jisho words JSON is implemented in S4A below. Current retry orchestration and history remain local. Full ephemeral capability ownership/rate limits must also be applied to any future server endpoints.

## Implemented S2 local interview contracts

These local interfaces remain separate from the S2B HTTP API above. Authoritative schemas/interfaces: `src/domain/interview.ts`.

- `createInterview(questionId, nowMs, parent?, mode?)`: create initial or guided/independent retry; question, track and version are registry-controlled.
- `submitAnswer(attempt, text, nowMs)`: validate 1–10,000 characters, save immutable transcript revision, generate local review prompts/length observation, no auto semantic scores.
- `editTranscript(attempt)`: return DRAFT, remove stale feedback/reviews, keep submitted revision history.
- `saveReview(attempt, {criterionId, score:0|1|2|3, quote, startOffset, note})`: require exact quote against current version; replace that criterion's learner review and generate SELF_REPORTED annotation.
- `reviewScore(attempt)`: weighted learner total only when all criteria are reviewed; otherwise null.
- `compareInterviews(before, after)`: return compatibility reasons and per-criterion self-rating/evidence deltas; separate guided from independent, reject changed baseline versions.
- `loadInterviews()/saveInterviews(attempts)`: separate `brse-interviews` IndexedDB database; newest-created first on reload. Writes are queued, imports atomic.

Backup envelope:

```json
{"format":"BRSE_INTERVIEW_BACKUP","schemaVersion":1,"attempts":[]}
```

Attempt includes `id, rootId, parentId, parentTranscriptVersion, rootTranscriptVersion, questionId, track, rubricVersion, mode, prompt, status, draft, utteranceId, revisions[], reviews[], feedback`. Each retry pins the parent/root transcript version that it practiced from. A later edit to the root does not silently make a new baseline comparable.

A revision includes `{version,text,submittedAt,endMs}`. Annotation offsets use UTF-16 indices (matching browser text slicing); `startMs=0,endMs=revision.endMs` describes the **whole text-composition interval**, not spoken time or per-word timestamps. All annotations bind to exact quote/utterance/version/criterion. Review-prompt quotes are reference excerpts, not semantic error findings. Local engine ID is `LOCAL_RULES_V1`, never an AI model ID.

Max import 5 MB, 300 attempts, 30 revisions per attempt; strict fields, valid ancestor links, no cycles or duplicate attempt IDs, known rubric, exact evidence. Plaintext backups may contain personal answers: keep private. Import/delete Interview never writes Exam storage. There is no complete CV or audio data model in this release.


## Optional persisted AI assessment field

Current interview attempts accept optional `aiFeedback` (same normalized FeedbackResult schema). Existing backups without this field remain valid. AI-enriched files require the current reader; older builds with strict schemas will reject the added field rather than silently discard it. The backup envelope remains v1. No API keys or capability tokens are fields in this schema.

Transcript edits and resubmission remove previous AI feedback. Attach is permitted only to the exact current reviewed transcript version, text and utterance. Stale responses are discarded; self-review never overwrites AI output and AI never overwrites self-ratings. AI score comparisons by model/version are not yet implemented.


## S3 browser Voice contracts (no new HTTP endpoints)

`VoiceController` uses injected `VoiceDependencies` for microphone/recorder/recognition/URL/clock, with explicit consent and bounded lifecycle. Native browser adapters live under `src/voice/`. The browser recognition service is distinct from the Spring AI provider and may have separate data handling; UI consent states this.

`store.applyVoice(attemptId, reviewedText, metadata)` validates draft state, nonempty/size-bounded text and strict `voiceMetadataSchema`, then persists draft only. `submitAnswer` transfers optional draftVoice into the new revision's optional voice metadata. Manual main-editor changes remove draftVoice. Audio is never accepted by these contracts; raw media fields fail schema validation.

The optional voice metadata shape and limits are in [S3_VOICE.md](S3_VOICE.md). Existing v1 backups without metadata stay readable. Existing backend feedback request remains text-only and does not receive audio/confidence/voice metadata; existing endMs is composition time, not audio alignment. No `/speech/*` endpoint is implemented or claimed tested.


## S4A dictionary and local vocabulary contracts

`GET /api/v1/dictionary/words?q=` returns normalized `{query,state,entries,capabilities}`. Only a single short q is accepted; no private transcript/context or client upstream URL. Backend fixed provider URI, operator flag (default false), explicit browser consent, bounded request/rate/time/response and typed authored fallback. See backend/openapi.yaml and S4_DICTIONARY.md for exact schema and states. Word data is transient, no scraping/media enabled.

`normalizeQuery(input)` counts Unicode code points (1–50), NFC/trim and rejects control/format/surrogate/newline data. `localLookup` uses shared first-party corpus with exact source IDs. Client validates all source fields and current query; forged AUTHOR_CREATED content is rejected rather than relabeled. Requests are cancelled/ignored on input/consent/context change.

Vocabulary schema (`src/domain/vocabulary.ts`): `{id,term,source:AUTHOR_CREATED|JISHO_REFERENCE,authoredId|null,note,tags,createdAt,updatedAt}`. No provider definitions, media, transcript or tokens. Pinia `add/update/remove/importText/clear` operates only on IndexedDB `brse-vocabulary` v1. `flashcardBack` derives first-party meaning/example from authoredId or shows the learner's own note; foreign definitions are never reconstructed from cache. No SRS or automatic score/mastery changes.

Backup envelope `{format:BRSE_VOCABULARY_BACKUP,schemaVersion:1,bookmarks:[]}`. Max 500 bookmarks / 5 MB, strict fields/IDs/source references, note 2,000 chars and max 10 tags each 32 chars. Invalid import is rejected before atomic replacement, which touches only vocabulary. Plaintext notes may be private.

## S5 local multi-turn contract

No new HTTP endpoint or automatic transmission. Existing per-attempt AI consent/API is unchanged.

`startSession(track, parentId?, mode?) → Promise<sessionId>` persists three ordered attempts and a session. Parent must exist, match track and have three reviewed transcripts. Storage limits apply before creation.

`InterviewSession = { id:UUID, track:JOB|BRSE, createdAt:number, mode:INITIAL|GUIDED|INDEPENDENT, parentId:UUID|null, attemptIds:[UUID,UUID,UUID] }`.

Interview backup v1 accepts optional `sessions: InterviewSession[] = []` (max 100); attempts max 300 total. Cross-validation enforces catalog order, source track/mode/time, exclusive attempt membership, session-parent/turn-parent consistency and acyclic references. Unsupported fields still fail. Old backup without sessions remains valid; old app versions may reject newly exported files.

`sessionReport(session, attempts)` returns turns, reviewed count, completeness and nullable selfScore. selfScore is rounded equal-weight mean only when all turns are reviewed and all rubric self-ratings have evidence. It is derived on read, never persisted as a potentially stale aggregate. Pairwise comparison reuses pinned baseline/version safeguards in compareInterviews; no global AI score inferred.

## S6 BrSE scenario additions (local, optional fields)

`startSession('BRSE', parentId?, mode?, 'csv-change-v1')`: ordered three-turn CSV scenario. Without scenarioId, S5's original three-question scripts are unchanged. Retry inherits parent's scenarioId; replacing scenario across retries is rejected.

`InterviewSession.scenarioId?: 'csv-change-v1'`.

`Interview.scenarioContext?: {attemptId: UUID, version: positive integer}[]` (0–2 entries): IDs must reference the exact predecessor order in that same scenario session, versions must exist. Reviewed scenario turns require this array (empty on first turn); legacy/normal attempts cannot carry it. Scenario turns cannot appear outside scenario sessions. Strict nested objects reject external/private fields. Existing backup schemaVersion remains 1; old input still supported, old app versions may reject enriched exports.

`sessionReport` adds `staleIds: UUID[]`. A predecessor draft, changed version, or stale context invalidates dependent turns transitively. Excluded from reviewed count/completeness/nullable selfScore; retry, new evidence rating and AI attachment are blocked as appropriate until review/resubmission. Store enforces submission order, independently of UI disabling.

HTTP feedback contract unchanged: three new allowed question IDs `scenario-csv-hearing-v1`, `scenario-csv-impact-v1`, `scenario-csv-agreement-v1` use `brse-text-v1`. Client still sends only the current question ID/text/version/timestamps, never `scenarioContext` or previous answers. The result is per-turn assessment; whole-conversation consistency remains unimplemented.

## S7 optional minutes and second scenario (local interfaces)

Scenario IDs: `'csv-change-v1' | 'production-incident-v1'`. `startSession` accepts either for Track BRSE; retries inherit and cannot switch parent scenario. Production question IDs: `scenario-incident-intake-v1`, `scenario-incident-update-v1`, `scenario-incident-plan-v1`, using `brse-text-v1`. Per-turn HTTP request/response remains unchanged. No minutes/context/history upload.

`InterviewSession.minutes?: {status:'DRAFT'|'REVIEWED', entries:MinuteEntry[], reviewedVersions:{attemptId:UUID,version:number}[]}`.

`MinuteEntry = {id:UUID,kind:SCOPE|DECISION|ACTION|OPEN_QUESTION,text:string,owner:string,due:string,confirmation:PROPOSED|CONFIRMED|UNKNOWN,evidence:{attemptId:UUID,version:number,source:CANDIDATE|CUSTOMER,quote:string,startOffset:number,endOffset:number}}`.

Limits: max12 entries, text1–1000, owner/due0–120 (both required/nonempty for ACTION), quote1–10000, strict objects, unique entry IDs. Evidence must match that session's existing revision and exact candidate text or authored prompt; offsets use UTF-16 like existing annotations. REVIEWED requires at least one entry and three ordered existing versions; DRAFT has no reviewedVersions. Import accepts historically valid stale sources and preserves the warning; malformed metadata rejects the whole replacement before writes.

- `saveMinutes(sessionId, minutes): Promise<void>` validates candidate aggregate before mutation, then queues atomic persistence; REVIEWED input also must be current.
- `reviewMinutes(sessionId)` requires complete current conversation and current evidence; pins all three versions. No automatic customer/semantic confirmation.
- `minutesState(minutes,session,attempts)` → `{current,staleIds,exportable}`; exportable requires REVIEWED + current complete conversation + all evidence/review versions current.
- `minutesText(sessionId): string` refuses draft/stale output; returns plain training text with source IDs/version/quotes and a self-report disclaimer. No HTML rendering or external action.

Existing IndexedDB v2 and backup schemaVersion1 gain optional minutes; old input accepted, older software may reject new output. JSON bounds remain5 MB/300 attempts/100 sessions. Entry edits reset review status, never alter transcript/rubric scores. No new secret or auth requirement.

## S8 local evidence queue

Backup v1 optional `reviewQueue: ReviewItem[] = []` (max300), persisted in IndexedDB Interview v3 new store. Legacy input remains valid; older software may reject new DB/backup. Source of truth: `src/domain/review-queue.ts`.

`ReviewItem = {id,attemptId,version,criterionId,createdAt,snapshot,nextStep,priority:NORMAL|HIGH,status:OPEN|DONE,doneAt:number|null,retries:{attemptId,sessionId:UUID|null}[]}`.

Snapshot: `{source:SELF_REVIEW|AI_MODEL, quote,startOffset,endOffset,score,reason}`; SELF_REVIEW score0–3, AI score0–3 or null and required provider/model. Source quote must match the indicated retained transcript revision exactly. Criteria must belong to source track. Sources must exist; duplicate IDs or attempt/version/criterion/source keys fail. Max10 retries/item; targets must be direct children with matching parentTranscriptVersion and same question. Scenario targets must belong to the corresponding child session/turn. Strict objects reject unknown raw media/token/private fields.

- `queueCriterion(attemptId,criterionId,source)` snapshots current self-review or first AI annotation; source must be reviewed/context-current. Duplicate returns existing ID unchanged.
- `planQueue(id,nextStep,priority)` validates text1–1000 before mutation; no score/transcript change.
- `retryQueue(id,mode)` requires source current, prior retry complete and storage/history capacity. Returns `{attemptId,sessionId}`. Scenarios require complete source session and create a full same-scenario child; other questions create a single child.
- `queueState(item,attempts,sessions)` derives source staleness, retry completeness and canFinish. No inference/SRS.
- `finishQueue(id,true)` requires source and latest retry current/completed (all scenario turns); false reopens. DONE is self-reported practice, retained historically if later edits make it stale.
- `removeQueue(id)` deletes only metadata; Interview clear removes all three stores, Exam/Vocabulary unchanged.

HTTP contracts unchanged. Queue not included in per-turn AI request, and no outgoing provider call is needed to add/filter/plan/retry/mark practice.

## S9 local vocabulary schedule additions

Bookmark v1 optional/default additions: `contentVersion:positive integer=1`, `schedule?:{policy:'FIXED_INTERVAL_V1',contentVersion:positive integer,events:{grade:AGAIN|HARD|GOOD|EASY,at:integer ms}[]}`. Existing strict field validation remains. Schedule events1–100; timestamp0–8e15 and derived due must stay in range. Initial event cannot predate bookmark creation or last event exceed updatedAt; schedule contentVersion cannot exceed bookmark contentVersion. Replay rejects events before previous due, rather than trusting extra derived interval/score fields. Stale schedules from an older contentVersion may be restored but not graded.

- `reviewState(bookmark,now)` returns eligibility, stale flag, dueAt/interval days, count, due and capacity flag. External references require own nonblank note; authored content stays first-party.
- `gradeBookmark(bookmark,grade,{contentVersion,count,contentKey},now)` validates reveal snapshot, due and capacity, appends one self-reported event and derives new schedule. No semantic grading.
- `vocabulary.review(id,grade,expected,now=Date.now())` validates candidate aggregate/5 MB bound before updating local state/persisting. Tests inject now; UI uses current device time.
- `resetSchedule(id)` removes only that bookmark's event log/schedule; UI requires explicit confirmation. Source note/tags remain.

Rule: AGAIN=60 seconds (base interval0); HARD=max(1,round(previous×1.2)) days; GOOD=max(3,previous×2); EASY=max(7,previous×3), capped180 days. One day=86,400,000ms. Next due anchors actual rating time. No SRS grade or history is submitted via HTTP, no provider/media requests added, no learner account. Backup remains vocabulary-only, max500 bookmarks/5 MB; old files still import.

## S10 local dashboard projection/navigation

`learningDashboard({exams:Attempt[]|null,interviews:{attempts,sessions,queue}|null,bookmarks:Bookmark[]|null}, now, days:7|30, timezone)` returns separate nullable summaries, next-action targets, daily counters and latest20 retained events. Output is derived/read-only, never accepted as a score or backup/source of truth. Unavailable module daily values remain null; known empty values0. All projection inputs are previously validated source records.

DashboardTarget: EXAM_TIMER, EXAM_RESULT{id}, EXAM_DATA, INTERVIEW_ATTEMPT{id}, INTERVIEW_SESSION{id}, INTERVIEW_DATA, QUEUE, VOCABULARY_REVIEW, VOCABULARY_NOTEBOOK or VOCABULARY_DATA. App checks current IDs and opens the corresponding workspace on mount; target is in-memory navigation, not a public URL/capability.

Daily series: EXAM_END.wall only for completed timer, each revision.submittedAt for transcript submissions, each schedule event.at for vocabulary. Local-calendar keys respect supplied IANA zone; unsupported zone falls backUTC. Invalid/too-large/future times are excluded and counted; no fake completion timestamp or normalized score. Recent modules filter within latest20, independently of7/30 daily window.

Exam source exposes loadFailed to distinguish unreadable from empty. persist/create cannot overwrite after read failure; explicit valid backup import or confirmed clear resets failure. Interview init deduplicates concurrent loads. Dashboard never requests save, review, grade, retry or export automatically. No IndexedDB/backup/HTTP changes and no additional provider permissions.

## Readiness local contract (S11)

No HTTP endpoint. `BRSE_READINESS_BACKUP` schemaVersion1: checked unique known checklist IDs (max10), note<=2000 chars, updatedAt integer0..8e15 or null; unknown fields rejected. File limit20KB. IndexedDB `brse-readiness` v1/store `state`/key `current`. Import replaces this module only after validation + confirmation. Source is learner self-report, never measured readiness or AI evaluation. Unencrypted export contains saved state, not unsaved note drafts.

## S12 Demo local contract

No new HTTP endpoint. IndexedDB `brse-demo`v1/store `state`/key`current`: `BRSE_DEMO_BACKUP`, schemaVersion1, sessions<=50, unique UUIDs, at most1 RUNNING/PAUSED. Session: id,title1–120,createdAt,status,nullable anchorAt (only RUNNING),elapsedMs0–86400000,splits<=5 ordered cumulative offsets<=elapsedMs,text<=20000,positive version,reviews<=3 unique criteria. Reviews: criterion role/tradeoff/outcome, quote+next1–2000, version equal source; DONE only, quote must be exact substring of saved text. Strict unknown-field rejection; file<=5MB UTF8. Import replaces Demo only after validation+confirmation. Reset/export do not touch other modules. No standardized score, AI or verified recording provenance.

## S13 extension to local Demo v1

No HTTP/DB-version change. Session followups optional→default[] (max3 unique fixed role/tradeoff/outcome): text1–8000 trimmed, positive version, sourceVersion<=presentation.version; optional review quote/next1–2000 with exact quote and current answer version. DONE only. Current answers require nonempty presentation. Old-source answers/reviews retained as stale; re-saving answer against new source increments version/removes review. Baseline snapshot stores version/text/reviews/three current followups, validates quote/source refs. Session retry optional `{parentId,mode:GUIDED|INDEPENDENT,baseline}`. Parent exists/DONE/same title, createdAt<=child, baseline.version<=parent.version; cycles/self-reference rejected. This is local self-report, no authenticity claim. Old v1 with neither field accepted; older frontend may reject extended backups. Existing limits50sessions/oneactive/5MB remain. INDEPENDENT hides baseline until all current child content is complete; no AI progress score.

## S14 Demo references and dashboard contract

No HTTP changes. Optional session.references and retry.baseline.references normalize to[] for old v1 backups; max3 `{label,url}` strict entries. Label trim1–80; URL trim<=500, HTTPS prefix, no whitespace/backslash/credentials/query/fragment, canonicalized by URL.href, unique canonical URLs. Writes/import use same schema before replacement. Metadata edits preserve presentation/answer versions and timer. Retry copies independent references and pins baseline references; changed parent references can make baseline-current=false. Links opened explicitly with noopener/noreferrer and no-referrer, never fetched by the app.

DashboardInput.demos is optional/null for unavailable, [] for known empty. Separate summary/creation activity with DEMO_START, daily.demoStarts null or count, targets DEMO_SESSION(id)/DEMO_DATA. Output omits reference URLs/text/QA/review notes; missing IDs on navigation give explicit message after fresh read. Dashboard is read-only; not a sync or score service.

## S15 local Demo plan extension

No new HTTP/DB version. Root plans optional default[] in Demo v1 backup, max200 unique UUIDs; existing5MB/50session limits remain. Fields: id,sessionId,criterion(role/tradeoff/outcome),source(PRESENTATION/FOLLOWUP),createdAt,day(real YYYY-MM-DD,2000..2100),status OPEN/DONE,doneAt nullable,retryId nullable,snapshot{sourceVersion,answerVersion(nullable presentation),text,quote,next}. Quote exact substring, quote/next1..2000,text1..20000(QA<=8000); strict unknown-field rejection. Source exists/DONE/version bounds/text consistency, retry exists/correct parent/time ordering. DONE requires doneAt+retry but may later be historical stale. Creation only from current review; manual done requires current review and linked child with text+3current QA; no verified improvement score. Reschedule OPEN only; delete item retains sessions. Dashboard plansDue counts OPEN day<=local today, plansStale can include historical DONE; no evidence text exposed. Independent incomplete retry hides plan hints.

## S16 Technical Drill catalog extension

No endpoint/schema/DB-version change. Added JOB IDs tech-api-retry-v1, tech-sql-pagination-v1, tech-security-authz-v1, prompts/independent variants mirrored exactly in backend interview-catalog.json. JOB rubric remains job-text-v1; evidence validation/version/quota/consent unchanged. Checkpoints are authored reference content, not candidate evidence or executed correctness result. Technical attempts use existing Interview backup/history/queue limits and are already included in dashboard Interview counts. Older backups with old IDs still accepted; old frontend versions may reject new question IDs. Deep technical grading, code execution and CV-derived claims are unsupported.

## S17 technical catalog + local goals

No new HTTP endpoint. JOB IDs add tech-vue-async-v1,tech-spring-transaction-v1,tech-postgres-plan-v1; authored frontend/backend catalogs remain in sync, JOB rubric unchanged. Stack/scope metadata never inferred from learner profile.

Separate DB brse-technical-goals v1/state/current. Backup format BRSE_TECHNICAL_GOALS_BACKUP,schemaVersion1,goals<=50,UTF8<=200KB. Goal strict fields:id(UUID),questionId(known technical),text(trim1..500),target(int1..20),createdAt,status OPEN|DONE,doneAt nullable,links<=20 unique {attemptId(UUID),version positive int}. One OPEN per question; DONE/doneAt/time consistency validated. Backup refs may be missing until Interview restore; authenticity/cross-file existence is not asserted. Helpers only link submitted matching question, replace pin rather than duplicate ID, count current version and split modes. Edit/draft/deletion gives stale/missing, unavailable source=>N/A. Manual DONE guarded by current total>=target; later stale state preserves historical DONE. Import/reset affects goals only. No transcripts or rubric/provider secrets in goals export.

## S18 local technical-goal mode/summary contract

No new HTTP/DB-version. Technical goal v1 optional mode ANY(default)/INITIAL/GUIDED/INDEPENDENT; OPEN uniqueness questionId+mode. New links must match goal question/status/mode. Imported wrong-mode current refs remain visible as excluded but never count toward target; current count/met are mode-filtered. Legacy missing mode keeps S17 total-all behavior. Existing separate-backup/limits/currentness/manual completion semantics retained.

DashboardInput.technicalGoals nullable/optional; known empty[] differs from unavailable. Technical summary retains known total/open/manualDone even when Interview unavailable, derived met/doneCurrent/stale/missing=null then. Actions use authored title+mode/count and exact goal UUID, no objective/source text. Navigation reloads and validates requested ID before focus; read failures do not overwrite data. Source changes keep manual DONE historical, not certified progress.

## S19 local profile contract

No HTTP endpoint/provider calls. DB brse-profile v1/state/current; BRSE_PROFILE_BACKUP schemaVersion1,UTF8<=1MB. Root:alias<=120,careerTarget enum,japaneseSelfReport<=300,sourceText<=30000,positive sourceVersion,projects<=10,claims<=30,nullable updatedAt. Projects strict UUID/title1..120,role/stack<=300,context/result<=2000. Claims strict UUID,kind EXPERIENCE/SKILL/RESULT,text1..1000,positive version,source MANUAL/CV_TEXT,sourceVersion nullable,quote<=1000,updatedAt,confirmedAt nullable>=updatedAt. MANUAL requires null version/empty quote; CV requires quote, version<=source.version and exact text inclusion when current. Unique IDs; unknown fields rejected. Source edit clears CV confirmation and stales old version; manual confirmation unaffected. Claim edit/rebind clears confirmation, same saved input retains it. Confirm is self-report only, no source authenticity/semantic/fact verification. Current claims do not auto-enter Interview/AI. Import/reset scope is profile only; drafts excluded from exports. TXT import max100KB/30000chars,validUTF8/noNUL,PDF/DOCX unsupported.
