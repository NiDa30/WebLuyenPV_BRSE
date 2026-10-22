# Acceptance evidence — Exam, Interview, Voice, AI and Dictionary/Vocabulary

Validated on 2026-10-21 in this cloud machine: Node 24.19.0, npm 11.9.0, system Chromium 154.0.8037.57. Tests use synthetic authored inputs only; no private feedback, exam PDFs, real exam scores or provider media.

| Check | Status | Evidence / scope |
|---|---|---|
| Lockfile installation | PASS | `npm ci --cache /tmp/brse-npm-cache --no-fund` |
| Unit/integration | PASS | `npm test`: 84 executed, 84 passed, 0 skipped, 10 files |
| TypeScript + production bundle | PASS | `npm run build` runs `vue-tsc --noEmit` then Vite; generated `dist` shell/assets/SW |
| Guest end-to-end | PASS | Browser selector → timer → split → pause/reload → three sections → invalid/valid scores → exact 3 unfinished → history → backup/delete/import |
| Running reload and automatic expiry | PASS | Browser 2-second parts; reload recovers and locks first part, next starts explicitly |
| Invalid import / mobile | PASS | Browser schema rejection preserves attempt; 360px has no document horizontal overflow |
| Offline production workflow | PASS | Initial shell cached; context offline + reload → timer/split → completed sections → result save → offline reload/history/report |
| Comparison | PASS | Browser two imported engine-generated completed attempts: matching conditions COMPARABLE; changed config version NOT_COMPARABLE |
| Browser acceptance summary | PASS | `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e`: 17 executed, 17 passed, 0 skipped |
| UI visual inspection | PASS | Home inspected at 1440px and 360px; screenshots retained outside checkout under `/tmp/brse-home-*.png` |
| Production dependency audit | PASS | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities at execution time |
| Official exam simulation / cutoffs | NOT_RUN | Deliberately disabled; current source structure/year/score groups unverified |
| Real 30-minute wall-clock exam | NOT_RUN | Exact 30/31-minute timestamp tests executed deterministically; not a timed human trial |
| Firefox/WebKit/physical devices | NOT_RUN | Only system Chromium tested |
| Formal accessibility audit | NOT_RUN | Native labels/keyboard controls and responsive checks implemented; not a full a11y audit |
| Live external AI, CV extraction, voice, Japanese providers | NOT_RUN | AI gateway exists and is fixture-tested; real inference needs secure provider configuration |
| GitHub-hosted CI/deployment | NOT_RUN | CI workflow authored; not pushed or deployed from this task |

## Unit coverage details

- Timer: exact 30-minute expiry after simulated 31-minute gap; clamp/no negative; monotonic progression despite wall skew; background elapsed; reload no double-count; checkpoint deduplication; pause/resume; wrong-section/repeated end guard; explicit next and no borrowed listening budget.
- Rules: exact unfinished counts; unknown accuracy/totals; disclosed pilot speed/accuracy patterns; guardrail on speedup/fixed audio; no BJT raw-to-official conversion; strict comparison conditions.
- Storage/results: invalid negative/out-of-range/count/score relationships; null preservation; official self-reported type retained; reopen IndexedDB; JSON/config/event round-trip; malformed/version/oversize/duplicate-ID/multiple-active/unknown-field import rejection; deletion.

## Failures investigated and corrected

- Initial `npm ci` could not run because this previously empty repo had no lockfile. Generated the initial lockfile with `npm install`, then verified frozen `npm ci`.
- Playwright's default browser cache was unwritable and its download host denied by network policy. Used the existing `/usr/bin/chromium` via the explicit executable override; no TLS/checksum bypass and no claim that bundled Playwright Chromium was installed.
- Offline browser test initially failed on JS/CSS cache matching due to `Vary: Origin`. Corrected service worker to use build-specific, same-origin precached static assets with explicit matching; repeated offline acceptance test passed. This matching policy does not cache private API responses.
- Vite reports non-fatal upstream Zod comment-annotation warnings; build completes. No assertions disabled, no zero-test runs reported as validation.

Run instructions are in README. Failing browser runs retain traces under ignored `test-results/`. Tests never write application fixtures from private handoff content.


## S2 local Interview verification

**PASS:** 16 added unit/integration tests and 2 added browser acceptance tests (44 unit/integration and 7 browser tests total, including all existing Exam regression cases). Final production build/typecheck passes.

- Domain: separate track/rubric versions, exact transcript evidence/offsets/timestamps, null scores before learner review, empty/oversized input rejection, no inferred AI/pronunciation/personality scores, transcript editing invalidation and revision retention.
- Learner reviews: require valid criterion, exact quote, 0–3 score and non-empty explanation; full weighted aggregate only after all three evidence-backed self-ratings; updating a criterion does not duplicate it.
- Retry: distinct empty guided/independent attempts; independent prompt differs; original answer preserved; parent/root transcript versions pinned; mixed guided conditions or changed baseline versions do not produce an independent-progress claim; compare self-score and evidence deltas with N/A for missing reviews.
- Portability: exact round-trip of full retry tree; reject wrong track, unknown rubric, stale/forged quotes, extra fields, duplicate IDs, missing ancestors, cycles, oversized/corrupt/future-schema backups. Invalid writes preserve existing data. Interview persistence/deletion does not alter Exam IndexedDB.
- Browser JOB flow: saved draft → reload → answer/transcript → invalid exact quote rejected → three criterion self-reviews → guided retry → independent retry → comparison → edit/invalidated feedback → transcript v2 → history reload.
- Browser BRSE mobile/offline flow: distinct rubric → literal malicious HTML text, no image execution → backup → invalid import preserves data → delete/import → offline reload restores transcript; no horizontal document overflow at 360px.
- Visual inspection: authored question bank and evidence feedback layout at 1440px; screenshots in `/tmp/brse-interview-*.png` outside checkout. Browser checks mobile at 360px.

One persistence test initially assumed IndexedDB would preserve insertion order; made the repository explicitly return newest-created attempts first and tested that ordering. Browser locator failures were corrected using the actual accessible names/roles; the decorative navigation icon is hidden from assistive technology. No assertions were skipped or disabled.

**At the S2 local baseline, NOT_RUN:** live LLM scoring/latency, server capability ownership/rate limiting, CV, speech/providers and independent mastery. S2B below subsequently implements and tests capability ownership/rate limiting; live inference, CV, speech/providers and full cross-browser/a11y remain NOT_RUN.


## S2B AI gateway verification — latest increment

**PASS:** 51 frontend unit/integration tests (7 added), 18 backend Java tests, 10 browser tests (3 added), frontend typecheck/build and executable Spring Boot jar package. Zero skipped tests in these executed suites.

