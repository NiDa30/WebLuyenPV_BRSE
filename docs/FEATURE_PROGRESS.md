# Tiến độ chức năng web — mốc theo dõi M01–M17

Đây là bảng tiến độ theo **17 nhóm trong handoff**, không phải khẳng định số tính năng cũ “109” là hợp đồng. Một nhóm “Có một phần” có code chạy nhưng còn chức năng quan trọng chưa làm. Không quy đổi số nhóm có code thành phần trăm hoàn thành toàn web.

| ID | Nhóm chức năng | Trạng thái | Đã có | Còn thiếu để hoàn thiện nhóm |
|---|---|---|---|---|
| M01 | Hồ sơ/CV | Có một phần | Hồ sơ tùy chọn local, CV text/TXT, dự án tự khai, claim quote/version/xác nhận riêng/stale guards, backup/reset riêng | PDF/DOCX/AI extraction có consent, context từ claims xác nhận, đối chiếu JD, kiểm định nội dung |
| M02 | Kho câu hỏi | Có một phần | 12 câu độc lập (gồm6technical) + 6 lượt CSV/production tự biên soạn, 2 track, tìm/lọc, intent/hints/follow-up tham khảo | Mở rộng nội dung có kiểm duyệt, bookmarks, tags/round/reading sâu |
| M03 | Mock Interview | Có một phần | Phiên 3 lượt + CSV/production xuyên suốt, text/voice đã review, lưu/tiếp tục và báo cáo từng lượt | Hỏi tiếp thích ứng, cấu hình quick/full/exam |
| M04 | Feedback & rubric | Có một phần; live AI chờ cấu hình | Rubric/version, evidence inspector, self-review; pin ngữ cảnh và cảnh báo lỗi thời; gateway AI quote/version | Gọi provider thật, kiểm định chất lượng chấm, gợi ý cá nhân hóa từ claims xác nhận |
| M05 | Retry | Có một phần | Guided/independent từng câu/toàn phiên, pin versions, đối chiếu chứng cứ; queue snapshot/filter/ưu tiên/retry/tự khai đã luyện | AI comparisons theo model/version, SRS/nhắc lịch, mastery được kiểm chứng |
| M06 | Nghe/nói | Có một phần (S3 browser-native) | TTS câu hỏi khi có giọng Nhật, ghi âm local, ASR trình duyệt có consent riêng, sửa/xác nhận transcript, text fallback | Kiểm thử giọng Nhật thật/thiết bị thực, ASR/TTS backend, shadowing, mô hình phát âm được kiểm định |
| M07 | Jisho | Có một phần; live chưa nghiệm thu | Words JSON backend adapter, source labels, short-phrase feedback lookup, fixtures, authored fallback | Xác minh terms/response live, bật cấu hình sau rà soát; kanji/examples scraping vẫn OFF |
| M08 | Immersion Kit | Chưa bắt đầu | Rights policy/thiết kế, media gates OFF | Metadata/context adapter + fallback, schema/terms verification; không tự mở quyền media |
| M09 | Vocabulary/ôn tập | Có một phần | Bookmark, ghi chú/tags, flashcard tự do; lịch ôn quy tắc/mức nhớ tự khai, due/history/reset, export/import | Kiểm định retention/lịch thích ứng, nối từ với feedback, nhắc lịch và coaching |
| M10 | Technical Interview sâu | Có một phần | Technical Drill:6bài, Vue/Spring/PostgreSQL, lọc stack/phạm vi, mục tiêu theo mode + liên kết version/backup riêng, dashboard/focus; dùng Interview evidence/retry | CV/JD, system design, follow-up thích ứng, mục tiêu thích ứng/nhắc lịch, rubric kiểm định; không tự chấm đúng kỹ thuật |
| M11 | Project Demo | Có một phần | Agenda/timer, nội dung +3 câu phản biện cố định, review quote/version, stale guards; Guided/Independent retry với baseline/đối chiếu text, portfolio references, kế hoạch theo ngày/retry liên kết, history/backup, dashboard/resume riêng | Phân tích repo/quyền sở hữu, phản biện thích ứng, feedback AI/voice và kiểm định so sánh |
| M12 | BrSE role-play | Có một phần | CSV + incident xuyên suốt, timeline/context versions, biên bản trích dẫn/owner/mốc/xuất TXT; báo cáo/retry toàn phiên | Đối thoại thích ứng, thêm hearing/design/progress/acceptance, kiểm định ngữ nghĩa biên bản |
| M13 | Video Library | Chưa bắt đầu | Không lấy/xuất bản video riêng tư | Rights/consent, quản lý tham chiếu, transcription được phép |
| M14 | Dashboard/báo cáo | Có một phần | Dashboard hợp nhất Exam/Interview/queue/SRS/Demo, resume đúng nguồn, bảng7/30 ngày/recent, kế hoạch Demo đến ngày, mục tiêu Technical và trạng thái N/A; báo cáo/so sánh riêng | Xu hướng được kiểm định, kế hoạch dài hạn, audit đầy đủ và độ ổn định |
| M15 | Interview Readiness | Có một phần | Checklist 10 mục tự kiểm tra, ghi chú, IndexedDB riêng, backup/khôi phục/reset | Theo loại phỏng vấn, lịch sử/liên kết phiên, kiểm tra thiết bị có consent và nghiệm thu thực tế; không chấm tính cách |
| M16 | Mentor/Admin | Chưa bắt đầu | Gateway đã có security nền tảng, chưa có mentor/admin UI | CMS/rubric reviewer, phân quyền quản trị riêng, vận hành/retention controls |
| M17 | Exam Time & Strategy | Có một phần; MVP local chạy được | Paper/PDF bên ngoài, timer/splits/pause/reload, nhập điểm, rules, history/compare, export/import | Cấu hình official VERIFIED, active pacing, challenge/targets/replay/adaptive drills; không quy đổi điểm thô |

