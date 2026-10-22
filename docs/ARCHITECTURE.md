# Architecture — implemented slice S1

## Current flow

Vue 3 single-page UI → Pinia store → domain functions + IndexedDB repository.

- `src/App.vue`: responsive Vietnamese guest screens, semantic forms, keyboard-accessible native controls. State-based navigation; client URL routes from the design handoff are not implemented in S1.
- `src/domain/model.ts`: Zod v1 persistence/backup schema, null-aware result validation, explicit score kinds and provenance. Unknown fields rejected (including accidental private payloads), size/count limits before writes.
- `src/domain/profiles.ts`: authored, UNVERIFIED practice configurations. Full configuration snapshots retained per attempt. Editable names and section budgets become part of version/config identity. VERIFIED cannot be forged by importing a backup in this release.
- `src/domain/timer.ts`: pure timestamp-driven transitions; `RuntimeClock` anchors Date.now to performance.now in a running tab. Tick only triggers rendering/expiration, never decrements time. Reload recovers from original wall anchor + accrued working time. Pause excludes paused time and adds a non-equivalent flag. Each part has a separate budget and explicit start. No silent auto-start across listening/breaks. Expiry clamps to budget and is idempotent; no overrun measurement in this release.
- `src/domain/strategy.ts`: offline evidence rules, algorithm version and explicit pilot thresholds. Accuracy from known correct/answered only. No external AI call. Missing data → N/A/undetermined. Recommendations include next trial and measurement; observed correlation is not claimed as a cause.
- `src/stores/exam.ts`: one active attempt, queued snapshot writes, meaningful storage failures, score updates and data portability.
- `src/storage.ts`: IndexedDB `brse-guest`, version 1, `exam` object store, keyed by UUID. Entire attempt aggregate contains config/results/events. Atomic replacement transaction for imports/clear. New schema versions will require explicit migrations; incompatible backups are currently rejected, not coerced.
- `vite.config.ts`: production service-worker precache of the generated shell/assets, versioned by build hash. It caches application code only, never user data/media. No CDN/font dependency. Private data stays in IndexedDB; no analytics/provider requests.

## Lifecycle

`create → RUNNING → (PAUSED ↔ RUNNING) → BETWEEN → next RUNNING → COMPLETED`.

Sections end at budget even when the tab sleeps; catch-up occurs when the tab gets CPU. The last part ends the attempt. Early end requires confirmation; its event is distinct from timeout. There is no destructive reset during a session; deleting/importing data requires confirmation. Reload adds RECOVERED and a condition flag. Listening remains externally controlled and cannot borrow time. Repeated button actions on ended sections are ignored.

## Comparison

Requires completed distinct attempts, exact same configuration including section timings, same practice mode, interruption flags, score kind/max/provenance, known equal difficulty group and different material IDs (to avoid interpreting familiarity as progress). Unknown/mismatched conditions show NOT_COMPARABLE and raw side-by-side data. Difficulty is a learner assertion, not calibrated. Percent accuracy is correct/answered; not the overall score or answered/total completion.

## Privacy and future server boundary

No learner auth. AI provider keys must live in a future Java 21/Spring Boot service, never Vite env or the browser. PostgreSQL is optional when server persistence is actually required; it is not needed for the current offline slice. Server jobs will need opt-in consent, random capability handles, TTL, limits, rate limiting, object ownership and deletion. No automatic CV/transcript upload or third-party lookup.

Two local interview tracks, versioned rubrics, evidence self-review and guided/independent retry are now implemented as detailed below. Next is the actual server-backed semantic AI evaluation. Voice uses explicit consent and corrected ASR text; pronunciation is N/A without an actual validated audio model. Jisho/Immersion Kit use server-side adapters, authored fallback and capability gates. External media display/play/cache default OFF. Documents are requirements/context, never proof of code, media rights or viewed Drive videos.

## S2 local text interview — implemented increment

`InterviewWorkspace.vue` is a separate UI module, entered from “Phỏng vấn & Retry”. A Pinia interview store calls pure domain functions in `src/domain/interview.ts` and a separate IndexedDB repository in `src/interview-storage.ts`. Database `brse-interviews` v1 prevents upgrading or clearing existing `brse-guest` exam data by accident. Startup preserves unreadable data instead of automatically overwriting it.

The authored bank contains three questions per track. `JOB` and `BRSE` use distinct text-only rubrics (each three weighted criteria) under `job-text-v1` and `brse-text-v1`. These are practice/self-assessment rubrics, not a validated hiring scale. Each attempt has one prompt/answer; multi-turn adaptive AI interviewing is still pending.

