# Delivery status

## Audit — completed

At start, `/workspace/WebLuyenPV_BRSE` contained only an 18-byte README, no source, dependency manifests, tests, backend, or setup instructions. Existing Git working tree was clean. This implementation is new code, not continuation of an assumed previous app.

Read handoff documents 00–08 and IMMERSION_KIT_INTEGRATION_SPEC_V1. Requirements in the direct request override obsolete login assumptions in the handoff. Raw private feedback and uploaded ZIP are outside checkout; no media/Drive videos fetched or claimed reviewed.

## S0 Foundation — implemented

Vue 3 + TypeScript + Vite + Pinia, local fonts, responsive guest navigation, IndexedDB v1 with schema validation, production offline shell, frozen npm lockfile, test/build scripts, CI. No learner auth or frontend secrets.

## S1 Exam vertical slice — implemented, verification recorded in ACCEPTANCE_TESTS.md

Guest home → JLPT/NAT-TEST/BJT selector → external paper/PDF practice → timestamp timer, section locks, pause/reload logs, splits and optional planned checkpoint → manual scores and validation → evidence rules → local history/comparison → exam-only backup/import/delete.

Templates explicitly UNVERIFIED; Official Simulation locked. Fixed-audio labels/policies are supported, audio remains external. Empty results remain null. Pilot rules are disclosed; no standardized score conversion or pass/fail. Tests use fake clocks and temporary browser profiles, not actual scored exams.

## Remaining S1 enhancements / limitations

- Verify current official exam sources per year/level; implement true verified timing and scoring groups before enabling Official Simulation or cutoffs.
- Custom section count, speed-challenge modes and active question counters are not implemented; this release allows three renamed/timed sections and post-session question counts.
- No PDF viewer/upload, audio synchronization, server persistence or multi-tab editing synchronization.
- History compares numeric raw accuracy/time side by side; no calibrated difficulty or causal progress diagnosis.
- No certified clock recovery after offline device clock changes, no measured overrun replay.
- Full accessibility audit and non-Chromium/browser/device matrix pending.

## S2 — local text increment implemented; AI gateway added below

- Six authored questions: job role, motivation, UI→API→DB; BrSE scope, bug reporting, requirements clarification. Track/topic search, separate versioned rubrics.
- One-question text sessions; autosaved drafts, exact transcript versions and composition timestamps; local history.
- Evidence Inspector with quote/offset/utterance/criterion/version links. Local length observations and uncertain review prompts; explicit SELF_REPORTED criterion ratings with required evidence/note.
- Guided and independent retry attempts, paraphrased independent prompt, guidance hidden while composing; independent comparison separates guided conditions and changed baseline versions.
- Transcript edits invalidate feedback/scores; original transcript revisions retained. Retry links pin parent/root versions.
- Separate Interview export/import/delete; strict schemas, safe text rendering, no mutation of Exam data, offline production shell support.
- Automated checks/results: see ACCEPTANCE_TESTS.md and S2_INTERVIEW.md.

### S2 remaining

- Live provider configuration/inference and grading calibration: gateway is implemented, but real AI calls are NOT_RUN because no usable key/model binding was present. Local self-review is never marketed as AI scoring.
- Multi-turn adaptive follow-ups. Current follow-up is authored reference text, not an adaptive conversation.
- Candidate profile/CV extraction and verified claims; personalized answers/grammar assessment and validated model/mentor evaluation.
- User question bookmarks, archived rubric migrations, targeted error-review queue, calibrated mastery.

## S2B — Spring Boot AI gateway implemented; live provider validation blocked by missing key