- Backend: 4 capability-registry tests (wrong-owner token/unknown ID, revocation, exact TTL expiry, IP bucket reset, call and in-flight bounds); 9 Spring API/filter/validator tests (disabled provider, consent, rubric, unknown fields/JSON, exact evidence binding, track mismatch, sanitized failures, bad scores/quotes, duplicate criteria/follow-up, null-score policy, delete, origin/body limits); 5 adapter HTTP fixture tests (key only in Authorization, untrusted candidate data in user payload, disabled no-call, 429/401, type/size/malformed/truncated output).
- Frontend: catalog parity, AI/local source separation, legacy and AI-enriched backup round-trip, transcript-edit invalidation, stale in-flight rejection, exact quote/version/rubric/criteria checks, memory-only capability flow and delete, provider failure cleanup, malformed/oversized capability response.
- Browser real backend: Spring Boot starts disabled, GET capabilities is actually requested, local practice works, AI action disabled without configuration. This is not a mocked health response.
- Browser fixture AI: explicit consent gates outbound assessment; validated model score/evidence persisted and reloads; capability token absent from IndexedDB; edit removes AI output. Invalid evidence and provider outage preserve the local transcript. Fixture successes are not real-provider inference.
- All prior Exam and local Interview browser acceptance tests remain PASS, including offline/mobile/portability cases.

The backend was packaged with `npm run build:api`, which executes its 18 tests before creating `backend/target/trainer-api-0.1.0.jar`. Maven bootstrap uses pinned official SHA-512. Initial Maven DNS failure was corrected with the provided HTTPS proxy; this image's missing ct.sym was handled using verified Java 21 compiler modules and source/target 21, without disabling verification or lowering Java. Compile/constructor wiring errors encountered during implementation were corrected before the passing run.

**NOT_RUN / remaining prerequisite:** live OpenAI request, model availability/cost/grading calibration, hosted CI/deployment, multi-turn adaptive conversation, CV processing and voice/providers. No injected AI key/model was present; no claim of real inference or production readiness. A configured availability flag is not proof of successful provider access.


Packaged-runtime smoke **PASS**: started `java -jar backend/target/trainer-api-0.1.0.jar`; made actual GET capabilities on API port 8080 and through Vite port 5173. Both returned NOT_CONFIGURED with external audio disabled. Actual session POST returned 400 without consent and 503 AI_NOT_CONFIGURED with consent while no key/model was injected. No real external provider call was made.

Reusable environment draft **saved**, not applied/published: `install_script`, `start_skill`, `BRSE_AI_KEY` secret requirement, suggested `BRSE_AI_ENABLED=true`/`BRSE_AI_MODEL=gpt-4.1-mini`; added secret destination `api.openai.com`. Secure value entry, review/save and environment publication are user actions. The running API remains unconfigured until effective variables are supplied and it is restarted; draft persistence is not live inference evidence.


## S3 browser-native Voice verification — latest increment

**PASS:** 73 frontend unit/integration tests (22 added), 13 browser acceptance tests (3 added), full frontend typecheck/production build. Backend source was not changed in this increment; its previous 18-test PASS remains a baseline, and the real disabled backend is started/tested by the browser regression suite.

- 19 controller/TTS-policy tests: separate recording/ASR consent, denied microphone and unsupported ASR fallback, local record/stop/track cleanup, blob replacement/delete/revoke, 2-minute timer, 10 MiB bound, permission arriving after cancel/disposal, recorder error/stop watchdog, recognition interim/final separation, repeat-result deduplication, confidence null/low values, malformed/overlong result rejection, denied/network/no-speech/audio/language errors, engine constructor failure, ASR bound/watchdog, Japanese voice filtering and remote voice consent.
- 3 storage/provenance tests: reviewed voice applies to DRAFT only; no automatic submission; transfers strict metadata to revision and preserves backup/reopen; no raw audio/URL/token persisted; manual draft edits clear reviewed stamp; transcript edit/resubmit retains old history without incorrectly stamping new text; reject unreviewed/wrong-language/confidence/raw-media fields.
- Browser ASR/TTS **fixtures**: consent gate, interim never fills answer, low-confidence warning, corrected transcript, acknowledgement, explicit apply then separate submit, reviewed-source label, reload persistence without audio; local TTS and separate remote-voice consent; denied and unsupported recognition still allow text.
- Actual Chromium MediaRecorder with **synthetic microphone**, not a physical Japanese speaker: capture → stop → blob replay control → every media track ended → delete → page hidden stops tracks → restart → leave Interview stops tracks. 360px document has no horizontal overflow.
- All 10 previous Exam/Interview/AI gateway browser tests remain PASS, including offline and backup/import cases. Final combined suite: 13/13, zero skipped.

**NOT_RUN:** audible Japanese TTS quality, real Japanese speech recognition/physical microphone quality, non-Chromium/device matrix, backend speech service and acoustic pronunciation scoring. No test calls a real browser recognition cloud service or AI provider. ASR/TTS fixtures are not described as live speech success. MediaRecorder synthetic capture is separate from actual speech-quality validation.

A TypeScript test-fixture Promise annotation was corrected after the first typecheck; final build passes. Additional cleanup for page-hide and malformed browser events was added and then the combined suite rerun successfully. No assertions skipped/disabled.

Feature progress is tracked in FEATURE_PROGRESS.md (stable M01–M17), with per-increment scope and remaining work. User-required progress reporting is recorded in repository AGENTS.md for subsequent turns.

Voice UI was also visually inspected on the running development app at 1440px and 360px; screenshots remain outside checkout in `/tmp/brse-voice-desktop.png` and `/tmp/brse-voice-mobile.png`. The actual environment has no Japanese synthesis voice installed, and the UI correctly presents text fallback. A final internal request through the development frontend proxy returned API state NOT_CONFIGURED; live AI is still not claimed.


## S4A dictionary/vocabulary verification — latest increment

**PASS:** 84 frontend unit/integration tests (11 added), 30 backend Java tests (12 added), 17 browser tests (4 added), frontend typecheck/build and runnable Spring Boot jar package. Zero skipped tests. After strengthening first-party-source validation, the 4 dictionary browser tests were rerun and passed; the previous full 17-case suite also passed.