A transcript revision retains exact submitted text, composition interval and version. Editing returns the attempt to DRAFT, removes feedback and self-scores, retains transcript revision history, and requires a new submission. Annotations reference the current utterance UUID, criterion, transcript version, exact UTF-16 offsets/quote and whole-answer composition interval. There is no word/audio alignment. Unicode excerpt generation preserves code points.

`LOCAL_RULES_V1` records measurable text length and provides criterion-specific review prompts with uncertainty. It deliberately does not infer Japanese grammar, project truth, intent satisfaction or pronunciation. Self-review requires exact transcript evidence, an explanatory note and a 0–3 learner rating. Weighted total is N/A until all criteria have evidence; the UI always labels it self-reported. It is not presented as AI feedback.

Guided and independent retries create new empty attempts. Guided shows authored structural hints. Independent uses a paraphrased authored prompt and hides hints/intent/previous answer in the composer. This is self-practice, not proctoring. Parent/root IDs and transcript baseline versions preserve provenance. Guided comparisons are blocked from independent progress claims; altered baseline versions are flagged. Comparison displays criterion self-rating deltas and exact quotes, not automatic mastery.

Interview JSON backups are opt-in exports of answers/revisions/reviews/retry links, never bundled with exam exports. Import is strictly validated and replaces Interview data only after confirmation; cycles, missing ancestors, inconsistent evidence, unsupported rubric/schema versions and extra fields are rejected before writes. Answer text is rendered escaped through Vue interpolation; no v-html, external transmission or provider keys.


## S2B — actual AI gateway and browser boundary

Java 21/Spring Boot application under `backend/` now implements capability lifecycle, configured capability discovery, consent validation and synchronous evidence-validated text feedback. PostgreSQL/Redis remain unnecessary for this in-memory, single-instance development slice. `backend/src/main/resources/interview-catalog.json` resource contains only first-party authored bank/rubrics; a frontend unit test enforces exact catalog parity.

`OpenAiFeedbackProvider` sends JSON user data to the fixed HTTPS OpenAI chat-completions endpoint using a backend-only key. The provider has byte/time bounds and no retries. `EvidenceValidator` rejects unsupported scores and any quote not contained in the exact submitted answer, then stamps normalized offsets/utterance/version. Prompts separate untrusted candidate data from instructions, but semantic correctness and resistance to prompt injection still require evaluation; span validation alone does not establish truth.

`ai-client.ts` creates a one-request capability after explicit consent, keeps it only in function scope and deletes it after the call. `AiFeedbackPanel.vue` handles configured/unavailable, loading, cancel, failed and completed states. It displays model score/evidence separately from learner self-ratings; no automatic mastery. Optional `aiFeedback` passes independent Zod/context checks before IndexedDB persistence. Edited transcripts and stale in-flight responses cannot keep or attach old model feedback. No third-party text/media cache was added to service worker.

Tests distinguish actual Spring disabled-provider routing, Spring/provider fixtures, adapter HTTP fixture server, frontend schema/store tests and browser fixtures. Live external inference has not run; required secret/model/enable configuration is not evidence that an actual call succeeded. No production deployment or multi-turn AI conversation is claimed.


## S3 browser Voice boundary

`VoicePracticePanel.vue` is mounted only for an Interview DRAFT. It owns local/remote speech consent and text-review acknowledgement, initializes native adapters and disposes capture/TTS on unmount. Native TTS voice selection is Japanese-only, local first; external voices are consent-gated. `VoiceController` is framework-independent and dependency-injected for deterministic lifecycle/permission/error/clock tests. Runtime audio blobs/URLs stay outside Pinia, IndexedDB, backups and Spring requests. Hide/pagehide events stop capture; late permissions release their tracks instead of starting recording after cancellation.

`voice-metadata.ts` adds strict optional provenance metadata without audio to draft/revision schema. The store copies reviewed transcript to draft only. Submission and optional model evaluation still require their existing separate actions. Native ASR final text is editable and always requires review; interim text never auto-submits. Confidence and capture duration are not acoustic pronunciation or speaking-speed metrics. Backend speech and physical-device Japanese speech quality remain pending.


## S4A dictionary and vocabulary boundary

`shared/business-japanese.json` is a first-party authored corpus consumed by Vite and packaged in Java resources. `DictionaryLookup.vue` can operate offline directly from it, or use `dictionary-client.ts` to request an explicitly approved short phrase through the API. Browser input/consent changes cancel old requests; source/shape/query are independently validated. A contextual instance in Interview preserves transcript/rubric and never mutates scores.

