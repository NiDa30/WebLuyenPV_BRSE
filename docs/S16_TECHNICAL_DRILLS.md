# S16 — Technical Drill local đầu tiên

## Luồng triển khai

Sidebar Technical Drill → lọc API/SQL/Security hoặc tìm bài → mở tình huống tự biên soạn → trả lời bằng luồng Interview → lưu nháp/submit/version → evidence self-review/queue → Guided hoặc Independent retry → so sánh có điều kiện → lịch sử Technical Drill/Interview, dashboard và backup Interview.

3 bài mới: API retry/idempotency chống đơn trùng, SQL pagination/sort/index/đo truy vấn, object/tenant authorization. Mỗi bài có prompt và variant tiếng Nhật, intent, hints, follow-up cố định và4 điểm đối chiếu tiếng Việt. Nguồn AUTHOR_CREATED, catalog technical-drill-v1. Bối cảnh là bài tập giả định, người học phải phân biệt đã làm/đề xuất/chưa kiểm chứng, không suy claims từ CV.

Điểm đối chiếu có thể mở trong INITIAL/GUIDED hoặc sau khi gửi INDEPENDENT. Draft INDEPENDENT không render checklist. Đây là hỗ trợ luyện tập, không ngăn người học tự mở kho/lịch sử của mình. Không thực thi code/SQL, không quét hệ thống, không tự kết luận đáp án đúng từ từ khóa, không đánh giá bảo mật hay năng lực kỹ thuật được kiểm định.

## Kiến trúc và persistence

`shared/technical-drills.json` là catalog tự biên soạn; `domain/technical.ts` tìm/lọc ID; `domain/interview.ts` đưa3 câu vào registry chung sau6 câu độc lập+6 lượt scenario trước đó. Tổng15prompts. `TechnicalDrills.vue` là màn hình chọn bài/lịch sử scoped, mở đúng attempt ID sang InterviewWorkspace. Workspace hiển thị metadata/checkpoints theo question ID và mode. Không sao chép dữ liệu hay tạo DB/schema mới.

Dùng JOB/job-text-v1 với3 tiêu chí hiện có (trọng tâm, cụ thể/chứng cứ, cấu trúc); đây là rubric tự review cách giải thích, chưa phải rubric tính đúng kỹ thuật riêng. Quote/version/offset, transcript edit invalidation, same-chain retry comparisons, voice consent, optional AI consent/quota và queue dùng các guard cũ. Không cộng điểm thành technical mastery. Thiếu self-review không bị đổi thành0; kết quả AI fixture không là nghiệm thu chất lượng chấm thật.

IndexedDB `brse-interviews`v3, export/import `BRSE_INTERVIEW_BACKUP`v1 chung attempts/sessions/reviewQueue. Backup/xóa Interview ảnh hưởng cả Technical Drill, có chỉ dẫn trên màn hình; Exam/Demo/Vocabulary không bị ảnh hưởng. Giới hạn300attempts/100sessions/300queue/5MB và read-failure guards như S2/S8. Start chờ flush trước khi chuyển màn hình; nếu ghi lỗi, bản nháp còn trong bộ nhớ và cảnh báo không nên tạo trùng trước recovery. Lịch sử Technical chỉ liệt kê3 ID mới và retries; dashboard Interview đã tính chúng nên không cộng lại vào nhóm khác.

Các phiên3lượt cũ dùng danh sách ID cố định, không bị thay bằng bài technical mới. Registry backend được đồng bộ chính xác để gateway chọn prompt/variant authored khi có consent cấu hình hợp lệ. Không API mới, không frontend provider key, không bật AI/Jisho.

## Chưa làm

M10 mới có một phần: drill theo stack/CV/JD, SQL/code runner an toàn, system design, follow-up thích ứng, rubric kỹ thuật được kiểm định và AI/voice trên thiết bị thực chưa triển khai. Không coi3 bài là hoàn tất Technical Interview sâu. M02 được mở rộng nội dung nhưng cũng chưa hoàn tất vision.
