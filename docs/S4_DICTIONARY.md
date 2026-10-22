# S4A — Dictionary adapters & local vocabulary increment

## Delivered boundary

- A short-phrase dictionary in the Japanese workspace and inside Interview feedback, preserving the active attempt/version/rubric.
- Nine first-party authored Business Japanese entries in `shared/business-japanese.json`: 担当, 要件, 仕様, 進捗, 確認, 影響, 不具合, 代案, 議事録. Meanings, Japanese examples and register notes are authored app content, not purported API results. This same resource is bundled by Vite and the Java app.
- Spring `DictionaryProvider` interface with `JishoWordProvider`, normalized JSON-only mapping and `AuthoredDictionary` fallback. This is Jisho word search, not scraping. Production endpoint is fixed `https://jisho.org/api/v1/search/words`; browser/provider-supplied URLs cannot alter the outbound host.
- Native offline authored lookup works without backend/consent. Online use needs an explicit browser checkbox and operator-enabled backend flag. Each request contains only `q`, never the parent transcript/CV, notes, scores or tokens.
- Guest notebook: bookmark a learner-entered query, author-content reference (if applicable), personal notes/tags; edit/remove/filter. Simple reveal/next flashcards, not SRS or automatic mastery. Jisho references have no copied definitions on the back; learners use their own notes or revisit the source.
- Separate IndexedDB store and exam/interview-independent backup/import/delete. Strict schema, atomic validated replacement, max 500 bookmarks/5 MB. No third-party definitions, audio/images/subtitles, interview transcripts or AI tokens in the vocabulary schema.

## Availability / rights

`BRSE_JISHO_ENABLED` defaults **false**. The operator must review current access/usage terms and authorize live dictionary display before enabling. A public JSON endpoint is not a guarantee of redistribution rights or uptime. Code/package licensing is not treated as a content license.

This increment does not display/cache external media, scrape kanji/examples, or persist the external Jisho response. Enabled lookup displays bounded word/readings/gloss strings in transient component memory only, labeled JISHO_JSON/EXTERNAL_LOOKUP_NO_CACHE. It does not claim that English glosses establish suitable Business Japanese register. Example sentences shown under AUTHOR_CREATED are separately authored first-party content.

Default offline lookup and fallback do not make external requests. Even with client consent, the backend default disabled flag returns PROVIDER_DISABLED and first-party matches without calling Jisho. No Jisho API credential is required. `jisho.org` must be permitted by the environment network settings for enabled lookup. Initial read-only probe for the nonprivate word 担当 failed with proxy CONNECT 403; live JSON response/terms were not verified in this task. This is not a successful live provider test.

## API

`GET /api/v1/dictionary/words?q=<short phrase>`

- Exact single q parameter only; reject unknown context fields and duplicate q.
- NFC normalization/trim; 1–50 Unicode code points. Reject control/format/surrogate/newline characters, never silently truncate. Frontend/backend rules match.
- Result: `{query,state,entries,capabilities:{kanjiScraping:false,sentenceScraping:false,externalMedia:false}}`.
- Distinct states: RESULTS, NO_RESULTS, PROVIDER_DISABLED, PROVIDER_UNAVAILABLE, SCHEMA_MISMATCH, RATE_LIMITED. Browser AUTHORED_ONLY is local, not a claimed upstream result. Provider failures fall back to first-party matching entries, possibly an explicitly empty list.
- Entry: `{id,term,reading|null,senses[],source,sourceUrl|null,businessExample|null,usageNote|null,rights}`. External entries cannot provide app examples/usage notes/media. Source links are server-constructed HTTPS Jisho search references, not upstream URLs.
- Limits: 20 outgoing lookups/peer/minute, 4 concurrent lookups, 10,000 hashed-IP buckets, 5s connection/12s whole response timeout, 128 KiB streaming response bound, max 10 returned entries / 5 glosses each. No redirects or automatic retries. API responses are no-store; no raw query/response application logging.
- Provider 429/schema/network failures become typed fallback results. Invalid input is 400, not silently retried. Client cancels/ignores stale requests and independently validates source/shape/query before display.

## Interview lookup privacy and scoring

The learner explicitly selects a 1–50-code-point phrase inside the exact displayed transcript. Selecting the entire answer is rejected. Opening a dictionary does not automatically send any selection upstream; online consent and explicit search remain separate actions. Manual query is possible with the same bounds. Learners should avoid putting names/private information in a dictionary query.

The drawer shows transcript/rubric context. Dictionary and vocabulary code never mutate interview attempts, self-ratings or AI feedback. Viewing a phrase or flipping a card cannot increase the interview score. Close lookup and continue existing guided/independent retry. Editing transcript closes old lookup context.

## Stored bookmark / portability

```ts
{
 id: UUID;
 term: string; // normalized learner query, not copied provider gloss
 source: 'AUTHOR_CREATED'|'JISHO_REFERENCE';
 authoredId: string|null; // first-party reference only, never external media ID
 note: string; tags: string[]; // learner-authored
 createdAt: number; updatedAt: number;
}
```

Export envelope is `{format:'BRSE_VOCABULARY_BACKUP',schemaVersion:1,bookmarks:[]}`. Duplicates/unknown fields/raw definitions/media/corrupt/version/size violations are rejected before replacing data. JSON is unencrypted and may contain personal notes, so keep it private. Exam and Interview backups remain separate. Local multi-tab conflict resolution/sync and SRS scheduling are not implemented.

## Remaining work

- Verify actual Jisho response/terms and enable/run consented live lookup; current validation is fixtures + real disabled backend.
- Kanji/examples scraping remains OFF, not a prerequisite for core use.
- Immersion Kit metadata adapter, verified schema/terms, right-gated display and authored fallback are a separate next increment. No Immersion Kit integration is claimed here.
- Add richer authored corpus, SRS scheduling and error-linked vocabulary queue after the current basic notebook/cards.
