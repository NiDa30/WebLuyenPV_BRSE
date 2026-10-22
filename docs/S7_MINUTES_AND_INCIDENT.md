# S7 — Biên bản có chứng cứ và role-play production

## Luồng sử dụng

Phỏng vấn & Retry → Track B → chọn CSV hoặc production → hoàn tất từng lượt → Báo cáo phiên → Biên bản chốt trao đổi.

Production có ba bước: tiếp nhận ảnh hưởng lúc10:00 → báo cáo timeout của ba tài khoản, điều đã biết/chưa biết → thống nhất báo cáo10:30. Đây là dữ kiện mô phỏng;10:30 là mốc cập nhật, không là cam kết phục hồi. Chưa biết nguyên nhân gốc, nguy cơ ghi trùng hoặc ETA; không tự coi timeout là mất dữ liệu. Không thao tác hệ thống production thật.

Cả hai kịch bản có brief, thông tin nhóm giả lập, timeline, version context, invalidation và Guided/Independent Retry như S6. Phản hồi khách vẫn cố định, chưa thích ứng theo intent của người học.

## Biên bản tự luyện

- Tối đa 12 mục: phạm vi, quyết định, hành động, câu hỏi còn mở.
- Mỗi mục chứa nội dung, phụ trách, mốc phản hồi, mức xác nhận tự khai và một trích dẫn chính xác từ lời khách hoặc câu trả lời của người học.
- Hành động cần điền phụ trách và mốc; có thể ghi rõ chưa xác nhận. Không tự phân công hay đặt lịch thật.
- Chứng cứ ghim attempt/version/source/UTF-16 offsets. Nguồn khách là prompt theo mode trong phiên, không là xác nhận của khách thật; cả hai loại nguồn cần version transcript đã gửi để gắn với lượt cụ thể.
- Form đang gõ chưa tự lưu; chọn Lưu mục để lưu IndexedDB. Sửa/thêm/xóa mục đưa biên bản về DRAFT; không thay điểm/transcript.
- Đánh dấu đã rà soát cần ít nhất một mục, đủ cả ba lượt hiện hành và mọi chứng cứ đúng version. Đây là thao tác người học, không là mentor/AI xác minh.
- Nguồn thay đổi hoặc ngữ cảnh hội thoại lỗi thời làm bản đã rà soát không thể xuất. Chỉnh chứng cứ theo nguồn mới, lưu rồi rà soát lại; không tự chuyển đoạn trích sang version mới dù câu chữ giống nhau.
- Export TXT chỉ cho biên bản đã rà soát, hiện hành. TXT có nhãn tự luyện và xác nhận tự khai, trích dẫn/offset/version; không có HTML thực thi. Không tự gửi email/tin nhắn/provider.
- Backup Interview gồm biên bản đã lưu; import giữ nguyên trạng thái stale để tiếp tục rà soát. Retry không sao chép biên bản hoặc đáp án của parent.

Trích dẫn đúng chỉ kiểm tra liên kết dữ liệu; không chứng minh người học diễn giải, chốt scope hoặc phân loại xác nhận đúng về ngữ nghĩa. Biên bản không tự tăng điểm hoặc readiness/mastery.

## Kỹ thuật và phạm vi

`src/domain/scenarios.ts` quản lý IDs/catalog cho CSV và production; script S5 mặc định vẫn dùng đúng ba câu cũ mỗi track. Kho độc lập vẫn sáu câu; tổng catalog frontend/backend có thêm sáu lượt scenario.

`src/domain/minutes.ts` chứa schema, kiểm tra tham chiếu, trạng thái nguồn và export TXT. `InterviewSession.minutes?` nằm trong object store sessions hiện có. Không tăng IndexedDB version2 hay backup schemaVersion1: thêm trường optional; input cũ không có minutes vẫn hợp lệ. Bản app cũ có strict schema có thể từ chối dữ liệu/backup mới. Không dùng app cũ để ghi database này.

Store kiểm tra aggregate trước khi thay state/lưu; import/ghi queued vẫn transactionally thay attempts/sessions cùng nhau. Bounds giữ nguyên 100 phiên/300 attempts/5 MB backup. Không thêm endpoint: AI per-turn request vẫn không gửi minutes hoặc timeline. Provider keys/media giữ nguyên policy; guest không đăng ký/đăng nhập.

Chưa có biên bản sinh bằng AI, semantic validation, revision history riêng cho biên bản, đồng bộ nhiều tab, nhánh hội thoại thích ứng, lịch/email/task bên ngoài, xuất DOCX/PDF hoặc công cụ xử lý incident thật.
