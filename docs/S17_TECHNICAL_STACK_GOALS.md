# S17 — Stack/scope filters và mục tiêu tự luyện

## Luồng chạy được

Technical Drill → kết hợp chủ đề + stack + phạm vi + từ khóa → chọn một trong6 bài → luyện bằng Interview → quay lại Technical Drill → tự đặt mục tiêu cho một bài, số lượt1–20 → chủ động liên kết lượt đã gửi đúng bài → xem Initial/Guided/Independent riêng → tự ghi nhận khi đủ liên kết hiện hành → export/import mục tiêu riêng, đối chiếu lại với backup Interview.

Thêm3 bài: Vue3 request/response về sai thứ tự, Spring Boot transaction/side effects, PostgreSQL query plan/index. Giữ3bài S16 và ID/prompt cũ. Stack labels: General backend, SQL chung, Vue3, Spring Boot, PostgreSQL. Ứng dụng/Phân tích là phạm vi authored, chưa phải độ khó hiệu chuẩn/cấp độ người học. Không đọc CV/JD, không tự gán kinh nghiệm hoặc chấm đúng kỹ thuật, không chạy code/SQL.

Catalog hiện6technical +6câu gốc độc lập +6lượt scenario =18prompts. Core Question và backend chỉ nhận fields prompt/track/variant liên quan, metadata không thay rubric. Script3lượt cũ giữ nguyên. Filter là trạng thái màn hình tạm, không export; mục tiêu được lưu riêng.

## Mục tiêu và evidence boundary

Mục tiêu gắn questionId cụ thể, text tự khai1–500 ký tự, target1–20, createdAt/status/doneAt, tối đa20links duy nhất `{attemptId,version}`. Một OPEN mỗi bài, tổng50mục cả OPEN/DONE. Không tự liên kết hoặc tự hiểu nội dung mục tiêu bằng AI. Target đếm tổng các lượt người học chọn, không chỉ độc lập; số từng mode hiển thị riêng để tránh đánh đồng hỗ trợ với độc lập.

Chỉ liên kết attempt REVIEWED đúng question; version pin là transcript mới nhất lúc chọn. Liên kết lại cùng ID cập nhật pin, không tăng số lượt. Chưa gửi/đang edit, version thay đổi hoặc sai câu => stale, xóa/import thiếu nguồn => missing. Interview không đọc được => N/A, không giả0. Không lưu transcript/feedback trong goal backup. Số count là các nguồn hiện hành, không phải số câu trả lời đúng.

Đủ count mới mở nút tự ghi nhận; thao tác này không chứng nhận đạt kỹ năng/retention. DONE giữ nguyên nếu source đổi sau đó, có nhãn lịch sử khi không đủ nguồn hiện hành. DONE không tự mở lại, không sửa links sau hoàn tất; có thể tạo mục tiêu mới hoặc xóa lịch sử. OPEN có thể bỏ links; xóa mục tiêu không xóa Interview. Các lượt cũ trước ngày tạo goal có thể được người học chọn, không được kể là hoạt động mới vào ngày hiện tại.

## Persistence/backup/recovery

IndexedDB `brse-technical-goals`v1/store`state`/key`current`; `BRSE_TECHNICAL_GOALS_BACKUP` schemaVersion1, max200KB UTF8. Strict schema/known question IDs/UUIDs/positive versions, bounded text/counts, unique IDs/links, status/time consistency. Validate trước ghi; atomic one-record write; UI nhận state sau write thành công. Lỗi đọc khóa ghi thông thường, validated import cho recovery. Invalid file/write không thay dữ liệu đã lưu. JSON chưa mã hóa, không ghi nội dung bí mật.

Goal backup chứa mục tiêu và IDs/version; Interview backup chứa transcript/rubric/queue. Cần cả hai để chuyển đầy đủ sang trình duyệt khác. Import goal trước source hợp lệ và báo missing, không tự tạo transcript/score. Clear Interview không clear goals; clear goals không clear Interview. Sau restore Interview, trạng thái goal được tính lại từ các refs đã lưu. Không đồng bộ nhiều tab/cloud và không có API endpoint mới.

## Còn thiếu

Mục tiêu chưa lọc mode, không lên dashboard/chưa có reminder, không lịch thích ứng; chưa có CV/JD/system design hoặc rubric kỹ thuật được kiểm định. M10 vẫn có một phần. Không thay đổi live AI/voice/Jisho acceptance status.