- Java adapter HTTP fixtures (6): correctly encoded Japanese query, NFC/code-point bounds, disabled/invalid input no upstream call, kana-only words, empty results, normalized labels/source links, no media propagated, 429/500, malformed JSON/HTML/schema and byte bounds.
- Java dictionary API/service tests (6): actual Spring request/filter routing; disabled provider authored fallback/no outbound call; one-q-only/missing/duplicate/private-context rejection; external source and media/scraping gates; distinct error/no-result fallback; per-peer outgoing rate budget; invalid query rejected before provider.
- Frontend dictionary tests (6): NFC/code-point/control/surrogate validation, authored corpus/provenance and forged-source rejection, external link/rights/media schema restrictions, encoded query-only request, response-query match, offline/error/rate/schema/oversize fallback and abort propagation.
- Vocabulary storage tests (5): bookmark dedup and source separation, notes/tags/round-trip/reopen, authored/learner-note-only flashcard backs, malformed/version/size/duplicate/external-definition/media import rejection without data loss, source/query/note limits and durable delete. Writes/import/delete leave exact Exam and Interview data/feedback unchanged.
- Browser offline authored lookup → bookmark → learner note/tags → flashcard → export → corrupt import rejected → delete/import → offline reload persists.
- Browser fixture Jisho: consent off makes no online request; only selected short q is sent after consent, malicious-looking gloss renders literally with no img/audio/iframe, notebook/cards do not retain external definition; 360px has no document horizontal overflow.
- Browser actual disabled backend: PROVIDER_DISABLED with first-party fallback. Bad query/schema/network fixture paths recover safely.
- Browser contextual lookup: rejects selecting whole transcript; selects 担当, retains transcript/rubric and N/A self-score, saves query and sees it in the separate notebook. No score added for lookup.

**Live Jisho: not successfully run.** Initial read-only request for the nonprivate word 担当 failed with proxy CONNECT 403. Allowed-domain draft update adds `jisho.org` while preserving `api.openai.com` and package-manager presets, plus a suggested `BRSE_JISHO_ENABLED=false`. Draft saved, not applied/published; flag stays disabled until operator access/terms review. No key is requested for the public words JSON API. Provider successes are fixture-based, not live verification. Kanji/examples scraping, external media, Immersion Kit and SRS remain NOT_RUN/not implemented.

Prior real AI and physical Japanese speech quality prerequisites remain unchanged; no live provider or media rights claims were added. Only authored app corpus is precached in the offline build, no upstream response cache.

## S5 fixed-script three-turn sessions — current increment

**Frontend unit/integration PASS: 90 tests / 11 files, zero skipped.** Six new session tests cover:

- Real IndexedDB v1→v2 migration retains a pre-existing private draft; new sessions store starts empty.
- Ordered track-specific turns, unfinished draft persistence and session backup/delete/import round-trip.
- Premature retry rejection; Guided/Independent whole-session retry creates blank attempts and pins each parent transcript version.
- Aggregate self-score stays N/A until all nine criteria have evidence, then derives 67 for all-2 ratings; transcript edit immediately invalidates completeness/aggregate.
- Parent version changes block independent progress comparison; stored session references remain valid.
- Corrupt/missing session references reject import without changing in-memory/exported data; legacy backups without sessions still import.

Browser session acceptance: actual UI completes three BrSE turns and nine evidence self-reviews, reloads/resumes, observes aggregate 33 for all-1 ratings, starts independent whole-session retry with blank draft and hidden guidance, returns to original and edits transcript, sees aggregate N/A and 2/3 complete. Mobile 360px has no horizontal overflow. Existing per-attempt Evidence Inspector handles exact quotes/versions. All requests to live AI remain disabled or fixture-based as before.

The first full browser run found two old test helpers explicitly opening database v1. Updated those inspection helpers to open the current DB version (privacy assertions retained). A later two-worker run passed 17/18; an autosave-label wait timed out once. Both original Interview browser tests passed when isolated without increasing timeouts or removing assertions. Final single-worker regression outcome is recorded below after execution; the timeout is not represented as a product fix or a clean initial run.

Visual inspection: session report at 1440px and 360px, screenshots outside checkout at `/tmp/brse-session-desktop.png` and `/tmp/brse-session-mobile.png`. Timestamp text explicitly includes waiting between turns, not speech duration.

**NOT_RUN:** new live AI/Jisho requests, physical Japanese speech quality, hosted deployment, non-Chromium devices and multi-tab synchronization. Backend Java source/contracts unchanged; the previous 30-test backend PASS is a baseline, not a newly executed backend unit suite this increment. Browser regression starts the actual backend in disabled-provider mode. Adaptive conversations and whole-session model evaluation are not implemented.

**Final regression PASS:** `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=1` — **18/18 browser tests, zero skipped**, including all previous Exam/Interview/AI-fixture/Dictionary/Voice checks and the new full-session path. Production typecheck/build runs as the suite's preview prerequisite and passed with final source. Frontend unit suite **90/90 PASS**. `git diff --check` PASS; source/public/shared/resource/dist privacy scan found no private handoff marker or Drive URL. No live provider calls or deployment performed. Final log `/tmp/brse-sessions-e2e-serial.log`; frontend unit log `/tmp/brse-sessions-unit.log` (logs remain outside checkout).

## S6 continuous authored CSV role-play — current increment

**PASS: 98 frontend unit/integration tests (12 files), 31 Java backend tests, 20 Chromium browser acceptance tests, zero skipped; frontend typecheck/production build and runnable backend jar package.** Full browser command: `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=1`. Backend `npm run build:api` executes the Java suite before packaging. No failed/skipped tests in these final runs.

Eight new scenario unit/storage tests cover:

- New scenario catalog and original S5 question order remain separate; unsupported track/scenario and standalone scenario attempts rejected.
- Store-level turn order guards even when UI navigation is bypassed; exact predecessor versions persisted.
- Complete scenario context round-trip through backup/delete/import.
- Upstream edits make both downstream turns stale, block aggregate/retry/new self-rating/new AI attachment; sequential resubmission refreshes versions and invalidates old self-ratings.
- Restored stale conversation stays stale, preserving exact old pinned context.
- Guided/Independent whole-scenario retry keeps scenario identity, blank answers, parent versions and fresh own-session context.
- Forged context versions/order, unexpected private fields, removed scenario and wrong track are rejected atomically without changing export.
- Exam data remains exactly unchanged through scenario persistence/import/delete.

New Java API fixture test exercises all three CSV prompts with BRSE rubric and exact text evidence. Existing catalog parity now checks all nine frontend/backend prompt/variants. Provider is a test fixture, not live AI; whole-conversation AI assessment remains unimplemented.

Two browser scenarios cover all three customer turns and nine evidence ratings; pinned timeline, escaped hostile-looking text, report score gate, upstream edit/stale warnings, export/delete/import/reload, hidden AI/self-review while stale, sequential context refresh, and 360px no horizontal overflow. Whole-scenario Guided/Independent retries retain empty drafts and show only the current retry's conversation context; unique parent answers are absent while composing. All previous 18 browser regressions also PASS, including offline, Exam, Dictionary, AI fixtures and synthetic MediaRecorder.