- Java 21 / Spring Boot 3.5.16 API, verified Maven 3.9.11 bootstrap, reproducible build/test/run scripts and CI Java activation.
- Random memory-only bearer capabilities, 15-minute expiry, revocation, exact ownership checks, session/IP/call/global concurrency bounds, request/response size and timeout limits; no learner account or server transcript database.
- OpenAI chat-completions provider adapter with fixed HTTPS endpoint, server-side key/model, structured JSON request, safe errors and disabled-by-default capabilities.
- Backend validates each criterion/score and exact candidate quote; computes UTF-16 offsets and binds transcript/rubric/version/timestamps. Null scores remain N/A. Follow-up suggestion must cite transcript evidence.
- Browser explicit consent, cancellation/wait timeout, capability cleanup, secondary evidence validation, stale-result rejection, local persistence/export of AI feedback, and transcript edit invalidation. Tokens/keys never enter history or backups.
- AI source/model/score/evidence displayed separately from learner ratings; local workflow remains available when backend/provider fails.
- Backend real-server disabled-provider smoke and fixture-based backend/adapter/browser tests. Live external inference remains NOT_RUN; see backend/README.md and ACCEPTANCE_TESTS.md.

### Still outstanding

- A usable secure `BRSE_AI_KEY`, enabled flag, selected model and allowed provider destination; then restart API and run consented real-provider smoke. Configured availability alone is not proof of health.
- Multi-turn adaptive interview, AI score comparisons across matching model/version and calibrated independent mastery. Current AI follow-up is a grounded suggestion, not an automatic new conversation turn.
- Production hosting, trusted proxy/edge quotas, cross-browser/a11y audits and provider grading quality review.

## S3 — browser-native Voice implemented; physical speech quality/backend speech pending

- Japanese authored-question TTS through available browser voices, local-first voice selection, separate consent for remote voices, cancel and text fallback.
- Consented learner recording with audio-only MediaRecorder, in-memory replay/delete, duration/byte bounds, stream/URL cleanup and stop when page hides/unmounts.
- Browser Japanese Speech Recognition under separate external-service consent; interim/final separation, editable final transcript, low-confidence review notice, required acknowledgement before replacing/appending to draft.
- No auto-submit/score and no audio persisted/exported/uploaded. Strict reviewed-voice metadata persists with text; manual edits clear draft voice stamp. No pronunciation scoring from STT.
- Unit/browser fixture coverage and real MediaRecorder synthetic-microphone validation. Physical Japanese ASR/TTS quality, backend ASR/TTS and acoustic feedback remain NOT_RUN/not implemented.
- Details: S3_VOICE.md. Stable M01–M17 progress: FEATURE_PROGRESS.md. Every future report must include feature progress as requested by the user; repository AGENTS.md records this requirement.

## S4A — Jisho adapter + authored fallback + local notebook implemented

- Shared first-party Business Japanese corpus (9 entries), offline lookup and source/usage labels.
- Spring Jisho words JSON adapter behind disabled-by-default operator flag; fixed HTTPS upstream, short Unicode query bounds, no transcript forwarding, rate/concurrency/time/response bounds and typed fallback states.
- Dedicated Japanese workspace and in-feedback selected-phrase lookup; preserves attempt context and never changes scores merely for lookup.
- Local vocabulary bookmarks, learner notes/tags, filtering and reveal/next flashcards, independent IndexedDB backup/import/delete. No third-party definitions/media persisted.
- Backend/HTTP provider fixtures, frontend schema/store tests, and browser tests; live Jisho remains unverified/blocked by initial proxy 403 and operator access/terms review. No scraping or media enabled.
- Detailed scope: S4_DICTIONARY.md; current counts and evidence: ACCEPTANCE_TESTS.md. Stable module progress: FEATURE_PROGRESS.md.

## S4B — Immersion Kit planned

Immersion Kit metadata/context adapter, actual schema/terms verification, authored fallback and rights gates OFF. SRS scheduling, richer corpus and automatic vocabulary/error queue remain planned. No auth UI added for learners.

## Reusable environment configuration

Saved a draft with tested install/start instructions, `BRSE_AI_KEY` requirement scoped to `api.openai.com`, and suggested enable/model variables. Added provider hostname `api.openai.com` through the secret requirement while preserving existing network presets. This save does not inject values, restart the API or publish. User must enter the key securely, review/save settings and publish the environment. After effective configuration and API restart, run a consented real inference before changing live-provider status from NOT_RUN.

