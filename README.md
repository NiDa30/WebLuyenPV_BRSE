# BRSE Interview Trainer

Guest-first Vietnamese web app for Japanese IT/SE/BrSE learning. Working slices: **Exam Time & Strategy Trainer**, using your own paper/PDF outside the app, and **local text Interview → Evidence Self-review → Retry** for two tracks. No learner registration/login, cloud sync, frontend AI keys or third-party media. Optional server-side AI gateway is available; it is disabled until configured.

## Run

Node.js 22.12+ (tested Node 24.19), npm 11. From this checkout:

```sh
npm ci
npm run dev
```

Open the port through your development environment's port tools. `npm run dev` binds all interfaces on port 5173. Production build and local validation:

```sh
npm run build
npm run preview -- --port 4173
npm test
npm run typecheck
PLAYWRIGHT_BROWSERS_PATH=/tmp/brse-playwright npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/tmp/brse-playwright npm run test:e2e
```

If Chromium is already installed, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e` instead of downloading a browser. This is the browser used for local validation here (Chromium 154); the Playwright browser download domain was blocked.

In constrained cloud machines use `npm ci --cache /tmp/brse-npm-cache`. On a new Linux host Playwright may require its documented OS browser dependencies (`npx playwright install --with-deps chromium`). No backend or environment variables are needed for the offline slices. Browser acceptance tests now also start the Java API in disabled-AI mode; Java 21 is required for that suite. Ports above are internal validation ports, not deployment URLs.

## Try the complete slice

1. Guest Home → start a session → select JLPT, NAT-TEST or BJT and level.
2. Name your external book/PDF and optionally declare a comparable difficulty group. Adjust each section's name/minutes to match the material.
3. Read the **UNVERIFIED** warning and pause/audio policy. Only Strategy Practice is enabled.
4. Start timer; record named splits and optional planned checkpoints; pause/resume if needed. A refresh recovers running wall-time and logs uncertainty. Section expiry locks the current section; start the next explicitly. Remaining minutes never transfer.
5. Finish sections (confirmation for early ending), enter correct/answered/total and optional manually reported scores with type/source. Blank means unknown, not zero.
6. Save → evidence-based rules → history → compare attempts. Export JSON from “Dữ liệu của tôi”; import validates and explicitly replaces exam data after confirmation.


## Try text Interview (S2 local increment)

Choose **Phỏng vấn & Retry** → Track A (Japanese IT/SE/BrSE hiring) or Track B (customer role-play) → authored question → compose a Japanese answer. Drafts autosave locally. Submit to inspect the exact transcript and criterion-linked review prompts. Add self-ratings with exact quotes and explanatory notes; scores remain N/A until all criteria have evidence.

Choose Guided Retry for hints or Independent Retry for a paraphrased prompt without hints while writing. Each is a new attempt, preserving the original. Compare self-ratings and quoted evidence, with guided/changed-baseline restrictions. Editing a transcript invalidates its prior feedback/ratings. Interview history and backup/import/delete are in the Interview module, separate from Exam data.

**Local rules/self-review are not AI scoring.** They do not judge Japanese grammar, project truth or hiring ability. An optional AI panel now uses the Java gateway with explicit consent. AI result source/model/evidence is separate from self-ratings. Voice/video criteria are N/A. Timestamps describe text composition, not audio. No CV is sent; the current answer is sent only after consent. See [S2 scope and limitations](docs/S2_INTERVIEW.md).

## Optional Voice in Interview

In a draft answer, use the controls under **Nghe câu hỏi & trả lời bằng giọng nói**. TTS reads only the authored question if a Japanese browser voice exists; remote-service voices require separate consent. Local recording requires consent and microphone permission, stays in RAM for self-replay, and is deleted on leaving/reload. Optional browser Japanese ASR may use an external browser service and requires its own consent. Review/correct the transcript and acknowledge it before replacing/appending the draft; submission/AI consent remain separate actions.

Voice requires a supported secure origin/browser. Text always works. No audio is saved/uploaded/exported, no guaranteed offline ASR, no pronunciation scoring. Tests distinguish fixture ASR/TTS and synthetic microphone capture from real Japanese speech quality (NOT_RUN). See [Voice scope](docs/S3_VOICE.md).

## Japanese dictionary & notebook

Choose **Nhật ngữ & Sổ từ** to search the first-party Business Japanese corpus offline. Optional Jisho requests send only a short selected phrase through the Java adapter, after explicit checkbox consent. Backend flag `BRSE_JISHO_ENABLED` defaults false until access/terms review; live access is not yet verified. Word glosses are transient lookup data, never copied to notebook backup. No kanji/example scraping or external audio/images.

Save queries, add your own notes/tags, use reveal/next flashcards and export/import a separate vocabulary JSON backup. In Interview feedback, select a short phrase in the transcript and choose **Tra cụm đang chọn trong transcript**; it preserves the interview context and score. See [Dictionary scope and privacy](docs/S4_DICTIONARY.md).

## Optional AI API

```sh
npm run test:api
npm run api:dev
# In another terminal, npm run dev serves the frontend and proxies /api to port 8080.
```

The gateway defaults to disabled AI and reports its configured availability in the Interview AI panel. Set `BRSE_AI_KEY` securely **on the backend**, `BRSE_AI_MODEL`, and `BRSE_AI_ENABLED=true` to enable it; never use VITE_ for keys. No real-provider call has been validated yet. See [backend run/configuration/security](backend/README.md) and [OpenAPI](backend/openapi.yaml). `npm run build:api` executes backend tests and creates the runnable jar. The bootstrap script installs checksum-verified Maven and reuses Java 21; no PostgreSQL is required.

## Important limitations

- The initial times are **authored practice examples**, not verified current exam timings. Official Simulation is disabled for every template, including all JLPT/NAT levels and BJT. Source links are references, not verification claims. Names and times can be edited; no bank of licensed exam questions is bundled.
- PDF mode means using a local book/PDF beside the app. There is no PDF upload, viewer or audio player. Start the listening timer with your external audio; the app cannot synchronize or pause it.
- The offline shell is cached in the **production build**, after its initial online load and service-worker readiness, on HTTPS or a secure local development origin. Development server is not an offline deployment. A service worker requires the app to be hosted at the domain root for this version.
- Runtime uses monotonic time; reload uses wall time. Clock changes detected in an open tab are flagged. Clock changes while the app is closed cannot always be detected or repaired; recovery is not certified exam timing.
- Rule thresholds are versioned **pilot heuristics**, not calibrated diagnoses. Reported scores are self-entered. No raw-to-scaled JLPT/BJT conversion or official pass/fail claim.
- Data lives in this origin/browser's IndexedDB, capped at 500 attempts. Backups are plaintext exam-only JSON (max 5 MB). Clearing browser storage loses history. Keep backups private. Use one editing tab at a time; multi-tab synchronization is not implemented.
- Local Interview/evidence self-review/retry and the optional Spring Boot AI feedback gateway are implemented. Real AI inference is NOT_RUN until secure provider configuration is supplied. Browser-native basic Voice is implemented with explicit consent and text fallback; Jisho adapter with authored fallback and local notebook/flashcards are implemented. Backend ASR/TTS, multi-turn interviewing, CV extraction, Immersion Kit and SRS remain pending.

## Documentation

- [Feature-completion progress M01–M17](docs/FEATURE_PROGRESS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API contracts and future server boundary](docs/API_CONTRACTS.md)
- [Acceptance tests](docs/ACCEPTANCE_TESTS.md)
- [Implementation status and next tasks](docs/IMPLEMENTATION_STATUS.md)

The handoff archive and private raw feedback remain outside this checkout. No raw private source, Drive content or provider media is included in the frontend bundle or fixtures. Do not add those files to Git or public samples.

## Phiên Interview/BrSE 3 lượt (S5)

Phỏng vấn & Retry → chọn track → Bắt đầu phiên 3 lượt. Trả lời, tự đánh giá có chứng cứ từng lượt rồi trở về Báo cáo phiên để tiếp tục. Tab Phiên nhiều lượt lưu tiến độ sau reload. Hoàn tất ba lượt cho phép Guided/Independent Retry toàn phiên; tổng chỉ hiện khi có đủ chín đánh giá có chứng cứ, không phải điểm AI. Backup Interview bao gồm phiên và các lượt, vẫn nhận backup cũ. Kịch bản cố định, chưa hỏi tiếp thích ứng. Xem [thiết kế S5](docs/S5_MULTI_TURN.md) và [tiến độ M01–M17](docs/FEATURE_PROGRESS.md).

## Role-play BrSE xuyên suốt (S6)

Trong Kho câu hỏi chọn Track B → **Bắt đầu tình huống CSV**: làm rõ yêu cầu → báo cáo tác động/đề xuất → chốt thử nghiệm. Đọc brief và thông tin nhóm giả lập; timeline giữ các lượt của cùng cuộc trao đổi. Sửa lượt trước làm ngữ cảnh lượt sau cần rà soát, không tự cộng điểm cũ. Retry Guided/Independent toàn tình huống qua báo cáo phiên. Đây là kịch bản tự biên soạn cố định; AI nếu được bật chỉ chấm từng lượt sau consent, chưa đánh giá tính nhất quán toàn hội thoại. Xem [S6](docs/S6_BRSE_SCENARIO.md).

## Biên bản và production (S7)

Track B có thêm **Bắt đầu tình huống production**: tiếp nhận lỗi lưu đơn → cập nhật điều tra chưa rõ nguyên nhân → chốt mốc báo cáo. Sau các lượt, lập **Biên bản chốt trao đổi** từ phạm vi/quyết định/hành động/câu hỏi còn mở; mỗi mục trích dẫn đúng nguồn và version. Chọn Lưu mục, rà soát rồi xuất TXT tự luyện; sửa nguồn sẽ khóa xuất cho tới khi rà soát lại. Backup Interview giữ biên bản; retry bắt đầu trống. Đây là kịch bản giả lập và xác nhận tự khai, không vận hành hệ thống thật hay tự gửi khách. [Phạm vi và giới hạn S7](docs/S7_MINUTES_AND_INCIDENT.md).

## Hàng đợi luyện lại (S8)

Trong feedback, thêm tiêu chí đã tự đánh giá hoặc AI annotation vào **Hàng đợi luyện lại**. Lọc track/trạng thái, ghi việc muốn sửa, ưu tiên rồi mở Guided/Independent Retry. Role-play tạo lại toàn tình huống để giữ ngữ cảnh. Chỉ tự đánh dấu đã luyện sau khi hoàn tất retry; không suy ra mastery. Nguồn đổi version sẽ có cảnh báo và chặn tạo retry từ snapshot cũ. Queue được lưu local và đi cùng backup Interview. [Thiết kế và giới hạn S8](docs/S8_REVIEW_QUEUE.md).

## Ôn từ theo lịch (S9)

Nhật ngữ & Sổ từ → **Ôn theo lịch** → lật thẻ đến hạn → tự chấm Chưa nhớ/Khó/Nhớ/Dễ. App lưu lịch sử và hẹn lần tiếp theo bằng quy tắc local, phục hồi khi offline/reload. Đây là mức nhớ tự khai, không dự đoán retention/mastery. Tham chiếu Jisho cần ghi chú riêng; không lưu nghĩa/media provider. Đổi ghi chú làm lịch cần reset; tags giữ lịch. Backup sổ từ chứa lịch sử, reset có xác nhận và chỉ tác động từ được chọn. [Chi tiết S9](docs/S9_SCHEDULED_VOCABULARY.md).

## Dashboard học tập (S10)

Chọn **Dashboard học tập** để xem số liệu riêng Exam, Interview, hàng đợi và từ đến hạn. Mở đúng việc đang dở hoặc source data, xem bảng hoạt động7/30 ngày theo timezone trình duyệt và recent events. Đây là thống kê từ dữ liệu đang có, không gộp thành điểm năng lực; nhóm đọc lỗi hiện N/A và vẫn có đường khôi phục backup riêng. Dashboard không tự chấm/lưu lại aggregate/gửi analytics. [Phạm vi S10](docs/S10_LEARNING_DASHBOARD.md).

### S11 — Checklist phỏng vấn

Mở **Checklist phỏng vấn** trên sidebar: tự kiểm tra 10 mục thiết bị/kết nối/không gian/ứng xử, lưu ghi chú, backup JSON và chuẩn bị lại. IndexedDB riêng; không xin quyền mic/camera hay đo năng lực. Xem [phạm vi và giới hạn](docs/S11_READINESS.md).

### S12 — Project Demo

Mở **Project Demo**: agenda6 phần/10 phút, timer/splits/pause/resume, ghi nội dung sau luyện và tự review bằng trích dẫn theo3 tiêu chí. Lưu IndexedDB riêng, lịch sử và backup JSON; sửa nội dung xóa review lỗi thời. Không ghi âm hay gửi dự án lên AI. Xem [phạm vi và giới hạn](docs/S12_PROJECT_DEMO.md).

### S13 — Phản biện & luyện lại Demo

Sau khi lưu bài trình bày, trả lời3 câu phản biện và tự review bằng trích dẫn. Sửa bài đánh dấu trả lời cũ lỗi thời; sửa trả lời xóa review của câu đó. GUIDED/INDEPENDENT retry tạo lượt mới trống và giữ bản chụp nguồn để đối chiếu; chế độ độc lập ẩn bài cũ cho đến khi hoàn tất. Backup Demo cũ vẫn đọc được. Xem [phạm vi và giới hạn](docs/S13_DEMO_FOLLOWUPS_RETRY.md).

### S14 — Portfolio references & Demo dashboard

Lưu tối đa3 tham chiếu HTTPS/portfolio/repo cho mỗi lượt Demo; chỉ lưu metadata, không tự tải nội dung. Demo đã có card dashboard, resume đúng ID, recent/history và số lượt tạo theo ngày; dữ liệu lỗi hiển thị N/A. Backup Demo cũ vẫn đọc được. Xem [phạm vi/giới hạn](docs/S14_DEMO_REFERENCES_DASHBOARD.md).

### S15 — Kế hoạch luyện Demo

Từ review có chứng cứ, tạo mục kế hoạch theo ngày, mở nguồn và luyện lại với retry liên kết. Chỉ tự ghi nhận đã luyện sau khi nguồn/retry còn hiện hành và retry đủ nội dung +3 trả lời. Nguồn đổi được cảnh báo; backup gồm plans và đọc được file cũ. Dashboard có mục đến ngày. Không có push notification hoặc chấm tiến bộ. Xem [chi tiết](docs/S15_DEMO_PRACTICE_PLANS.md).

### S16 — Technical Drill

Mở **Technical Drill**:3 tình huống API retry, SQL pagination và object authorization, có tìm/lọc chủ đề và lịch sử. Tiếp tục bằng Interview để lưu nháp, self-review quote/version, queue và Guided/Independent retry. Điểm đối chiếu tự biên soạn bị ẩn trong draft độc lập. Chung backup Interview; không chạy code/SQL hoặc tự chấm tính đúng kỹ thuật. Xem [phạm vi/giới hạn](docs/S16_TECHNICAL_DRILLS.md).

### S17 — Stack/scope & mục tiêu kỹ thuật

Technical Drill có6bài, thêm Vue3/Spring Boot/PostgreSQL; kết hợp stack/phạm vi/chủ đề/từ khóa. Tạo mục tiêu tự khai, liên kết từng lượt đã gửi, xem Initial/Guided/Independent riêng và tự ghi nhận khi đủ nguồn hiện hành. Mục tiêu có IndexedDB/backup riêng; vẫn cần backup Interview để khôi phục transcripts. Nhãn phạm vi chưa là đánh giá độ khó/năng lực. Xem [chi tiết](docs/S17_TECHNICAL_STACK_GOALS.md).

### S18 — Mục tiêu theo mode & dashboard

Mục tiêu kỹ thuật chọn Tất cả/Initial/Guided/Independent; chỉ đếm lượt liên kết hiện hành đúng mode. Backup S17 thiếu mode tự hiểu là Tất cả. Dashboard có card mục tiêu, phân biệt N/A và0, mở đúng ID/focus hoặc báo nguồn đã mất. Không hiển thị nội dung mục tiêu trên dashboard. Xem [phạm vi và giới hạn](docs/S18_MODE_GOALS_DASHBOARD.md).

### S19 — Hồ sơ & CV guest local

Mở **Hồ sơ & CV** (tùy chọn): định hướng, CV text/TXT, dự án tự khai và claim có trích dẫn/version. Lưu claim chưa xác nhận; xác nhận riêng chỉ là tự khai. Sửa claim hoặc đổi nguồn CV làm mất trạng thái xác nhận hiện hành. IndexedDB/backup riêng, không gửi AI/backend và chưa parse PDF/DOCX. Xem [phạm vi/privacy/giới hạn](docs/S19_GUEST_PROFILE_CLAIMS.md).

## Deploy frontend to Vercel

See [Vercel deployment guide](docs/VERCEL_DEPLOYMENT.md). The repository root must contain the committed application source, not only README.md. `vercel.json` selects Vite, `npm ci`, `npm run build` and `dist`. Use Node 22.x (22.12+). Spring Boot needs separate hosting; local Vite API proxies do not configure production routing. No remote deployment has been verified.