**Tổng theo nhóm:** 14/17 nhóm đã có ít nhất một phần chức năng; 3/17 chưa bắt đầu triển khai thành phân hệ. **0/17 nhóm hoàn tất toàn bộ vision mở rộng** — không có nghĩa MVP local chưa dùng được. Nền tảng S0 và các luồng local S1/S2 đã có nghiệm thu riêng.

## Đợt trước — S3 Voice cơ bản

- Thêm Voice ngay trong màn hình trả lời của cả hai track và retries.
- TTS chỉ đọc câu hỏi tự biên soạn; lọc giọng Nhật, ưu tiên local; giọng dịch vụ ngoài cần đồng ý riêng.
- Ghi âm local cần consent + quyền microphone, audio chỉ trong RAM/blob URL; giới hạn 2 phút/10 MiB, xóa/revoke/stop khi rời màn hình.
- ASR native của trình duyệt cần consent riêng, có thể dùng dịch vụ ngoài; không giả định offline. Transcript cuối tách khỏi interim, editable, cần xác nhận trước khi thay thế/nối vào draft.
- Không tự submit/chấm. Lưu metadata voice đã review cùng text, không lưu audio. Manual edit sau khi áp dụng sẽ bỏ dấu “voice đã review” của draft. Feedback AI vẫn cần consent riêng, chỉ nhận text.
- Không chấm phát âm từ STT. ASR/TTS native có thể không được trình duyệt hỗ trợ; text fallback luôn khả dụng.

Kiểm thử đợt này: **PASS 73 unit/integration tests, 13 browser tests, typecheck/build**; chi tiết trong `ACCEPTANCE_TESTS.md`. ASR/TTS nhận dạng/giọng Nhật thật và microphone vật lý: **NOT_RUN**. Các ca ASR/TTS dùng fixtures; ghi âm MediaRecorder được kiểm tra bằng microphone giả lập của Chromium. Live AI vẫn NOT_RUN vì chưa có bằng chứng credential/runtime hoạt động; không coi draft settings đã lưu là inference thành công.

## Đợt trước — S4A Dictionary & Vocabulary

