# Interview AI gateway — Java 21 / Spring Boot

The guest learner has no account. This API issues ephemeral bearer capabilities for a consented text assessment. It does not persist transcripts or results to a database; the browser stores validated results in IndexedDB. PostgreSQL is not needed yet.

## Run and test

From the repository root:

```sh
npm run test:api
npm run api:dev
# Separate terminal:
npm run dev
```

Java 21, curl, Python 3, SHA-512 tooling and tar are required by the cloud bootstrap script. `scripts/maven.sh` downloads pinned Apache Maven 3.9.11 from Maven Central and checks its pinned SHA-512 before extraction. Maven dependencies are cached outside the checkout in `/workspace/.brse-m2`; tools in `/workspace/.brse-tools`. Override these with `BRSE_MAVEN_REPO` and `BRSE_TOOLS_DIR` on other machines. HTTPS_PROXY is adapted to Maven and the Java HTTP client without printing/copying credentials or weakening TLS. Proxy URLs requiring embedded authentication are not currently supported.

This cloud image has Java 21 compiler modules but lacks `ct.sym` and the `javac` launcher. The script detects that case, verifies compiler version 21, and uses source/target 21 against actual runtime modules. A full JDK uses the normal Maven `--release 21` setting. No Java version downgrade or verification bypass.

API defaults to loopback port 8080. Vite dev/preview proxies `/api` to it. Production should serve frontend/API through a same-origin reverse proxy. `BRSE_ALLOWED_ORIGIN` is an optional exact trusted frontend origin when an HTTPS terminator causes the backend scheme/Host to differ; never configure arbitrary origins. Request peer IP is used for limits, not untrusted forwarding headers; apply appropriate edge limits when deploying behind a shared proxy. Public deployment has not been validated here.

For a packaged executable (tests execute as part of package):

```sh
npm run build:api
java -jar backend/target/trainer-api-0.1.0.jar
```

## Provider configuration

Default is **disabled**. `GET /api/v1/system/provider-capabilities` reports NOT_CONFIGURED, and session creation returns 503 instead of fabricated AI feedback. Local rules, self-review and retries work independently.

To enable the implemented OpenAI chat-completions adapter, set secure **backend process** configuration:

- `BRSE_AI_ENABLED=true`
- `BRSE_AI_MODEL` to a model that supports JSON-object chat completions (example: `gpt-4.1-mini`). Model choice/cost is yours; the example has not been live-tested here.
- `BRSE_AI_KEY` through secret/environment settings, never chat or source files. Destination `api.openai.com`; endpoint is fixed server-side, no client-supplied provider URLs.

`.env.example` contains non-secret placeholders only and is not automatically loaded. Never prefix the key with VITE_. The browser never receives it. No external AI call is made merely by opening the panel: explicit per-attempt consent is required before creating a session/request. Consent is not restored automatically on reload.

## Implemented API

- `GET /api/v1/system/provider-capabilities`: configured availability/model, 900-second capability TTL, external-media gates false. “AVAILABLE” means configured, not live-provider health verified.
- `POST /api/v1/ai/interviews`: `{track,rubricVersion,consent:true}` → 201 `{id,capabilityToken,expiresAt}`.
- `POST /api/v1/ai/interviews/{id}/feedback`: Bearer capability + `{questionId,mode,utteranceId,transcriptVersion,text,endMs}` → 200 normalized evidence-backed model assessment.
- `DELETE /api/v1/ai/interviews/{id}`: same capability → 204, revoked access. Wrong/expired capabilities use the same 404 response.

See `openapi.yaml` and `../docs/API_CONTRACTS.md`. Session creation is bounded to 10 per socket-peer/IP per 10 minutes, max 1,000 active sessions, max 10,000 IP buckets. Each capability permits five feedback requests and one in-flight request. Global concurrent upstream requests: four. Sessions expire after 15 minutes; expired metadata cleaned on access and every minute. Capability values are random 256-bit secrets; only salted SHA-256 digests held in the registry. No learner authentication UI.

Requests: 64 KiB bounded body before JSON parsing, strict DTOs, 10,000-character answers, known question/track/rubric. Provider: fixed HTTPS destination, TLS verification, no redirects, no automatic retries/duplicate charges, 10-second connect / 25-second whole response limit and 128 KiB streaming bound. Response errors are sanitized Problem Details; payloads, capabilities, keys and upstream error bodies are not logged by application code. All API responses use no-store.

## Feedback trust and retention

The server owns the authored question/rubric catalog. A drift test checks it against frontend registry. The model receives only the current prompt/rubric/answer, with candidate text encoded as user DATA. It does not receive CV, self-ratings, browser history or private handoff files. Request asks provider `store:false`; provider policy/retention still applies. Browser consent explains this distinction.

Each numeric score must have exact contiguous candidate quote(s); all rubric criteria must be present exactly once. Unknown criteria, malformed data, scores outside 0–3, absent/fabricated evidence or unsupported output fail closed. Server computes offsets and stamps utterance/version and whole-composition timestamps; it does not trust model timestamps. Null scores are N/A and need no invented evidence. Optional model follow-up must cite an actual answer quote.

Span/schema checks do not establish semantic truth, grading calibration or prompt-injection immunity. Model suggestions may be wrong. The UI labels model source/version, keeps self-ratings separate, validates evidence again, discards stale results and invalidates AI feedback when transcript changes. Independent mastery is not automatically inferred. Text composition time is not speaking time; no voice/personality scores.

Sessions keep only capability digest, track/rubric, expiry and counters, never transcripts/results. Request data exists in memory during evaluation; responses are retained locally only after validation. The client deletes its session after the request and does not put the token in Pinia, URLs, backups or IndexedDB. Cancelling the browser request stops waiting; it does not guarantee that an already-started external inference is cancelled or unbilled. There is no multi-turn server conversation, CV extraction or speech service yet.

## Verification scope

Backend tests exercise real Spring routing/filter/validation/capability state with a test provider, and the HTTP adapter against a loopback fixture server. Browser tests distinguish actual disabled backend from mocked AI success/failure. **Live OpenAI inference is NOT_RUN until a usable key/configuration is supplied.** No production deployment claim.


## Dictionary adapter (S4A)

`GET /api/v1/dictionary/words?q=` is an anonymous short-phrase read-only endpoint with rate/concurrency bounds and first-party authored fallback. Only one q parameter, 1–50 Unicode code points (NFC), is accepted; no transcript/CV/notes/context fields. Default `BRSE_JISHO_ENABLED=false` returns PROVIDER_DISABLED and authored matches without an external request. Enable only after access/terms review and allow `jisho.org` through networking. No secret is required for words JSON. Initial live network probe was denied by the environment proxy (CONNECT 403), not a successful provider validation.

The fixed production URI is `https://jisho.org/api/v1/search/words`. Jisho schema normalization discards media/unknown metadata; English glosses are display-only transient data. No response cache, scraping, images/audio or external definitions in notebook persistence. Time/byte bounds and safe fallback states are described in `../docs/S4_DICTIONARY.md`. First-party corpus is shared via `../shared/business-japanese.json` and packaged as a Java resource. Do not use upstream word results as proof of business register or content redistribution rights.