Visual inspection: actual step-two context at desktop 1440px and mobile 360px; screenshots `/tmp/brse-s6-desktop.png` and `/tmp/brse-s6-mobile.png`, outside checkout. No full accessibility or cross-browser audit claimed.

**NOT_RUN / remaining:** real AI inference and whole-conversation grading calibration, live Jisho validation, physical Japanese ASR/TTS quality, deployed/hosted CI, non-Chromium devices, multi-tab edits. Fixed customer responses do not adapt to learner intent. No external media downloaded, embedded or cached. Logs outside checkout: `/tmp/brse-s6-unit.log`, `/tmp/brse-s6-e2e.log`, `/tmp/brse-s6-api-package.log`.

## S7 evidence-bound minutes + production incident scenario

**Frontend PASS: 109 unit/integration tests / 14 files, zero skipped (includes autosave hardening below). Backend PASS: 32 tests, zero skipped, runnable jar package (`npm run build:api`).** Production frontend typecheck/build also passed; browser preview rebuilds the final source before regression.

Nine new unit/integration cases cover:

- Save structured minutes without changing exact transcript/reviews; reviewed/current evidence required for export.
- Draft minutes during incomplete practice cannot be marked reviewed or exported.
- Exact customer prompt evidence is allowed with explicit learner-reported confirmation; no semantic/customer verification inferred.
- Source edit invalidates reviewed export even with identical wording; explicit quote rebind/review uses the new version.
- Upstream context changes invalidate minutes even when the quoted downstream revision number has not changed.
- Stale minutes survive backup/delete/import; independent retries contain no parent minutes.
- Invalid quote/version/action owner/time, duplicate entry IDs and size/count limits reject before mutation.
- Cross-session evidence and injected private fields reject atomically, preserving exact prior backup.
- Production registry order/persistence/retry identity; standalone scenario or switching parent scenario is rejected.

Backend API fixture test checks all three production question IDs, BRSE rubric and exact evidence. Catalog parity covers all12 frontend/backend prompts. This does not measure model reasoning or incident-response correctness.

Two new browser paths exercise the full production conversation and evidence-bound action minutes, invalid quote handling, escaped text, explicit review, plaintext download content, reload, source edit invalidation, explicit rebind/re-review, backup/delete/import, and360px no overflow. The CSV customer-source path verifies self-reported confirmation and no parent minutes in Independent Retry.

Initial full browser run:20 previous tests PASS,2 new tests failed because exact getByLabel selectors did not locate select labels. Snapshot showed correctly named comboboxes. Changed only those test selectors to role/name; both new browser tests then PASS when rerun. No assertions skipped, timeout increased or product behavior bypassed. Final full regression result is recorded below after execution.

Visual inspection: biên bản with a reviewed action entry at1440px/360px; screenshots outside checkout at `/tmp/brse-s7-minutes-desktop.png` and `/tmp/brse-s7-minutes-mobile.png`. Plain TXT export has the training/self-report label and never renders HTML. `git diff --check` PASS; privacy scan of source/shared/public/resources/dist found no private handoff marker or Drive URL.

**NOT_RUN:** live AI/Jisho, calibrated semantic validation/whole-conversation grading, physical Japanese speech quality, non-Chromium matrix, hosted deployment/CI and multi-tab editing. Scripted incident facts are simulated; no real production investigation, external message/calendar/task or third-party media action occurred. Logs remain outside checkout: `/tmp/brse-s7-unit.log`, `/tmp/brse-s7-api-package.log`, `/tmp/brse-s7-minutes-e2e.log`, `/tmp/brse-s7-e2e-final.log`.

Additional regression finding and fix: a subsequent full run passed21/22 but one existing Interview answer-submit check did not advance to feedback. Submit was tied to the same busy flag as background autosave. The UI now uses a dedicated submission guard, so an autosave cannot disable the button during interaction; store writes remain queued. Snapshot generation also prevents an older completed write from marking a newer unflushed draft saved.

Two new store tests hold a save in flight to verify truthful saved status and ordered submission of the latest draft. One new browser test holds an actual IndexedDB readwrite transaction open, waits for background autosave, verifies Submit remains enabled, submits, releases the transaction and checks durable transcript/saved state. No timeout/assertion bypass was introduced. Final unit suite after this fix: **109/109 PASS,14 files**, zero skipped; log `/tmp/brse-s7-unit-final.log`. Final full browser log: `/tmp/brse-s7-e2e-verified.log`.

**Final S7 regression PASS:** `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=1` — **23/23 browser tests**, zero skipped; includes all original workflows, both minutes scenarios and real IndexedDB-lock submission. Production typecheck/build (suite prerequisite) PASS with final source. Combined verified totals: **109 frontend,32 backend,23 browser**; jar BUILD SUCCESS. No live provider or deployed environment claim.

## S8 evidence-bound retry queue — current increment

**PASS: 118 frontend unit/integration tests /15 files;26 Chromium acceptance tests; frontend typecheck/production build. Zero skipped.** Full browser run `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=1` passed all26 cases in one run. No code/test corrections or disabled assertions were required by that run.

Nine new domain/store/storage cases verify:

- Actual v2→v3 migration preserves attempts, sessions and minutes, and creates an empty queue.
- Explicit self-review snapshot/dedup without changing transcript/ratings; absent self/AI evidence cannot be queued.
- Independent child provenance, unfinished-retry guard, manual completion and stale retry/reopen handling.
- Source edit staleness, retained old quote/version, distinct new-version item and stale backup round-trip.
- Whole production scenario retry and all-three-current-turn requirement before practiced flag.
- Fixture AI source/model distinct from self-review; no provider call for queue operations.
- Invalid plans, corrupted quote/version/criterion/private fields, duplicate entries and false target links rejected before mutation; old backup without queue still imports.
- Deleting queue metadata leaves exact source transcript and Exam data unchanged.
- Ten completed linked retries bound history; eleventh rejected before creating an attempt.

Three new browser cases cover deduplicated self-review queue, plan/priority, guided/independent draft separation, manual practiced filter, stale source blocking, backup/delete/import/reload and360px no horizontal overflow; contextual full-scenario retry/resume/all-turn finish; explicit fixture-AI criterion queue with model provenance and no automatic retry. Existing23 browser regressions (including real IndexedDB lock, minutes, offline, Voice and provider fixtures) remain PASS.