- M07 và M09 chuyển từ chưa bắt đầu sang có một phần; tổng từ 8 lên **10/17 nhóm có code**, còn **7/17 chưa bắt đầu**. Không coi đây là phần trăm hoàn thành web hoặc hoàn tất cả hai phân hệ.
- Lookup offline corpus 9 từ tự biên soạn; Jisho JSON adapter qua backend, default OFF; tra cụm trong feedback mà không thay đổi điểm.
- Notebook, notes/tags và flashcard basic; không lưu định nghĩa/media Jisho, không có SRS scheduling.
- Live Jisho probe bị proxy CONNECT 403; không tuyên bố live PASS. AI thật, giọng Nhật trên thiết bị vật lý và Immersion Kit vẫn chưa nghiệm thu/chưa triển khai.
- **PASS:** 84 unit/integration frontend, 30 backend, 17 browser tests và frontend/backend build. Các ca Jisho thành công dùng fixtures; tra Jisho live **chưa thành công** do proxy 403. Chi tiết: ACCEPTANCE_TESTS.md.

## Quy ước cho các đợt tiếp theo

Mỗi báo cáo: (1) tính năng mới, (2) trạng thái theo module, (3) kiểm thử PASS/FAIL/NOT_RUN, (4) giới hạn/blocker, (5) phần tiếp theo. Chỉ đổi trạng thái sau khi có code và bằng chứng kiểm thử phù hợp. Bảng này phải giữ M01–M17 ổn định; nếu đổi phạm vi, giải thích thay vì âm thầm tăng/giảm mẫu số.

## Đợt trước — S5 phiên nhiều lượt

- M03/M04/M05/M12 được mở rộng: phiên 3 lượt, báo cáo tự đánh giá có chứng cứ, Guided/Independent retry toàn phiên và so sánh từng lượt với baseline versions.
- Nâng IndexedDB không mất nháp cũ; backup/import gồm session metadata, nhận backup cũ.
- Tổng vẫn **10/17 có một phần, 7/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng**. Không tăng số nhóm chỉ vì mở rộng các nhóm hiện có.
- Hoàn thành increment local fixed-script; adaptive dialogue và AI tổng phiên chưa triển khai. PASS 90 unit/integration frontend, 18/18 browser regression (single worker), typecheck/production build; chi tiết và lần chạy lỗi trước đó tại ACCEPTANCE_TESTS.md.

## Đợt trước — S6 role-play CSV xuyên suốt

- M02/M03/M04/M05/M12 mở rộng: 3 prompt khách mới, timeline cùng phiên, context version và invalidation phụ thuộc; Guided/Independent retry giữ ngữ cảnh riêng.
- Hoàn tất increment kịch bản cố định; chưa tự hiểu intent hoặc tạo nhánh thích ứng. AI vẫn đánh giá từng lượt có consent, không chấm nhất quán hội thoại.
- Tổng **10/17 nhóm có một phần, 7/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng**. Không quy thành phần trăm hoàn thành.
- **PASS:** 98 frontend tests, 31 backend tests, 20 browser tests, typecheck/production build và backend package. **NOT_RUN:** AI/Jisho live, giọng Nhật thật, triển khai hosted. Chi tiết tại ACCEPTANCE_TESTS.md.

## Đợt trước — S7 biên bản và incident

- M02/M03/M12 mở rộng: thêm kịch bản production ba bước; biên bản cấu trúc có chứng cứ, mốc và phụ trách, tự khai xác nhận; xuất TXT sau rà soát.
- Source/version/context thay đổi chặn xuất bản đã rà soát cũ. Backup giữ biên bản; Guided/Independent retry không sao chép dữ liệu parent. Không thay rubric scores.
- Tổng vẫn **10/17 nhóm có một phần, 7/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng**. Hoàn thành increment local không đồng nghĩa hoàn thiện các nhóm lớn.
- **PASS:** 109 frontend tests, 32 backend tests, 23 browser tests, typecheck/production build và backend package. Thêm kiểm thử giữ khóa IndexedDB để xác minh Gửi khi autosave chờ; snapshot generation giữ nhãn lưu đúng. **NOT_RUN:** AI/Jisho live, giọng Nhật thật và triển khai hosted. Chi tiết tại ACCEPTANCE_TESTS.md.