S4A network/config draft saved: added `jisho.org` while preserving existing custom `api.openai.com` and presets; suggested `BRSE_JISHO_ENABLED=false`. Requires user review/save/publish and operator terms review before enabling. Saving the draft is not a live access test or runtime update.

## S5 — fixed-script multi-turn Interview/BrSE implemented

- Both tracks can start a persisted three-turn session and resume from session history.
- Report covers each turn's rubric/self-review notes and opens exact evidence inspector; all-nine-evidence gate for nullable aggregate self-score.
- Guided/Independent whole-session retries preserve each turn's pinned parent/root versions. Per-criterion parent-session comparisons suppress progress claims for guided/stale baselines.
- IndexedDB v1→v2 migration preserves old drafts; session and attempts writes/import/delete are atomic; legacy backups accepted.
- Detailed scope: S5_MULTI_TURN.md. This completes the local fixed-script increment, not full M03/M04/M05/M12. Adaptive follow-ups, continuous customer scenarios, configurable rounds and live full-session AI evaluation remain pending.
- PASS: 90 frontend unit/integration, 18 browser regression (single worker), typecheck/production build; execution details and intermediate failures in ACCEPTANCE_TESTS.md. Live AI/Jisho and physical Japanese speech validation remain NOT_RUN; backend code unchanged this increment.

## S6 — continuous authored BrSE CSV scenario implemented

- New coherent three-stage customer conversation: clarify CSV → communicate team impact/options → confirm limited trial and next steps. Brief and team updates are explicit simulation facts.
- Current-session dialogue timeline, per-turn context version pins, transitive stale detection after upstream edit, ordered resubmission and report/score/retry gates.
- Whole-scenario Guided/Independent retries preserve scenario identity and parent versions while keeping new context and drafts separate from parent answers.
- Legacy backups and original S5 scripts preserved; scenario metadata uses existing atomic Interview persistence. No new auth/media/provider permission.
- Per-turn backend authored catalog extended with three prompts/variants; no automatic context upload or whole-conversation AI claim.
- Scope and limits: S6_BRSE_SCENARIO.md. PASS: 98 frontend unit/integration tests, 31 backend tests, 20 browser acceptance tests, frontend typecheck/build and backend jar package. Details in ACCEPTANCE_TESTS.md.
- Remaining: adaptive branching, more continuous scenarios, structured minutes and calibrated whole-conversation feedback. Live AI/Jisho, physical Japanese speech and hosted deployment remain NOT_RUN.

## S7 — evidence-bound minutes and production scenario implemented

- Second continuous authored scenario: incident intake → facts/unknowns → update plan; no invented root cause or recovery promise. Shared versioned scenario registry preserves existing CSV and S5 script meaning.
- Structured local minutes: scope/decisions/actions/open questions, explicit self-reported confirmation, owner/time and exact candidate/customer evidence with version/offset.
- Validated draft save/update/delete; explicit all-current-conversation review; local labeled TXT export; source/context invalidation blocks stale export. No rubric score change or external sending.
- Minutes included in Interview backup/import, legacy input accepted, stale references preserved as stale; retries start without parent minutes.
- Backend catalog extended with three incident prompts; per-turn API excludes minutes/timeline; provider fixture checks do not imply real inference.
- Submission no longer shares the autosave busy lock; generation-stamped writes prevent a stale saved indicator. Verified with delayed writes and a real browser IndexedDB lock.
- PASS: 109 frontend unit/integration, 32 backend, 23 browser tests, typecheck/production build and backend jar package. Details and corrected intermediate failures in ACCEPTANCE_TESTS.md; scope in S7_MINUTES_AND_INCIDENT.md.
- Remaining: adaptive dialogue, calibrated semantics/whole-conversation AI, additional scenarios, minutes revision history and multi-tab coordination. Live AI/Jisho and physical Japanese speech/deployment remain NOT_RUN.

## S8 — evidence-bound retry queue implemented

