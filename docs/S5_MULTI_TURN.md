# S5 — Phiên nhiều lượt local

Trong Phỏng vấn & Retry, chọn track ở Kho câu hỏi → Bắt đầu phiên 3 lượt → trả lời và xem chứng cứ từng lượt → Báo cáo phiên → lượt tiếp theo → Guided/Independent Retry toàn phiên.

Kịch bản cố định AUTHOR_CREATED:
- JOB: vai trò dự án → motivation → UI/API/DB.
- BRSE: scope → lỗi production → làm rõ yêu cầu.

Đây là ba tình huống/câu hỏi cùng track, chưa phải đối thoại thích ứng hoặc một tình huống liên tục. Không tuyên bố follow-up phụ thuộc nội dung câu trước.

Timestamp tính từ lúc tạo phiên, bao gồm thời gian chờ các lượt trước; không là thời lượng nói hay alignment audio.

Mỗi lượt tái sử dụng transcript version, evidence inspector, rubric, self-review, voice và AI panel hiện có. Báo cáo không gọi AI; AI từng lượt vẫn cần consent riêng. Tổng phiên là trung bình đều ba điểm tự đánh giá, chỉ hiển thị khi toàn bộ 9 tiêu chí có chứng cứ. Không quy đổi sang điểm tuyển dụng hay mastery. Sửa transcript khiến tổng N/A, giữ lịch sử revision.

Retry toàn phiên tạo ba attempts mới trống, ghim parent/root transcript version cho từng lượt. Independent dùng variant và ẩn hỗ trợ khi soạn. Đối chiếu phiên cha hiển thị từng tiêu chí; guided hoặc baseline đã thay đổi không được coi là tiến bộ độc lập. Không có aggregate AI score/comparison vì chưa kiểm định model/rubric theo phiên.

IndexedDB `brse-interviews` v2 thêm store `sessions`; migration giữ store `attempts` v1. Queued writes thay cả hai store trong một transaction sau validation. Giới hạn 100 phiên, 300 attempts tổng, backup 5 MB. Exam và vocabulary độc lập. Không hỗ trợ đồng bộ thay đổi nhiều tab.

Backup Interview schemaVersion 1 thêm trường `sessions` tùy chọn (mặc định []). Backup cũ vẫn nhập được; bản phần mềm cũ dùng strict schema có thể không nhập backup mới. Không dùng app cũ để ghi lại database đã nâng cấp. Import kiểm tra IDs, track, thứ tự ba câu, mode, timestamps, parent từng lượt và vòng lặp; invalid import không ghi đè. Xóa Interview xóa cả phiên và attempts.

Nghiệm thu: xem ACCEPTANCE_TESTS.md. Còn thiếu: follow-up thích ứng theo câu trả lời, cấu hình độ dài/round, một kịch bản khách hàng liên tục, AI feedback/calibration toàn phiên và error queue.