## Đợt trước — S8 hàng đợi luyện lại

- M04/M05 mở rộng: chọn tiêu chí có chứng cứ, snapshot SELF_REVIEW/AI_MODEL riêng, dedup/filter/ưu tiên, retry và tự đánh dấu đã luyện.
- Scenario retry giữ cả phiên và thứ tự ngữ cảnh; stale-source blocks không thay quote cũ. IndexedDB3/backup queue giữ dữ liệu cũ.
- Tổng vẫn **10/17 nhóm có một phần, 7/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng**. Queue là increment local đã triển khai, chưa là SRS/mastery.
- **PASS:** 118 frontend tests, 26 browser tests, typecheck/production build. Backend không đổi; Java suite NOT_RUN đợt này (baseline trước32 PASS). AI/Jisho live, speech thật và hosted NOT_RUN. Chi tiết tại ACCEPTANCE_TESTS.md.

## Đợt trước — S9 ôn từ theo lịch

- M09 mở rộng: thẻ đến hạn, lật/tự chấm, interval preview, lịch sử và reset; phục hồi lịch từ event log, không gán mastery.
- Note đổi làm lịch stale; tags không đổi lịch. Tham chiếu ngoài cần ghi chú cá nhân, không cache định nghĩa/media. Legacy backup vẫn nhận.
- Tổng vẫn **10/17 nhóm có một phần, 7/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng**. Policy local đã chạy, hiệu quả ghi nhớ chưa được kiểm định.
- **PASS:** 127 frontend tests, 28 browser tests, typecheck/production build. Java suite NOT_RUN (backend không đổi, baseline32 PASS); hiệu quả retention, provider live, speech thật và hosted NOT_RUN. Chi tiết tại ACCEPTANCE_TESTS.md.

## Đợt hiện tại — S10 dashboard học tập

- M14 mở rộng: trạng thái riêng Exam/Interview/queue/vocabulary, việc làm tiếp, điều hướng ID hiện tại,7/30 ngày theo timezone và recent activity.
- Nhóm không đọc được là N/A, không giả0; guard chống ghi đè Exam khi read lỗi, init Interview deduplicated. Không cộng điểm hay tuyên bố readiness/mastery.
- Tổng **10/17 nhóm có một phần, 7/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng**. Dashboard local chạy được, chưa là báo cáo năng lực được kiểm định.
- **PASS:** 136 frontend tests, 31 browser tests, typecheck/production build. Backend không đổi; Java suite NOT_RUN đợt này (baseline32 PASS). Provider live, speech thật, hosted và kiểm định năng lực vẫn NOT_RUN. Chi tiết tại ACCEPTANCE_TESTS.md.

## S11 — Checklist chuẩn bị phỏng vấn

M15 chuyển sang **có một phần**: 10 mục tự kiểm tra, ghi chú, lưu riêng IndexedDB, export/import/reset. Không xin quyền thiết bị, không tự đo mạng/mic hay suy ra readiness/năng lực. Checklist hiện tại chưa có lịch sử hoặc liên kết phiên.

Tổng hiện tại **11/17 có một phần,6/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng**. PASS140 unit/integration, typecheck/build, kiểm tra mobile360px; kết quả hồi quy browser cuối ghi tại ACCEPTANCE_TESTS.md. Java/live providers/thiết bị vật lý NOT_RUN đợt này. Tiếp theo: Project Demo với agenda/timer và review có chứng cứ.

S11 nghiệm thu cuối: **PASS140 frontend tests +33 browser tests, typecheck/production build**. Bao gồm giả lập lỗi ghi IndexedDB/không xác nhận nhầm và thử lại. Desktop/mobile không tràn ngang. Chi tiết các lần chạy và giới hạn tại ACCEPTANCE_TESTS.md.