- Explicit criterion queue from self-review or validated AI annotation, exact version/quote and source/model snapshot; dedup and stale-source warning.
- Track/status filters, priority/action plan, Guided/Independent retry links, resume unfinished retry and manual practiced/reopen states without mastery claims.
- Whole-scenario retry for contextual role-play; all-turn completeness guard. Deleting a queue item leaves source/retry/ratings intact.
- IndexedDB v2→v3 adds queue store preserving prior attempts/sessions/minutes; atomic three-store persistence, optional backup queue and legacy import.
- PASS: 118 frontend tests, 26 browser regressions, typecheck/production build. Backend unchanged; Java suite NOT_RUN this increment (previous32 PASS baseline). Details in S8_REVIEW_QUEUE.md and ACCEPTANCE_TESTS.md.
- Remaining: SRS/scheduling/reminders, automatic error classification, plan history and calibrated learning dashboard. No backend contract changes; live providers/physical speech/deployment remain NOT_RUN.

## S9 — local scheduled vocabulary review implemented

- Separate due-only review tab, explicit reveal and four self-reported grades, next-interval previews, due/waiting/missing-note/stale/full counters and recent events.
- Deterministic fixed-rule event replay (1-minute retry, day intervals capped180), persisted per bookmark; no retention or mastery inference.
- External references require personal notes; source/media caching policy unchanged. Note changes invalidate schedule, tags preserve it; explicit reset removes that card's history only.
- Snapshot/version/event-count checks reject stale/duplicate grades, early review and over-capacity history. Legacy backups import as new cards; new schedules round-trip with strict validation; Exam/Interview untouched.
- PASS: 127 frontend unit/integration tests, 28 browser regressions, typecheck/production build. Backend unchanged; Java suite NOT_RUN this increment (prior32 PASS baseline). Scope in S9_SCHEDULED_VOCABULARY.md; execution detail in ACCEPTANCE_TESTS.md.
- Remaining: calibrated scheduler, retention research, reminders/background sync, cross-tab coordination and vocabulary links to feedback. Backend unchanged; real AI/Jisho/physical speech/deployment remain NOT_RUN.

## S10 — unified local learning dashboard implemented

- Dedicated dashboard with separate Exam/Interview/queue/vocabulary snapshots and unknown/error states; no pooled skill score or mastery inference.
- Resume links to exact active timer, session, standalone draft, queue, due review/notebook and source result/attempt; module-specific backup links. Existing Home/Exam flow preserved.
-7/30 local-calendar activity table, explicit event units and timezone, bounded/filterable recent events. Missing Exam end timestamps not invented; stale/manual states disclosed.
- Read-only projection, independent source loading, deduplicated Interview init and protected Exam persist/create after failed read. No schema/backend/provider change.
- PASS: 136 frontend unit/integration tests, 31 browser tests, typecheck/production build. Backend unchanged; Java suite NOT_RUN this increment (prior32 PASS baseline). Scope in S10_LEARNING_DASHBOARD.md, execution detail in ACCEPTANCE_TESTS.md.
- Remaining: calibrated trends/readiness, longer-term planning, richer retained audit data, URL routing and cross-tab synchronization. Live providers/physical speech/hosted deployment remain NOT_RUN.

## S11 — Interview readiness local checklist

Implemented M15 first increment: 10 authored online interview preparation items grouped by device/network/space/etiquette, explicit self-report labels, note save, independent IndexedDB persistence, strict versioned export/import, confirmed reset. No new permissions/HTTP requests, personality or competence score. Read failure blocks normal writes; validated recovery allowed. Unsaved notes remain drafts when toggling items. See S11_READINESS.md for contract/limitations.

Progress: **11/17 partially implemented;6/17 not started;0/17 complete expanded vision**. M15 remains partial. Next: project demo practice agenda/timer and evidence review; adaptive interview and real provider verification remain outstanding. Verification final result recorded in ACCEPTANCE_TESTS.md.

S11 verification completed: **PASS140 frontend unit/integration,33 browser acceptance, typecheck/production build**, desktop/mobile inspection. Java unchanged NOT_RUN; live AI/Jisho/physical voice/hosted deployment NOT_RUN. Failure-fixture and initial execution errors documented in ACCEPTANCE_TESTS.md.

## S12 — Project Demo first local increment