Spring `DictionaryController → DictionaryService → DictionaryProvider/JishoWordProvider` validates q, controls operator enable flag/rate/concurrency, and normalizes bounded HTTPS JSON. `AuthoredDictionary` supplies typed fallback. Media and scraping remain OFF; no raw upstream response cache. Default disabled Jisho and the initially blocked live network are explicitly distinguished from fixture success.

`useVocabularyStore` and `vocabulary-storage.ts` own a separate IndexedDB database. Only learner query, a first-party content reference if applicable, notes/tags and timestamps are persisted/exported. External definitions/media cannot pass the schema. Flashcards show authored content/learner notes only. This basic notebook does not implement SRS or automatic mastery. Exam/Interview persistence and AI/local scoring remain unchanged.

## S5 multi-turn sessions

Interview store now owns session metadata plus the existing individual attempts. Three authored catalog questions per track are instantiated together; UI advances explicitly and derives reports from current validated attempts. Reuses existing evidence, transcript revisions, voice/AI consent and retry provenance rather than duplicating grading. Whole-session retries pin each parent/root version; comparisons remain per-criterion self-reports.

`brse-interviews` database version 2 adds `sessions` without deleting v1 `attempts`. Load reads both in one readonly transaction; snapshot writes/import/delete replace both in one readwrite transaction. Backup schemaVersion 1 adds optional sessions defaulting to []; legacy input is supported. No Exam/Vocabulary DB migration or backend contract change. No cross-tab coordination. See S5_MULTI_TURN.md for limits and exclusions.

## S6 coherent BrSE scenario and context dependency

`shared/brse-scenario.json` contains authored brief/team facts and three ordered customer prompts. `sessionQuestionIds` fixes S5's baseline catalog at three questions per track, independently of new scenario questions; this prevents catalog additions from changing old session meaning. Scenario IDs are versioned and checked against track/order/parent identity in the backup boundary.

`InterviewSession.scenarioId?` selects the authored CSV conversation. A submitted scenario attempt has `scenarioContext: {attemptId,version}[]` referencing preceding turns in the same session. Submit pins current predecessor versions only after all predecessors are reviewed and current. `sessionReport` derives transitive stale-context state; edit invalidation affects reports without deleting historical text/evidence. New model/self-review writes are denied on stale context. `ScenarioContext.vue` renders pinned context for reviewed attempts and current predecessors for drafts. Old revision texts are retained; context history is not separately versioned per archived revision.

Same IndexedDB v2 stores/atomic backup flow; optional fields keep legacy backup input valid. No HTTP shape changes: per-turn AI requests still exclude history/context; scenario-specific UI states this limitation. Backend authored question registry has the three CSV prompt/variants, protected by parity and API fixture tests. No automatic external inference or media calls.

## S7 minutes and scenario registry

`src/domain/scenarios.ts` provides a versioned CSV/production registry; frontend question catalog flattens authored scenario prompts, while S5's original session IDs remain explicit. Backend registry mirrors all 12 prompts/variants; parity/API fixture tests enforce compatibility. No runtime network lookup populates scenarios.

Optional `InterviewSession.minutes` stores structured evidence-bound learner notes inside the existing sessions aggregate. `minutes.ts` has no runtime dependency on the interview module (type-only imports), so interview backup validation can call its schema/reference checks without an initialization cycle. Cross-validation binds evidence to session attempts, existing transcript versions, exact source quote and offsets. Stale historical references may be loaded but cannot be represented as a current reviewed export.

`minutesState` derives source-version and full-context validity. Explicit user review pins all three conversation versions; editing an entry clears reviewed state. Changes in any source/conversation context invalidate export even if text is unchanged. `saveMinutes` validates a candidate aggregate before mutating store state; legacy backups remain accepted. Retry generates no minutes. `SessionMinutes.vue` renders escaped text and emits source navigation only. Export is local plain text with a self-reported-training label. No grading, semantic confirmation, outgoing message or provider call is triggered by creating/reviewing/exporting minutes.

No IndexedDB migration, server persistence or HTTP shape change. Existing limits/import/clear/privacy boundaries remain. See S7_MINUTES_AND_INCIDENT.md for explicit exclusions.

S7 regression hardening: UI submission has its own in-flight guard and remains available while draft autosave is pending. Queue order, not a global disabled Submit button, serializes storage. Each snapshot captures a generation; completing an older write cannot set saved=true after newer draft input. Real IndexedDB lock and deferred-write tests cover this boundary.