Backend source/HTTP contracts unchanged; Java unit/package suite **NOT_RUN this increment**, previous32-test PASS is baseline only. Browser regression starts the actual Spring Boot backend with providers disabled. AI queue test uses fixtures, never real inference. Live AI/Jisho, physical Japanese speech, multi-tab edits, cross-browser matrix and hosted deployment remain NOT_RUN. No SRS/mastery claim or external media action.

Logs outside checkout: `/tmp/brse-s8-unit.log`, `/tmp/brse-s8-e2e.log`, `/tmp/brse-s8-build.log`. Visual screenshots outside checkout: `/tmp/brse-s8-queue-desktop.png`, `/tmp/brse-s8-queue-mobile.png`.

## S9 local scheduled vocabulary review

**Frontend unit/integration PASS:127 tests /16 files, zero skipped.** Nine new cases cover:

- Exact initial AGAIN/HARD/GOOD/EASY delays without source/note mutation.
- Interval growth,180-day cap and forgetting reset.
- Early/duplicate/revealed-content checks and exact due boundary.
-100-event cap, supported policy/grade/timestamps and no private/extraneous event fields.
- Personal-note eligibility for external references and mismatched reveal content key.
- Schedule/due/history close-reopen and backup round-trip; legacy bookmarks become new unscheduled cards.
- Tags preserve schedule; note edits advance content version and block stale schedule until explicit reset, preserving note/tags.
- Forged source version/event timing/derived mastery fields reject import or grading without replacing data.
- Exam/Interview data remain byte-for-structure identical; external definitions/audio/transcripts/provider capabilities absent from vocabulary backup.

Two new browser paths use page clock fixtures (not actual elapsed days): new authored card → reveal/self-rate GOOD → persisted waiting/reload → advance3 days → AGAIN → minute boundary → backup/corrupt import rejection/delete/import → offline reload →360px no overflow. External reference fixture needs own note before scheduled review, never displays fixture external definition in the card, then note edit invalidates schedule until confirmed reset.

Initial browser preflight stopped at typecheck due to an extra parenthesis in the new test's corrupt-backup payload construction. Corrected that test construction; no application checks/timeouts/assertions removed. Final full browser outcome is recorded below after execution.

**NOT_RUN:** backend Java unit/package suite this increment (source/API unchanged; prior32-test PASS baseline), live AI/Jisho, physical Japanese speech, long-term retention effectiveness, multi-tab sync, non-Chromium matrix and hosted deployment. Actual Spring backend runs with providers disabled during browser regression. Policy is fixed-rule self-report scheduling, not calibrated memory prediction. Jisho lookup success in the new rights-preservation case is a fixture, not live access.

Logs outside checkout: `/tmp/brse-s9-unit.log`, `/tmp/brse-s9-build.log`, `/tmp/brse-s9-e2e-final.log`.

**Final S9 browser/build PASS:** `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=1` — **28/28 acceptance tests**, zero skipped, all26 previous regressions plus both new scheduling paths. Production typecheck/build passed as the preview prerequisite using final source. Combined frontend total **127 unit/integration +28 browser**. `git diff --check` PASS; no private handoff marker/Drive URL found in source/shared/public/backend resources/dist. No live inference or media fetched.

S9 final visual/runtime checks: scheduled review with one waiting card, one revealed due card, four interval buttons and recent history inspected at1440px and360px; no horizontal overflow. Screenshots outside checkout: `/tmp/brse-s9-schedule-desktop.png`, `/tmp/brse-s9-schedule-mobile.png`. Existing packaged API restarted; actual GET through development frontend proxy returns AI NOT_CONFIGURED and all external media flags false. Web development port5173 remains running; this is not a hosted deployment or live-provider success.

## S10 unified local learning dashboard

**Frontend unit/integration PASS:136 tests /18 files, zero skipped.** Nine new cases cover:

- Unavailable source(null) versus successfully read empty source([]), including N/A daily cells.
- Zero-valued manual results, separate transcript revisions/attempt modes, no pooled score and no input mutation.
- Missing Exam completion timestamp not assigned a fake day; correct active/result navigation targets.
- Scenario stale-context action priority and historical manual queue completion when source changed.
- Vocabulary due eligibility, stale/missing-note/waiting and retained event counts.
- Local calendar midnight,7/30 windows, DST transition, invalid-zone UTC fallback, bad/future timestamps and recent20 limit.
- Deduplicated Interview initialization during navigation retains newly created draft.
- Exam read failure exposes unknown state and blocks persist/create from overwriting unread data.
- Explicit valid Exam backup recovery clears read failure and restores known-empty state.

Three new browser paths cover empty states/30-day table/module backups/mobile; mixed real UI data and exact timer/session/draft/queue/due-review/result/attempt targets with no transcript or learner-note text on dashboard; and a corrupted Interview database showing N/A while other modules work. The corrupted record is verified unchanged until a valid backup import with explicit confirmation.

Initial test discovery failed because a new Node-side fixture helper imported frontend JSON modules without Node import attributes. Reworked the browser setup to create Interview/Vocabulary data through the actual UI, keeping production imports unchanged. A subsequent full run passed30/31; the new exact-name navigation check found decorative icons included in old navigation accessible names. Marked those icons aria-hidden; visual labels and behavior remain. No assertion/timeout bypass. Final targeted/full outcomes recorded below after execution.

**NOT_RUN:** Java unit/package suite this increment (backend/API unchanged; prior32-test PASS baseline), live AI/Jisho, physical Japanese speech, cross-browser/multi-tab validation, hosted deployment and calibrated learning-effectiveness/readiness. Browser tests start actual Spring with providers disabled. Dashboard is current-state activity projection, not an immutable or verified proficiency record.

Logs outside checkout: `/tmp/brse-s10-unit.log`, `/tmp/brse-s10-dashboard-e2e.log`, `/tmp/brse-s10-e2e-final.log`; final full log is appended below when executed.

**Final S10 PASS:** targeted dashboard3/3, then full `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=1` **31/31 browser tests, zero skipped**. All28 previous regressions remain passing. Full preview prerequisite typecheck/production build passed on final source. Combined totals: **136 frontend unit/integration +31 browser**, not an additional backend suite. Verified log `/tmp/brse-s10-e2e-verified.log`. `git diff --check` PASS; source/shared/public/resources/dist privacy scan found no private handoff marker or Drive URL. No hosted/live-provider claim.