Implemented M11: six-part authored10-minute agenda; explicit phase splits, pause/resume/manual finish and device-wall-clock reload recovery; independent history and backup/import/delete; typed post-practice content, versioned3-criterion self-review requiring exact quote and concrete next action. Content edits remove stale reviews. No recording, repo fetching or AI evaluation. Source remains learner self-report. At most1 active/50total sessions, validation and write-failure protection. See S12_PROJECT_DEMO.md.

Progress now **12/17 groups partially implemented,5/17 not started,0/17 completed expanded vision**. M11 remains partial: adaptive technical Q&A, portfolio references, live AI/voice and comparison not delivered. Next increment: structured technical follow-up answers with evidence review and repeat practice for Demo. Backend unchanged; Java tests/build NOT_RUN this increment (previous32test baseline, not a fresh result). Live AI/Jisho, physical Japanese voice, hosted deployment, cross-browser and multi-tab NOT_RUN. Final PASS evidence in ACCEPTANCE_TESTS.md.

S12 final verification: **PASS150 frontend unit/integration,36 browser acceptance, typecheck/production build**, desktop/mobile visual check. No frontend source changes after this verified suite.

## S13 — Demo followups, evidence review and linked retry

M11 extended: three fixed authored technical reflection questions with independent saved answers, answer/source versions, quote-bound self-review and explicit next action. Presentation edits stale existing answers; answer edit/re-confirmation removes that answer's old review. Three current answers enable a fresh timed Demo retry with immutable baseline + parent link. GUIDED shows source hints; INDEPENDENT baseline is not rendered until complete child presentation+three current answers. Comparison displays raw old/new answers and source-change warning, not AI or progress score. Legacy Demo backup/DB reads retained; invalid parent graphs/evidence blocked before writes. See S13_DEMO_FOLLOWUPS_RETRY.md.

Progress unchanged: **12/17 partial,5/17 not started,0/17 complete expanded vision**. M10 deep technical module remains not started; three M11 reflection prompts are not a full technical interview system. Next: portfolio references and Demo dashboard/resume integration, keeping live provider verification separate. AI adaptive followups/AI comparison/voice integration remain pending.

PASS161 frontend unit/integration +3new targeted browser cases, typecheck/production build; final full-browser result in ACCEPTANCE_TESTS.md. Java tests/build NOT_RUN (backend unchanged; previous32-test baseline not rerun). Live AI/Jisho, physical Japanese voice, multi-tab/cross-browser/hosted deployment NOT_RUN.

S13 final verification completed: **PASS161 frontend unit/integration,39 browser acceptance, typecheck/production build**, desktop/mobile inspection. No frontend source changes after verified suite. Remaining live-provider/physical-device/backend-suite items remain NOT_RUN as above.

## S14 — Demo references and dashboard integration

Implemented HTTPS portfolio/repo references per Demo with strict local metadata validation and explicit external navigation only; inherited references and immutable baseline references in retry, backward-compatible load/import defaults. Dashboard reads Demo separately, shows counts/source failures and daily creation events without exposing text/URLs or inventing completion times. Exact ID resume/history and backup section navigation validate fresh source existence; stale link shows explicit missing-source message. Read-only dashboard never overwrites failed sources. See S14_DEMO_REFERENCES_DASHBOARD.md.

Progress unchanged **12/17 partial,5/17 not started,0/17 complete expanded vision**. Repo fetching/verification, adaptive AI dialogue/voice and validated long-term comparisons remain pending. Next: practice planning and connecting Demo improvement actions to retry workflow. PASS168 frontend unit/integration,3new browser cases,typecheck/build; full regression final evidence in ACCEPTANCE_TESTS.md. Backend Java tests/build NOT_RUN (unchanged; previous32test baseline not rerun). LiveAI/Jisho/physicalJapanesevoice/multitab/crossbrowser/hosteddeployment NOT_RUN.

S14 final verification completed: **PASS168 frontend unit/integration,42 browser acceptance,typecheck/production build**, mobile/desktop inspection. Final source unchanged after verified suite. Remaining NOT_RUN limitations above remain explicit.

## S15 — Evidence-bound Demo practice plans