## S8 evidence retry queue

`src/domain/review-queue.ts` has a strict snapshot schema and cross-reference validation with type-only Interview imports. The backup boundary validates queue source revisions/criteria/quotes, unique source keys, bounded retry links and pinned parent/session identity. Currentness is derived from transcript and transitive scenario context; stale historical entries are preserved, never rebound automatically.

Interview store persists attempts/sessions/reviewQueue snapshots in queue order; IndexedDB version3 adds only the new store and preserves v1/v2 data. All three stores load/replace atomically. Backup v1 gains optional reviewQueue defaulting to[], with existing size/count limits. Minutes writes also validate existing queue references; import/clear act on the entire Interview aggregate, with no Exam/Vocabulary DB change.

`ReviewQueue.vue` emits local navigation to current source or linked retry. Source self-ratings and AI assessments remain distinct. Queue additions are explicit criterion choices, deduplicated without silently changing snapshot provenance. Ordinary retries use existing parent/version guards; scenario retries instantiate a full same-scenario session. Existing unfinished retry is resumed rather than duplicated. DONE is a manual practice flag requiring a completed current retry, never a model result/mastery score. No HTTP/API/provider change; adding or reviewing queue does not transmit data.

## S9 fixed-rule vocabulary scheduling

`spaced-review.ts` validates a versioned event log and deterministically replays grades to derive intervals/due dates. The bookmark schema adds default contentVersion=1 and optional schedule. Note edits advance content version, leaving old schedule visibly stale; tags do not. An ephemeral content key plus version/event-count binds a revealed card to grading and rejects stale/double actions. No old note text or external provider response is copied into schedule history.

`gradeBookmark` requires eligible content, current schedule, due time and capacity before generating a validated next bookmark. The Pinia review action validates the candidate full backup/5 MB bound before mutation and queues the existing atomic bookmark-store replacement. Existing vocabulary database/backup version1 remains; old input defaults to unscheduled, and older software may reject enriched output. No Exam/Interview DB or server change.

`ScheduledVocabulary.vue` separates due-only scheduling from free flashcard browsing. Explicit reveal/grade, next-interval preview, due/waiting/missing-note/stale/full counts, recent history and confirmed per-card reset are local UI actions. On-page clock ticks refresh due state; timestamps recover from the persisted event log after reload/offline. Dates use browser locale; intervals are elapsed24-hour days. This is not a certified time source, retention prediction or mastery score. No reminders/notifications/calendar integration.

## S10 read-only learning dashboard

`dashboard.ts` projects nullable source aggregates into separate exam/interview/queue/vocabulary summaries, navigation targets, local-calendar buckets and bounded recent activity. Null means unavailable/unread, while[] means a successfully read empty module. No combined score, source mutation or persisted derived aggregate. Timer completion uses only EXAM_END timestamps; transcript revisions and SRS events remain distinct units. Calendar day keys use Intl timezone parts and date-based arithmetic so DST does not create missing/double days. Invalid/future source times are excluded explicitly.

`LearningDashboard.vue` initializes Interview/Vocabulary concurrently and independently, displays pending/error/unsaved states, and derives due counts from the same policy as scheduled review. App owns Exam initialization/recovery once. Interview initialization now shares its in-flight read promise; Exam loadFailed prevents create/persist overwrite after failed reads until explicit recovery. No background merge, analytics or automatic provider access.

Typed DashboardTarget dispatches current local IDs to Exam timer/results, Interview attempts/sessions/queue/data, and vocabulary scheduled/notebook/data tabs. Workspace initial props apply on mount; normal navigation clears them. Deleted/replaced IDs degrade to an explanatory existing-data screen. Recent old transcript activity opens current attempt with an explicit label. No URL route or new database schema. Home/Exam entry remains intact.

## S11 readiness boundary

`domain/readiness.ts` owns the authored checklist and strict versioned schema. `readiness-storage.ts` owns a separate IndexedDB v1 database; ReadinessWorkspace manages explicit note save, confirmed replacement/reset and failure guards. Writes validate before opening storage and resolve before UI marks saved. No backend/provider/device permissions, no derived competence score. See S11_READINESS.md.

## S12 Project Demo

DemoWorkspace orchestrates immutable domain operations (`domain/demo.ts`) and a separate validated IndexedDB state (`demo-storage.ts`). Timer persists wall-time anchor and accumulated elapsed on actions; running practice continues across navigation/reload, with explicit device-clock limitations. Six authored agenda parts and three self-review criteria are fixed catalogs. Text edits increment source version and remove reviews; quote/version validation blocks fabricated/stale evidence on writes/import. No audio/AI or server dependency. See S12_PROJECT_DEMO.md.

