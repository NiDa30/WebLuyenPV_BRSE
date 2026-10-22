# S19 — Hồ sơ guest, CV text và claims tự xác nhận

## Luồng chạy được

Sidebar Hồ sơ & CV (tùy chọn) → tên gợi nhớ/vai trò hướng tới/tiếng Nhật tự mô tả → paste/nạp TXT thành nháp → lưu CV text → tự nhập dự án hoặc claim → chọn MANUAL hoặc quote chính xác từ CV đã lưu → lưu claim chưa xác nhận → người học xác nhận riêng → sửa claim/đổi CV làm mất current confirmation → rà soát/rebind và xác nhận lại → backup/khôi phục/xóa riêng.

Không đăng ký, email/password hoặc đồng bộ tài khoản. Không bắt buộc hồ sơ để dùng Exam/Interview/Demo. Không AI trích xuất, không tự suy kinh nghiệm/độ giỏi từ CV/JLPT. Không gửi dữ liệu hồ sơ vào backend, provider hoặc prompt Interview. Không tự fetch file/URL hay video; chưa parse PDF/DOCX. Handoff là yêu cầu/đặc tả, không phải dữ liệu hồ sơ mẫu.

## Các khái niệm tách biệt

- Basics: alias tùy chọn<=120, target có enum, Japanese self-report<=300. Không là định danh xác thực, cấp độ kiểm định hay score.
- Projects: max10, UUID/title1..120, role/stack<=300, context/result<=2000 mỗi field; CRUD tự khai, không sinh claim hay tự xác nhận project.
- CV text: <=30000ký tự, sourceVersion tăng khi text thay đổi; lưu lại cùng text không làm stale. File TXT<=100KB, UTF8 hợp lệ, không NUL; reject PDF/DOCX dưới MIME/extension nhận vào. Nạp file chỉ thay nháp sau confirm, chưa lưu hay tạo claims.
- Claims: max30, EXPERIENCE/SKILL/RESULT, text1..1000, version, source, sourceVersion/quote, updatedAt/confirmedAt nullable. MANUAL không có quote/sourceVersion. CV_TEXT phải có quote1..1000 và exact substring trong CV current version khi lưu/rebind.

Lưu mới không tự xác nhận. Confirm có thao tác riêng, chỉ là người học tự khai, không chứng thực sự thật/semantic entailment/việc làm/bằng cấp. Quote nhỏ không chứng minh claim lớn là đúng; UI ghi rõ giới hạn đó.

Sửa nội dung/kind/source/quote/rebind version tăng claim.version và clear confirmedAt; cùng input/nguồn không thay confirmation. Đổi CV tăng sourceVersion, clear confirmation của các claim CV; claim MANUAL được giữ vì không phụ thuộc text. Claim CV cũ giữ quote/version dưới trạng thái STALE_SOURCE ngay cả khi câu chữ vẫn xuất hiện trong CV mới. Không confirm stale; cần lưu lại claim sau rà soát nguồn, rồi tự confirm. Bỏ xác nhận hoặc xóa claim tách khỏi sửa CV.

Không lưu lịch sử full CV text cũ, chỉ quote/version của claim; không xác minh snapshot lịch sử đã thay đổi. Import dữ liệu tự khai có confirmation không làm nó trở thành chứng thực độc lập. Nếu backup chứa claim CV old-version, trạng thái stale thắng cờ confirmation. Profiles không được tự dùng cho adaptive AI trong increment này.

## Storage và privacy

`brse-profile` IndexedDBv1/store`state`/key`current`, atomic one-record write. Format `BRSE_PROFILE_BACKUP` schemaVersion1, strict known fields/UUID uniqueness/current quote consistency/source-version bounds/time/status, UTF8 JSON<=1MB. Lỗi validation trước write, UI thay state sau write thành công. Lỗi đọc khóa ghi thông thường/export/reset, có recovery bằng validated import. Dữ liệu hỏng không tự ghi đè thành hồ sơ trống.

Export chứa CV và thông tin riêng tư, chưa mã hóa; giữ private. Không mẫu public, không copy ZIP/private feedback vào code/bundle. Export chỉ gồm bản đã lưu; draft cần save. Đổi trang có thể bỏ nháp. Import thay cả basics/CV/projects/claims sau confirm; xóa riêng hồ sơ không ảnh hưởng Interview/Exam/Demo/Vocabulary/goals. Dashboard chưa đọc hoặc hiển thị hồ sơ, không egress HTTP. Không cloud/cross-tab sync, encryption-at-rest hay role-based access.

## Còn thiếu

PDF/DOCX parser, AI extraction có consent/review, profile→question context với claims được xác nhận, đối chiếu JD, CV revision đầy đủ và kiểm định nội dung vẫn chưa làm. M01 chỉ hoàn tất increment local đầu tiên, chưa hoàn tất vision. Các track Interview/BrSE/JLPT/BJT giữ nguyên chính sách self-report, consent và standardized scoring.

## Navigation regression fixed during acceptance

Adding a new module revealed fixed-sidebar overflow on short desktops. Sidebar now scrolls vertically and keeps children at natural height, making lower data tools and upper navigation reachable without forcing clicks. New acceptance case exercises1280x600; mobile remains natural full-width layout with no horizontal overflow. This change affects shell navigation, not profile data/privacy policy.
