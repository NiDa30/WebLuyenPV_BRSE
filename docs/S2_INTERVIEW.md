# S2 — local text Interview, Evidence Self-review & Retry

Implemented next slice after S1, keeping Exam source/data intact. The chosen boundary is a complete offline one-question practice cycle, not a fake AI provider. Navigate to **Phỏng vấn & Retry**.

## Delivered

1. Two tracks with distinct versioned rubric criteria and six first-party authored questions. Search/filter; intent, optional initial hints and authored follow-up reference.
2. Persistent text drafts, submit, exact transcript with composition timestamps and revision history. Text-only audio/grammar/personality assessment remains N/A.
3. Criterion-linked annotations with quoted excerpt, UTF-16 positions, utterance/version reference and full answer interval. Local length observation is direct evidence; rubric review prompts are explicitly uncertain, not semantic grading.
4. Learner 0–3 rating per criterion, exact evidence quote and required explanation. Weighted self-score requires all criteria and is clearly distinguished from AI/mentor assessment. No score is granted merely for viewing feedback.
5. New guided/independent attempts preserve originals. Independent uses authored paraphrase and hides hints/prior answer/intent during composition. Guided cannot be used to claim independent mastery. Retry root/parent versions are pinned.
6. Version/condition-aware criterion/evidence comparison, transcript edit invalidation, local history, separate validated Interview backup/import/delete.
7. Safe literal rendering; no third-party network requests or media. Exam backups remain exam-only. UI warns that Interview JSON contains private answers and is unencrypted.

## Current limitations

- Optional AI gateway is now implemented (see backend/README.md); no live inference has been validated because provider credentials are missing. Local feedback remains rules/self-review. No adaptive multi-turn conversation; follow-ups are authored references or model-generated grounded suggestions, not a new dialogue turn.
- No candidate CV facts, extraction or fabricated personalized answers. Only the learner's submitted text exists.
- A single prompt/answer per attempt; no speech/video. Timestamp is time since opening the question, including interruptions/editing time, not actual speaking speed. Device clock changes can affect composition timing; no timing-derived scoring.
- Independent mode is voluntary practice, not monitoring; users can intentionally navigate to earlier material. Do not interpret its score as independently verified mastery.
- One editing tab recommended. No cross-device sync, server auth or multi-tab conflict resolution. Draft autosave is debounced 350ms; explicit submit flushes persisted state, and navigating out of the module flushes the draft. A crash during the debounce window can lose the most recent typing.
- Existing version-1 schemas reject unknown future rubric versions rather than silently migrate ratings. Limits: 300 attempts, 30 transcript revisions, 10,000 text characters per answer; JSON import max 5 MB. Large histories may require a future chunked archive format.

## Next implementation boundary

Java/Spring Boot capability service, opt-in transmission, limits, evidence validation, ephemeral retention and separate model/source identifiers are implemented in S2B. Next, configure a real provider securely and validate inference/grading, then add multi-turn adaptive dialogue. Preserve this local flow as fallback. After text AI: consented TTS/ASR with transcript correction, then provider adapters/rights gates. No learner signup/login.