## S12 — Project Demo

M11 chuyển sang có một phần: agenda6 phần/10 phút, timer/splits/pause/reload, nội dung tự ghi sau luyện, self-review quote/version/hướng sửa, history và backup riêng. Không ghi âm, không tự lấy repo hoặc gửi nội dung đến AI. Chưa có phản biện thích ứng hay so sánh retry.

Tổng **12/17 có một phần,5/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng**. PASS150 frontend unit/integration và3 browser mới; hồi quy toàn bộ đang được ghi nhận tại ACCEPTANCE_TESTS.md. Java/live providers/thiết bị thực NOT_RUN đợt này. Tiếp theo: câu trả lời phản biện kỹ thuật có review bằng chứng và luyện lại trong Demo.

S12 nghiệm thu cuối: **PASS150 frontend tests +36 browser tests (33ca cũ +3ca Demo), typecheck/production build**; desktop/mobile không tràn ngang. M11 vẫn có một phần; tổng12/17 có một phần,5/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng.

## S13 — Phản biện và luyện lại Demo

M11 mở rộng:3 câu hỏi cố định, câu trả lời và review quote/version; lỗi thời khi sửa nguồn, review bị xóa khi sửa trả lời. Guided/Independent retry tạo bài mới trống, snapshot/parent link và đối chiếu text sau hoàn tất; nguồn đổi có cảnh báo. Backup cũ vẫn đọc được.

Tổng vẫn **12/17 có một phần,5/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng**. Chưa có AI phản biện thích ứng/voice, portfolio references hoặc đánh giá tiến bộ được kiểm định. PASS161 frontend tests +3browser mới, typecheck/build; kết quả hồi quy đầy đủ ghi tại ACCEPTANCE_TESTS.md. Java/live providers/thiết bị vật lý NOT_RUN đợt này. Tiếp theo: portfolio references và tích hợp Demo vào dashboard/resume.

S13 nghiệm thu cuối: **PASS161 frontend tests +39 browser tests (36ca cũ +3ca mới), typecheck/production build**. Mobile/desktop không tràn ngang. Tổng vẫn12/17 có một phần,5/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng; đây không phải phần trăm hoàn thành toàn web.

## S14 — Portfolio references & Demo dashboard

M11/M14 mở rộng:3 tham chiếu HTTPS local/canonical/validation, không tự fetch; kế thừa/snapshot link trong retry. Dashboard Demo có card, resume đúng ID, pending/stale QA, recent và số lượt tạo7/30 ngày; nguồn lỗi N/A, không ghi đè. Không cộng điểm hoặc giả ngày hoàn tất.

Tổng vẫn **12/17 có một phần,5/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng**. PASS168 frontend tests +3browser mới, typecheck/build; kết quả hồi quy đầy đủ tại ACCEPTANCE_TESTS.md. Java/live providers/thiết bị thực NOT_RUN đợt này. Tiếp theo: kế hoạch luyện và nối việc cần sửa của Demo với luồng luyện lại.

S14 nghiệm thu cuối: **PASS168 frontend tests +42 browser tests (39ca cũ +3ca mới),typecheck/production build**; mobile/desktop không tràn ngang. Tổng vẫn12/17 có một phần,5/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng; không quy thành phần trăm hoàn thành toàn web.

## S15 — Kế hoạch luyện Demo có chứng cứ

M11/M14 mở rộng: từ review hiện hành tạo kế hoạch theo ngày, giữ snapshot quote/hướng sửa, reschedule, liên kết một retry và tự ghi nhận đã luyện sau khi đủ nội dung/3 trả lời hiện hành. Nguồn đổi báo stale, giữ lịch sử DONE; xóa mục không xóa lượt. Chế độ độc lập ẩn hints cả trong bảng kế hoạch. Dashboard có OPEN/đến ngày/stale/DONE và điều hướng vùng kế hoạch.