S10 final visual/runtime: inspected dashboard at1440px and360px with active Exam, submitted Interview/self-review, open queue and due vocabulary. Screenshots outside checkout: `/tmp/brse-s10-dashboard-desktop.png`, `/tmp/brse-s10-dashboard-mobile.png`; screenshot browser timezone Asia/Ho_Chi_Minh. No horizontal overflow. Existing packaged API restarted; actual capability GET through frontend proxy returned NOT_CONFIGURED and external media false. Development port5173 remains running; not a hosted deployment or live-provider validation.

## S11 — Readiness checklist (2026-10-22)

PASS: `npm test` 140/140 unit/integration across19files (4 new: neutral defaults, strict invalid backups, limits/version, IndexedDB roundtrip/invalid-write preservation/reset). Typecheck + production build PASS. Mobile360px screenshot manually inspected, document overflow=false (`/tmp/brse-s11-mobile.png`). New browser case covers check, note draft surviving toggles, explicit save, reload, invalid import preservation, export/reset/import.

Initial full browser run had an infrastructure HTTP404 at `page.goto` in exam reload case because a concurrent final build temporarily replaced served dist. This was an execution mistake; no product fix or relaxed assertion applied. Full rerun on fixed build required before final PASS. Java tests/build NOT_RUN this increment (backend unchanged; previous32test baseline). Live AI/Jisho, physical Japanese voice, cross-browser, multi-tab and hosted deployment NOT_RUN. Checklist is self-report, no device diagnostic result claimed.

Fixed-build rerun:32/32 browser tests PASS. An added storage-failure browser fixture then exposed checkbox event handling introduced during final hardening: resetting the native checkbox before asynchronous save made `.check()` fail. Corrected handling leaves native state during the pending write and restores it only on write failure; successful saves update reactive state. No weakened assertions. Final full regression now includes this failure/retry fixture (33 cases).

Final-source readiness2/2 browser cases PASS, including simulated storage quota failure: no false confirmation, retry succeeds. Desktop1440px and mobile360px screenshots inspected, neither horizontally overflows. Final unit rerun140/140 PASS. Production typecheck/build also runs as prerequisite of final Playwright server; no build runs concurrently with preview during final suite.

**S11 final PASS:** full final-source browser suite33/33, zero skipped (`/tmp/brse-s11-e2e-final.log`), frontend140/140 unit/integration, typecheck/production build. `git diff --check` PASS; source/shared/public/resources/dist privacy scan found no private handoff marker or Drive URL. No backend suite or real provider result implied.

## S12 — Project Demo (2026-10-22)

PASS: `npm test`150/150 frontend unit/integration across20files, including10new Demo cases: agenda budget, wall recovery/rollback/bounds, pause/resume, split ordering/overtime, final locks, exact evidence/version, edit invalidation, invalid backup/crossreferences, UTF8/file limits, IndexedDB roundtrip/invalid-write preservation. `npm run build` typecheck+production build PASS.

PASS targeted browser3/3 (`/tmp/brse-s12-demo-e2e.log`): complete local demo/review/invalid quote/edit invalidation/reload/backup; clock-controlled running navigation/recovery/pause/overtime; quota fixture failed write preserving state + retry + mobile360overflow check. No skipped tests or provider fixture passed off as live AI. Full regression final result follows. Java tests/build NOT_RUN (unchanged backend); actual Spring server starts for browser acceptance with providers disabled, which is not a rerun of32Java tests. LiveAI/Jisho/physicalvoice/hosted deployment/cross-browser/multi-tab NOT_RUN.

Visual check: authored synthetic demo on desktop1440px and mobile360px, both document overflow=false; screenshots `/tmp/brse-s12-demo-1440.png` and `/tmp/brse-s12-demo-360.png` outside checkout. Source/shared/public/resources/dist scan found no private handoff marker/DriveURL. `git diff --check` PASS. No screenshots or private source added to bundle.

**S12 final PASS:** full final-source browser suite36/36, zero skipped (`/tmp/brse-s12-e2e-final.log`), all33previous cases remain passing. Final production typecheck/build passed as preview prerequisite. Combined evidence150 frontend unit/integration +36browser; not an additional backend suite. No live provider or physical voice success claimed.

## S13 — Demo followups/retry (2026-10-22)

PASS `npm test`:161/161 frontend unit/integration across21files, including11new cases: legacy DB/backup normalization, answer status/bounds/current-source evidence, version/edit invalidation, stale source/re-confirmation, retry eligibility/active guard, blank child/deep snapshot/roundtrip, source-change detection, malformed evidence/source refs, parent graph/cycle/limits, rejected write preserves saved backup. Typecheck/production build PASS (`/tmp/brse-s13-build.log`).

PASS targeted browser3/3 (`/tmp/brse-s13-targeted.log`): exact quote review and invalid quote, edited answer removes review, edited presentation stales three answers and blocks review/retry until re-saved; reload+backup restoration; GUIDED empty child and pinned old/new comparison, source edit warning; INDEPENDENT hides snapshot through reload until full child completion and re-hides after source edit. Full regression final result follows. Java tests/build NOT_RUN (backend unchanged;32test prior baseline), actual Spring+preview used by browser tests with providers disabled. LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN.

**S13 final PASS:** full final-source browser suite39/39, zero skipped (`/tmp/brse-s13-e2e-final.log`), all36previous cases passing. Typecheck/production build passed as preview prerequisite. Combined161frontend unit/integration +39browser; not a new backend suite. Mobile360px followup form and desktop1440px retry snapshot visually inspected, document overflow=false for both (`/tmp/brse-s13-qa-mobile.png`, `/tmp/brse-s13-retry-desktop.png`, outside checkout). `git diff --check` PASS, source/shared/public/resources/dist privacy scan found no private handoff marker/DriveURL. No live AI/voice or hosted deployment claim.

## S14 — Demo references/dashboard (2026-10-22)

PASS final `npm test`:168/168 frontend unit/integration across22files (7new reference/dashboard cases). Covers unsafe URL protocols/credentials/query/fragment/unknown fields, canonical duplicates/bounds, preserving versions/timer, independent reference snapshots and source-change detection, legacy fields/defaults, rejected write preserving saved data, Demo unknown vs zero, exact actions/source privacy/nonmutation, creation-only timestamps/future omission. Initial unit run had one existing session-minutes test timeout under load at5s; unchanged assertions/timeouts, final full168 rerun PASS (`/tmp/brse-s14-unit-final.log`). Typecheck/production build PASS.

PASS targeted browser3/3 (`/tmp/brse-s14-targeted.log`): reference validation+link attrs/no automatic GitHub request, persisted references+backup roundtrip, dashboard exact active/history navigation and data section scroll, mobile overflow, source deleted between dashboard read/open does not fallback, corrupt Demo N/A/raw preservation and validated recovery. Full regression final result follows. Java tests/build NOT_RUN (backend unchanged), actual Spring/preview used by browser acceptance with providers disabled; not a fresh Java32test result. LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN.