## S13 Demo followups/retry

`domain/demo.ts` extends sessions with optional normalized followups and retry metadata while retaining v1 legacy reads. Evidence is anchored to answer version and presentation sourceVersion. Presentation edits stale followups; answer edits discard their review. DemoFollowups owns explicit answer/review drafts; DemoRetryPanel gates baseline visibility and renders local source snapshots/comparison without provider calls. DemoWorkspace persists the entire validated graph atomically via existing Demo storage; graph validation rejects missing/cyclic/impossible parents. See S13_DEMO_FOLLOWUPS_RETRY.md.

## S14 references + Demo dashboard

Demo session/baseline schema adds defaulted references (HTTPS canonicalization, bounds, duplicate/credential/query/fragment rejection); DemoReferences edits metadata through existing validated atomic save. Retry copies links into the new project's context and independently snapshots them. No fetch/provider integration. Dashboard reads Demo separately, treats unavailable as null, emits typed DEMO_SESSION/DEMO_DATA targets; DemoWorkspace validates target existence after fresh load and avoids silent fallback. Daily Demo events are creation timestamps only, not invented completion dates. See S14_DEMO_REFERENCES_DASHBOARD.md.

## S15 Demo practice plan boundary

`demo-plan-model.ts` defines bounded date/evidence snapshots; `demo-plans.ts` implements immutable creation/dedup/reschedule/linked retry/manual done/delete and computes stale/doneCurrent. Demo backup validates plan source/retry crossrefs before the existing atomic state write. DemoPlanBoard emits whole proposed backup to DemoWorkspace commit, which changes UI only after persistence success. INDEPENDENT incomplete child gates plan evidence rendering; metadata and deliberate history access remain available. Dashboard reads plans with sessions, shows due/stale counters and DEMO_PLAN navigation; no writes/provider requests or common score. See S15_DEMO_PRACTICE_PLANS.md.

## S16 Technical Drill

Authored shared catalog adds3JOB questions with reference checkpoints; mapped core Question fields are registered in Interview and mirrored in backend authored catalog. TechnicalDrills is a selection/scoped-history view using the existing Interview store, flush and typed INTERVIEW_ATTEMPT navigation. InterviewWorkspace renders a mode-gated checkpoint panel; no duplicate persistence or execution sandbox. Existing JOB rubric/evidence/queue/retry and consent boundaries apply, explicitly not a technical correctness evaluator. Original three-turn scripts remain fixed. See S16_TECHNICAL_DRILLS.md.

## S17 technical goals and catalog metadata

Authored catalog extends to6technical prompts; stack/level metadata is excluded from core Question payload and mirrored backend fields remain prompt-only. filterTechnical applies intersection filters without mutation. TechnicalGoals uses a separate strict versioned database/backup via technical-goals-storage. Domain helpers validate manual linking to REVIEWED matching question, pin transcript versions, derive current/stale/missing and separate mode counts; no NLP goal interpretation or score aggregation. Source unavailable is null/N/A; DONE may become historical after source edits/deletion. Store separation permits recovering goals before Interview with explicit missing refs. See S17_TECHNICAL_STACK_GOALS.md.

## S18 mode-specific technical goals and dashboard

Goal schema normalizes missing mode to ANY, uniqueness scopes OPEN by question+mode. Domain helpers reject wrong-mode new links; derived count/met separates matching current links from excluded imported modes while retaining source-currentness checks. Dashboard independently reads goals, takes nullable Interview source, emits TECHNICAL_GOAL(id)/TECHNICAL_GOALS targets, omits objective text and never writes on read failure. TechnicalGoals validates exact target after fresh read, focuses its article or reports missing; a load error stays unavailable rather than falsely deleted. No backend/schema-version change. See S18_MODE_GOALS_DASHBOARD.md.

## S19 guest profile/claims boundary

`domain/profile.ts` models optional basics, manual projects, versioned CV text and separately self-confirmed claims; exact quote checks current source only, old source claims stale and cannot confirm until explicitly re-saved. No AI extraction or claims-to-prompt coupling. `profile-storage.ts` validates full strict backup before atomic IndexedDB write; ProfileWorkspace commits UI after success and guards read failures. TXT import produces only a bounded UTF8 draft, not parsed commands or auto-extracted claims. Profile never enters dashboard/provider/backend. See S19_GUEST_PROFILE_CLAIMS.md.