Implemented first local planning loop for Demo: snapshot a current presentation/QA self-review, set/change calendar day, open source, create/link one guided/independent retry, manually mark practiced only when source and completed retry answers are current. Duplicate OPEN snapshot guard, stale-source warning, historical completion label and item deletion preserving sessions. Incomplete independent retry gates plan evidence rendering. Plans included atomically with sessions in Demo v1 backup (legacy defaults[]), bounded/crossref validation and failure preservation. Dashboard shows plan counts/due action, no evidence text. See S15_DEMO_PRACTICE_PLANS.md.

Progress unchanged **12/17 partial,5/17 not started,0/17 complete expanded vision**. No background notifications, adaptive plan, common Interview/Demo queue or verified improvement score. Next: topic-based authored Technical Drill. PASS180frontend unit/integration +3newbrowser,typecheck/build; full regression final result below/in ACCEPTANCE_TESTS.md. Java tests/build NOT_RUN this increment (unchanged; previous32test baseline not rerun). LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN.

S15 final verification completed: **PASS180 frontend unit/integration,45 browser acceptance,typecheck/production build**, mobile/desktop inspection and privacy scan. No frontend source changes after verified suite. Remaining NOT_RUN limitations above still apply.

## S16 — First Technical Drill vertical increment

Implemented authored API retry/idempotency, SQL stable pagination/query investigation and server object/tenant authorization exercises. Separate Technical Drill topic/search/scoped-history view opens exact Interview attempt, waits for flush, reuses transcript/evidence/self-review/queue/Guided+Independent retry/backups and consent boundaries. Reference checkpoints gated for incomplete Independent drafts; no code runner or technical correctness evaluator. Registry now15prompts, original three-turn sessions unaffected. Backend authored catalog mirrored; one new API fixture test exercises all3IDs. See S16_TECHNICAL_DRILLS.md.

Progress **13/17 partial,4/17 not started,0/17 completed expanded vision**; M10 remains partial. M01/M08/M13/M16 not started. Next: drill stack/level filters and learner-defined targets. PASS187 frontend unit/integration,33backend tests and frontend/backend package build,3new targeted browser cases; full regression final evidence follows in ACCEPTANCE_TESTS.md. Backend result fresh this increment, AI success tests use fixture model, not live provider. LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN.

S16 final verification completed: **PASS187frontend unit/integration,33backend,48browser,frontend/backend builds**, desktop/mobile inspection/privacy scan. Backend package rebuilt with new authored catalog. No live-provider/physical-device or hosted deployment success claimed.

## S17 — Technical stack/scope and learner goals

Implemented6authored technical exercises, adding Vue async state, Spring transactions/external side effects and PostgreSQL execution plans. Intersection topic/stack/scope/search filters; scope disclosed as authored task coverage rather than calibrated difficulty. Existing question IDs/backups/scripts retained; backend catalog mirrored for18totalprompts. Technical history now renders N/A rather than0 on Interview read failure.

New strict independent technical-goals DB/backup: manual objective per question,target1..20, explicit matching submitted attempt/version links, distinct mode counts, current/missing/stale/N/A, manual completion preserving historical state, unlink/delete without changing Interview. Restore goal/source backups independently; no transcript copied. No code execution, CV inference, common skill score or new HTTP endpoint. See S17_TECHNICAL_STACK_GOALS.md.

Progress unchanged13/17partial,4/17notstarted,0/17complete expanded vision. Next: mode-specific targets/dashboard integration. PASS197frontend,33backend and backend package,6targeted browser (3existing updated for6catalog entries+3new goals); full regression final result in ACCEPTANCE_TESTS.md. LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN; backend API fixture success not live quality acceptance.

S17 final verification completed: **PASS197frontend unit/integration,33backend,51browser,frontend/backend builds**, desktop/mobile inspection and privacy scan. Rebuilt backend catalog supports all6technical/18total prompts. Live provider/device/hosted deployment claims remain NOT_RUN.

## S18 — Mode-specific technical goals and dashboard