**S14 final PASS:** full final-source42/42 browser suite, zero skipped (`/tmp/brse-s14-e2e-final.log`), all39previous regressions remain passing. Typecheck/production build passed as preview prerequisite. Combined168frontend unit/integration +42browser, not a new backend suite. Mobile360 reference form and desktop1440 Demo dashboard card visually inspected; mobile dashboard/document overflow=false (`/tmp/brse-s14-references-mobile.png`, `/tmp/brse-s14-dashboard-desktop.png`, outside checkout). `git diff --check` PASS; source/shared/public/resources/dist privacy scan no private handoff marker/DriveURL. No live-provider/physicalvoice/hosted deployment success claimed.

## S15 — Demo practice plans (2026-10-22)

PASS `npm test`:180/180 frontend unit/integration across23files (12new plan cases). Covers source snapshot/missing/stale review, duplicate OPEN and real calendar/leap dates, immutable reschedule, source/review staleness, atomic empty linked retry, duplicate/active guard, manual finish eligibility/historical changed source, stale child blocking done, item deletion preserving sessions, legacy plans defaults/schema/crossrefs/bounds/rejected write preservation, roundtrip, dashboard due counts without private evidence. Typecheck/production build PASS.

Initial targeted browser run failed3cases at select lookup: exact getByLabel included option text for native select. Corrected test locators to semantic combobox accessible names, no assertion relaxation or timeout increase; no product fix required for that issue. Final targeted3/3 PASS (`/tmp/brse-s15-targeted-fixed.log`): complete due/dashboard/retry/manual-done/backup loop, stale source and independent plan-hint DOM gating, simulated quota failure preserves state and retry succeeds; includes mobile360overflow check. Full regression final result follows. Java tests/build NOT_RUN (backend unchanged), actual Spring/preview used with providers disabled, not a new32Java-test result. LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN.

Visual verification: mobile360 plan form/card and desktop1440 Demo dashboard with due-plan counts inspected; document overflow=false (`/tmp/brse-s15-plan-mobile.png`, `/tmp/brse-s15-dashboard-desktop.png`, outside checkout). Screens use authored synthetic data, timezone Asia/Ho_Chi_Minh. `git diff --check` PASS; source/shared/public/resources/dist scan found no private handoff marker/DriveURL. No screenshot/raw source bundled.

**S15 final PASS:** full final-source browser45/45, zero skipped (`/tmp/brse-s15-e2e-final.log`), all42previous regression cases passing. Typecheck/production build passed as preview prerequisite. Combined180frontend unit/integration +45browser, not a new backend suite. Independent plan hints tested absent from DOM during incomplete child practice. Backend/live/physical-device NOT_RUN limits above remain unchanged.

## S16 — Technical Drill (2026-10-22)

PASS final `npm test`187/187frontend unit/integration across24files (7new technical cases): registry/topic/variant/checkpoint bounds, original session compatibility, generic JOB evidence without invented correctness, quote validation/edit invalidation, independent prompt/current baseline comparison with null unreviewed deltas, mixed legacy/new backup+DB, store draft flush/resume. Existing catalog sync test verifies all15backend/frontend prompts/rubrics exact. Initial new tests had incorrect assumptions (loadInterviews returns array; initial/independent same-baseline text comparison is eligible but deltas stay null without self-review). Corrected tests to actual established contracts and stale-version guard, no product rule weakened. Final verified log `/tmp/brse-s16-unit-verified.log`.

PASS fresh `npm run build:api`:33Java tests, zero failures/errors/skips, Spring Boot package built (`/tmp/brse-s16-api-build.log`). Added API fixture case for all3technical IDs with JOB rubric. Provider fixture validation is not actual AI quality or live inference. Frontend typecheck/production build PASS. Targeted browser3/3 PASS (`/tmp/brse-s16-targeted.log`): topic filter/draft resume/exact quote/Independent checkpoint gating/backup+reload; SQL/security safe escaped text and exact dashboard source; offline catalog/start and mobile360overflow. Full regression final result follows. LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN.

Visual verification: desktop1440 SQL-filtered bank and mobile360 authored reference panel inspected, document overflow=false (`/tmp/brse-s16-technical-desktop.png`, `/tmp/brse-s16-reference-mobile.png`, outside checkout). Screens use authored exercise content; no private source/media. `git diff --check` PASS and source/shared/public/resources/dist scan found no private handoff marker/DriveURL.

**S16 final PASS:** full final-source browser48/48, zero skipped (`/tmp/brse-s16-e2e-final.log`), all45previous cases passing. Typecheck/production build passed as preview prerequisite. Combined187frontend unit/integration +33backend +48browser, frontend/backend package builds PASS. Backend AI cases are fixtures, not live provider. No frontend source changes after verified suite; live/physical-device/hosted deployment NOT_RUN limitations remain explicit.

## S17 — Technical stack/scope and learner goals (2026-10-22)

PASS final `npm test`197/197frontend unit/integration across25files (`/tmp/brse-s17-unit-verified.log`,10new filter/goal cases). Covers six-drill metadata/filter intersections, no catalog mutation, objective/question/target/version/open uniqueness, reviewed matching manual linkage and ID dedup, separate Initial/Guided/Independent counts, missing/stale/draft/null source distinctions, explicit repinning after edits, manual done/historical missing links, unlink preserving source, strict schema/UTF8 limit/rejected writes, backup without transcript/rubric. Backend catalog sync test covers all18prompts. Existing Technical tests updated to six-drill catalog and exact exercise selection rather than assuming one API/SQL card. Initial build typecheck caught two invalid-test-fixture typing issues (union tuple spread and widened status literal); corrected test typing, no checks disabled. Subsequent Playwright prerequisites run full typecheck/production build.

PASS fresh backend33tests + package (`/tmp/brse-s17-api-build.log`), fixture API case now covers all6technical IDs. Not live AI/provider or quality acceptance. Targeted6/6 browser (`/tmp/brse-s17-targeted.log`):3S16regressions updated for six entries +3goal cases. Goals exercise stack/scope selection, manual links/mode counts/DONE, goal and Interview backup independent restore/missing source/recovery, quota failure, invalid file preservation, corrupt goal DB N/A/locked writes/raw preservation/valid recovery, mobile overflow. Full initial51suite:50PASS/1test-selector strict-mode failure caused by same heading in catalog/history while awaiting async start/flush. Scoped assertion to InterviewWorkspace so it waits for actual navigation, retained title/assertion/timeout; no product logic change. Full rerun final result follows.