Tổng vẫn **12/17 có một phần,5/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng**. Chưa có nhắc lịch nền, kế hoạch thích ứng hoặc đánh giá tiến bộ được kiểm định. PASS180 frontend tests +3browser mới,typecheck/build; hồi quy đầy đủ ghi tại ACCEPTANCE_TESTS.md. Java/live providers/thiết bị thực NOT_RUN đợt này. Tiếp theo: Technical Drill theo chủ đề tự biên soạn (API/SQL/security), không tự suy claims từ CV.

S15 nghiệm thu cuối: **PASS180 frontend tests +45 browser tests (42ca cũ +3ca mới),typecheck/production build**. Mobile/desktop không tràn ngang; dữ liệu lỗi không ghi đè; independent hints không render trước khi hoàn tất. Tổng vẫn12/17 có một phần,5/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng.

## S16 — Technical Drill đầu tiên

M10 chuyển sang **có một phần**:3 tình huống API/SQL/security, tìm/lọc và history riêng về mặt UI, điểm đối chiếu authored. Dùng Interview transcript/rubric/evidence/queue/retry/backup, không tạo DB trùng; draft Independent ẩn checklist. M02 hiện15prompts (9độc lập +6scenario); phiên3lượt cũ giữ nguyên.

Tổng **13/17 có một phần,4/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng**. Còn chưa bắt đầu: M01CV,M08Immersion,M13Video,M16Mentor/Admin. M10 chưa có rubric tính đúng kỹ thuật được kiểm định, code runner, CV/JD/system design hoặc follow-up thích ứng. PASS187frontend +33backend tests/frontend+backend build +3browser mới; kết quả hồi quy đầy đủ ở ACCEPTANCE_TESTS.md. AI live/Jisho/giọng Nhật thật vẫn NOT_RUN. Tiếp theo: mở rộng drill theo stack/mức độ và mục tiêu luyện tự khai, không tự suy kinh nghiệm từ CV.

S16 nghiệm thu cuối: **PASS187frontend +33backend +48browser tests,frontend/backend builds**; desktop/mobile không tràn ngang. Tổng13/17 có một phần,4/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng. AI fixture PASS không thay live AI/giọng Nhật thực tế NOT_RUN.

## S17 — Stack/scope và mục tiêu kỹ thuật tự khai

M10 mở rộng lên6bài, thêm Vue3/Spring Boot/PostgreSQL, filter kết hợp stack/phạm vi/chủ đề/từ khóa. Mục tiêu gắn một bài, số lượt1–20, chủ động link transcript version; Initial/Guided/Independent riêng, stale/missing/N/A rõ ràng, DONE tự khai giữ lịch sử. IndexedDB/backup mục tiêu riêng không chứa transcript. M02 hiện18prompts; scripts3lượt gốc không đổi.

Tổng vẫn **13/17 có một phần,4/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng**. Stack scope chưa là độ khó hiệu chuẩn; chưa có CV/JD/system design, AI kiểm định hoặc mục tiêu theo mode/dashboard. PASS197frontend +33backend,backend package +6targeted browser cases (3cũ mở rộng,3mới); full regression kết quả tại ACCEPTANCE_TESTS.md. LiveAI/Jisho/giọng Nhật thực NOT_RUN. Tiếp theo: mục tiêu theo mode và tích hợp mục tiêu vào dashboard.

S17 nghiệm thu cuối: **PASS197frontend +33backend +51browser tests,frontend/backend builds**. Mục tiêu backup riêng/nguồn thiếu/currentness và lỗi lưu đều được kiểm tra; desktop/mobile không tràn ngang. Tổng vẫn13/17có một phần,4/17chưa bắt đầu,0/17hoàn tất vision mở rộng — không quy thành phần trăm hoàn thành web.

## S18 — Mục tiêu kỹ thuật theo mode & dashboard

M10/M14 mở rộng: goal mode ANY/INITIAL/GUIDED/INDEPENDENT, backup cũ defaultANY, một OPEN mỗi bài/mode. Chỉ linked current attempts đúng mode tính target; wrong-mode import hiện excluded. Dashboard có summary riêng, N/A theo từng nguồn, không lộ objective/transcript; action mở exact goal ID/focus, deleted target báo rõ và đọc lỗi không ghi đè.