Implemented explicit ANY/INITIAL/GUIDED/INDEPENDENT target mode, legacy ANY normalization, OPEN uniqueness per question+mode, matching-link guard and imported-mode exclusion from progress. Separate manual counts/mode distribution/currentness semantics preserved; no AI goal interpretation. Dashboard independently reads goals, exposes only metadata/counts, distinguishes unreadable goals from unreadable Interview, prioritizes stale/missing OPEN refs, and navigates/focuses exact goal ID after fresh load. Missing/deleted target reported explicitly; read failures preserved for validated recovery. See S18_MODE_GOALS_DASHBOARD.md.

Progress unchanged13/17partial,4/17notstarted,0/17complete expanded vision. Next: local guest profile/CV facts with explicit learner confirmation. PASS204frontend unit/integration +3targetedbrowser,typecheck/build; full regression final evidence in ACCEPTANCE_TESTS.md. Backend unchanged Java tests/build NOT_RUN this increment (prior33test baseline not rerun). LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN.

S18 final verification completed: **PASS204frontend unit/integration,54browser,typecheck/production build**, desktop/mobile inspection and privacy scan. Backend unchanged/not rerun. No new live AI/Jisho/physical-device or hosted deployment claim.

## S19 — Guest optional profile/CV text and self-confirmed claims

Implemented first M01 local slice: optional alias/career target/Japanese self-description, bounded TXT/paste CV draft+versioned save, manual project CRUD, source-labeled claim editing with exact CV quote, explicit learner confirmation/unconfirmation, edit invalidation/stale source/rebind guards. Separate strict profile DB/backup/delete with write-after-success/read-failure preservation. No learner account, CV parser/extraction, backend/provider request, automatic prompt integration or dashboard disclosure. See S19_GUEST_PROFILE_CLAIMS.md.

Progress14/17partial,3/17notstarted,0/17complete expanded vision. M01 still partial; M08/M13/M16 unstarted. Next: learner-selected confirmed claim context for practice, preserving provenance and separate AI consent. PASS214frontend unit/integration,3targetedbrowser,typecheck/build; full regression final evidence in ACCEPTANCE_TESTS.md. Backend unchanged Java build/tests NOT_RUN this increment (prior33test baseline); actualAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN.

S19 acceptance also caught/fixed shell navigation overflow from the added module: fixed sidebar now scrolls on short desktops with non-shrinking children. Added1280x600 data→profile→home browser regression. Full suite rerun required after CSS change; initial57suite had3existing navigation failures, not accepted as PASS.

S19 final verification completed: **PASS214frontend unit/integration,58browser,typecheck/production build**, desktop/mobile inspection including short-desktop sidebar regression and privacy scan. All54previous browser cases remain passing after shell fix. Backend unchanged/not rerun. No source changes after verified suite.


## Vercel deployment diagnosis — 2026-10-22

Commit a1e4f8c chỉ có README.md; ứng dụng vẫn chưa được Git theo dõi trong workspace. Vercel clone commit đó nên không có output để phục vụ. Đã thêm vercel.json (Vite/npm ci/npm run build/dist) và docs/VERCEL_DEPLOYMENT.md. Chưa commit/push hoặc deploy remote.

PASS: npm run build (bao gồm vue-tsc và Vite production build), git diff --check. NOT_RUN: unit/browser/backend tests đợt cấu hình này, Vercel remote và production API. Baseline S19: 214 frontend +58 browser tests PASS từ đợt trước, không phải chạy lại. Tiến độ không đổi: 14/17 có một phần, 3/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng.


## Publish source để Vercel build

Người dùng đã yêu cầu commit/push source lên GitHub main. Đã kiểm tra danh sách 173 file staged, loại trừ generated artifacts/private ZIP/.env và quét mẫu private keys/provider/GitHub tokens/Drive URLs: PASS (không phải chứng nhận không có mọi loại bí mật). Build frontend PASS ở bước cấu hình Vercel ngay trước đó; không chạy lại tests trong bước publish. Tiến độ vẫn 14/17 có một phần, 3/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng. Vercel remote/production API NOT_RUN; kết quả push được báo ở phản hồi thao tác.