Visual: desktop1440 stack-filtered catalog and mobile360 goal form/card inspected, document overflow=false (`/tmp/brse-s17-stack-desktop.png`, `/tmp/brse-s17-goal-mobile.png`, outside checkout). `git diff --check` PASS; source/shared/public/resources/dist scan no private handoff marker/DriveURL. LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN. No code/SQL execution or technical correctness certification claimed.

**S17 final PASS:** full final-source browser51/51, zero skipped (`/tmp/brse-s17-e2e-verified.log`), including48existing cases (updated authored-catalog selectors) and3new goals cases. Final typecheck/production build passed as preview prerequisite. Combined197frontend unit/integration +33backend +51browser, frontend/backend package builds PASS. Repaired navigation selector retains intended assertion and uses actual InterviewWorkspace. No source changes after verification; live/physical-device/hosted deployment NOT_RUN remains unchanged.

## S18 — Mode-specific technical goals/dashboard (2026-10-22)

PASS `npm test`204/204frontend unit/integration across26files (7new mode/dashboard cases): legacy mode ANY default/current counts, question+mode uniqueness/invalid enum, wrong-mode link rejection and imported exclusion, independent source/version/historical completion, unavailable goal vs unavailable Interview vs known empty, exact pending ID/stale-missing priority/source privacy/nonmutation, manual DONE vs currently supported completion. Typecheck/production build PASS, final source built as prerequisite of targeted browser suite.

PASS targeted3/3 (`/tmp/brse-s18-targeted.log`): Initial excluded from Independent goal, explicit Independent linked count/manual finish, exact dashboard goal focus and no objective leak/mobile overflow; deleted source after dashboard snapshot does not select another goal; corrupt goal DB N/A and raw preservation + guarded writes/recovery while Interview stays usable. Full regression final result follows. Backend Java tests/build NOT_RUN (unchanged), actual Spring server/preview used with providers disabled is not a fresh backend33test result. LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN.

Visual verification: mobile360 mode-specific goal form/card and desktop1440 dashboard goal summary inspected; document overflow=false (`/tmp/brse-s18-mode-mobile.png`, `/tmp/brse-s18-dashboard-desktop.png`, outside checkout), using authored sample objective/timezone Asia/Ho_Chi_Minh. `git diff --check` PASS. Source/shared/public/resources/dist privacy scan found no private handoff marker/DriveURL; no source/screenshot/media bundled.

**S18 final PASS:** full final-source browser54/54, zero skipped (`/tmp/brse-s18-e2e-final.log`), all51previous cases passing. Final typecheck/production build passed as preview prerequisite. Combined204frontend unit/integration +54browser; not a fresh backend suite. No source changes after verification. Java build/tests and actual live-provider/device/hosted results remain NOT_RUN as above.

## S19 — Guest profile/CV text/claims (2026-10-22)

PASS `npm test`214/214frontend unit/integration across27files (10new profile cases): optional empty/defaults, basics without inferred records, current exact quote requirement/unconfirmed save, explicit confirm/claim edit invalidation, changed source stales CV claims while manual confirmation remains, same text preservation/unconfirm, manual project edit/bounds/no auto-claims, duplicate IDs/forged current evidence/version/time rejection, UTF8/file/content bounds and rejected write preserving previous state, stale-source roundtrip/reset. Initial typecheck found inferred crypto.randomUUID template type on optional existing ID parameter; annotated validated ID input as string, no validation or assertions weakened. Final typecheck/production build PASS (`/tmp/brse-s19-build-verified.log`), repeated as browser prerequisite.

PASS targeted browser3/3 (`/tmp/brse-s19-targeted.log`): basics/TXT draft/exact quote error/explicit confirm/source stale/rebind/project CRUD/backup/reload/no dashboard disclosure; manual claim XSS safety/edit invalidation/PDF rejection/simulated quota preserving persisted profile/mobile overflow; corrupt profile read blocks writes/preserves raw sentinel, validated recovery and offline save. Full regression final result follows. Java tests/build NOT_RUN (backend unchanged, actual Spring server starts for browser acceptance but does not constitute fresh33test suite). LiveAI/Jisho/physicalJapanesevoice/crossbrowser/multitab/hosteddeployment NOT_RUN. No CV truth verification or PDF/AI extraction claim.

Visual verification: desktop1440 and mobile360 claim editor/current-confirmation card inspected; document overflow=false (`/tmp/brse-s19-claims-desktop.png`, `/tmp/brse-s19-claims-mobile.png`, outside checkout). Authored synthetic CV/claim only, timezone Asia/Ho_Chi_Minh. `git diff --check` PASS; source/shared/public/resources/dist scan found no private handoff marker/DriveURL; no private source or screenshots bundled.

Initial full browser57 run caught a genuine navigation regression: adding Profile increased fixed sidebar content beyond short desktop viewport. Three existing dashboard/exam flows timed out clicking lower navigation outside reachable viewport (54passed/3failed). Fixed global sidebar overflow-y:auto and non-shrinking flex children, preserving mobile natural layout; no forced clicks or timeout increases. Added a fourth Profile browser case at1280x600 covering lower data navigation→Profile→home. Direct dev-browser check confirmed sidebar content1070px/viewport600px with scrollTop470 and successful normal clicks (`/tmp/brse-s19-short-desktop.png`, outside checkout). Final full rerun includes58cases.

**S19 final PASS:** full final-source58/58browser, zero skipped (`/tmp/brse-s19-e2e-verified.log`), all54previous cases and4Profile/shell cases passing. The3initial navigation failures now PASS with scrollable sidebar, including explicit1280x600 navigation case. Final typecheck/production build passed as preview prerequisite. Combined214frontend unit/integration +58browser; backend Java tests/build NOT_RUN (unchanged). Mobile/desktop/private-source scan checks PASS; no new live AI/device/hosted deployment or CV fact-verification claim.


## Vercel deployment diagnosis — 2026-10-22

Commit a1e4f8c chỉ có README.md; ứng dụng vẫn chưa được Git theo dõi trong workspace. Vercel clone commit đó nên không có output để phục vụ. Đã thêm vercel.json (Vite/npm ci/npm run build/dist) và docs/VERCEL_DEPLOYMENT.md. Chưa commit/push hoặc deploy remote.

PASS: npm run build (bao gồm vue-tsc và Vite production build), git diff --check. NOT_RUN: unit/browser/backend tests đợt cấu hình này, Vercel remote và production API. Baseline S19: 214 frontend +58 browser tests PASS từ đợt trước, không phải chạy lại. Tiến độ không đổi: 14/17 có một phần, 3/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng.