Tổng vẫn **13/17 có một phần,4/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng**. PASS204frontend +3browser mới,typecheck/production build; full regression tại ACCEPTANCE_TESTS.md. Backend không đổi,Java tests/build NOT_RUN đợt này (33test là baseline trước); liveAI/Jisho/physicalJapanesevoice/hosteddeployment NOT_RUN. Tiếp theo: hồ sơ/CV guest local với thông tin/claims do người học xác nhận, không suy diễn kinh nghiệm.

S18 nghiệm thu cuối: **PASS204frontend +54browser tests,typecheck/production build**; backend unchanged NOT_RUN đợt này. Exact goal focus/deleted target, legacy ANY, current matching modes, N/A/read-failure preservation và desktop/mobile đã kiểm tra. Tổng vẫn13/17có một phần,4/17chưa bắt đầu,0/17hoàn tất vision mở rộng.

## S19 — Hồ sơ guest/CV text/claims

M01 chuyển sang có một phần: basics tùy chọn, CV text/TXT không suy diễn, dự án tự khai, claim MANUAL/CV quote/version, explicit self-confirm/edit invalidation/source stale/rebind, IndexedDB và backup/reset riêng. Không tài khoản, không gửi AI/backend, không tự đưa hồ sơ vào Interview hay dashboard.

Tổng **14/17 có một phần,3/17 chưa bắt đầu,0/17 hoàn tất vision mở rộng**. Chưa bắt đầu M08Immersion,M13Video,M16Mentor/Admin. M01 chưa có PDF/DOCX/AI extraction hoặc JD comparison; xác nhận không là fact verification. PASS214frontend +3browser mới,typecheck/build; full regression tại ACCEPTANCE_TESTS.md. Backend unchanged Java tests/build NOT_RUN,liveAI/Jisho/physicalvoice/hosteddeployment NOT_RUN. Tiếp theo: dùng claims người học xác nhận làm ngữ cảnh luyện do họ chủ động chọn, có provenance và không tự gửi AI.

S19 nghiệm thu cuối: **PASS214frontend +58browser tests,typecheck/production build** (54ca cũ +4ca Profile/shell). Đã sửa sidebar cuộn cho desktop thấp, không tăng timeout/force click; mobile không tràn ngang. Tổng14/17có một phần,3/17chưa bắt đầu,0/17hoàn tất vision mở rộng. Backend unchanged NOT_RUN; xác nhận CV chỉ là tự khai.


## Vercel deployment diagnosis — 2026-10-22

Commit a1e4f8c chỉ có README.md; ứng dụng vẫn chưa được Git theo dõi trong workspace. Vercel clone commit đó nên không có output để phục vụ. Đã thêm vercel.json (Vite/npm ci/npm run build/dist) và docs/VERCEL_DEPLOYMENT.md. Chưa commit/push hoặc deploy remote.

PASS: npm run build (bao gồm vue-tsc và Vite production build), git diff --check. NOT_RUN: unit/browser/backend tests đợt cấu hình này, Vercel remote và production API. Baseline S19: 214 frontend +58 browser tests PASS từ đợt trước, không phải chạy lại. Tiến độ không đổi: 14/17 có một phần, 3/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng.


## Publish source để Vercel build

Người dùng đã yêu cầu commit/push source lên GitHub main. Đã kiểm tra danh sách 173 file staged, loại trừ generated artifacts/private ZIP/.env và quét mẫu private keys/provider/GitHub tokens/Drive URLs: PASS (không phải chứng nhận không có mọi loại bí mật). Build frontend PASS ở bước cấu hình Vercel ngay trước đó; không chạy lại tests trong bước publish. Tiến độ vẫn 14/17 có một phần, 3/17 chưa bắt đầu, 0/17 hoàn tất vision mở rộng. Vercel remote/production API NOT_RUN; kết quả push được báo ở phản hồi thao tác.
