# S6 — Role-play BrSE xuyên suốt: CSV gấp

Trong Kho câu hỏi, chọn Track B → Bắt đầu tình huống CSV. Kịch bản AUTHOR_CREATED có ba lượt:

1. Khách đề nghị xuất CSV vào thứ Sáu; BrSE hỏi rõ phạm vi/quyền/ưu tiên.
2. Khách xác nhận ba cột và chỉ đơn của bản thân; đọc kết quả kiểm tra giả lập của nhóm rồi trình bày tác động/đề xuất phương án có điều kiện.
3. Khách chọn thử nghiệm tối đa 100 dòng/người; BrSE tóm tắt phạm vi, điều kiện kiểm tra, đầu mối và mốc cập nhật cần xác nhận.

Khách phản hồi theo kịch bản cố định, không tự suy luận nội dung trả lời. Những dữ kiện như ước lượng ngày công là dữ liệu mô phỏng cho tình huống, không là dự báo thật. Không có adaptive AI, nhận diện intent tự động hoặc chấm nhất quán hội thoại.

## Ngữ cảnh và chỉnh sửa

- Mỗi lượt hiển thị brief; lượt 2/3 có thông tin nhóm giả lập. Timeline hiển thị lời khách và transcript của các lượt trước trong cùng phiên.
- Khi gửi lượt sau, store chặn nếu bất kỳ lượt trước chưa gửi hoặc có ngữ cảnh lỗi thời. Kiểm tra này hoạt động cả khi mở từ Lịch sử Interview.
- `scenarioContext` lưu IDs và version của các lượt trước. Feedback đang xem dùng đúng snapshot đã ghim. Sửa lượt trước khiến mọi lượt phụ thuộc chuyển sang cần rà soát; điểm cũ vẫn có nhãn lịch sử nhưng bị loại khỏi tổng phiên, AI/self-review mới bị chặn.
- Quay lại từng lượt theo thứ tự → Sửa transcript → rà soát với ngữ cảnh hiện tại → gửi lại. Không tự sao chép feedback cũ hoặc tự coi câu trả lời cũ còn phù hợp.
- Context metadata gắn với trạng thái hiện hành; lịch sử text revision vẫn được giữ, chưa có log ngữ cảnh riêng cho từng revision quá khứ.

## Retry và feedback

Guided/Independent Retry toàn phiên tạo ba bản nháp trống cùng scenarioId; ghim parent/root transcript version như S5. Context mới chỉ dùng lượt trong phiên retry hiện tại. Independent vẫn cần đọc lời khách/các lượt hiện tại để duy trì hội thoại, nhưng không hiện đáp án/gợi ý của lần luyện trước khi soạn.

Tái sử dụng rubric BrSE, exact quote/offset/version/timestamp và Evidence Inspector. Tổng vẫn là tự đánh giá có chứng cứ, không phải điểm AI hay mastery. AI panel chỉ đánh giá **một lượt** qua consent riêng; không gửi timeline/context versions hoặc các câu trả lời trước, không được coi là đánh giá toàn hội thoại. Khi context stale, panel AI và form self-review bị ẩn; store cũng chặn ghi kết quả AI mới cho ngữ cảnh cũ.

## Dữ liệu và giới hạn

Corpus nằm tại `shared/brse-scenario.json`; catalog backend có cùng ba prompt/variant (kiểm thử parity). Kho câu hỏi thông thường vẫn 6 câu; câu scenario chỉ mở qua phiên để giữ ngữ cảnh.

Không thêm database hoặc migration. IndexedDB Interview v2 chứa optional `scenarioId` trên session, optional `scenarioContext` trên attempt. Backup v1 nhận trường mới và vẫn nhận backup cũ không có chúng. Phần mềm cũ có strict schema có thể từ chối backup mới; không mở bằng bản app cũ để ghi lên DB mới. Import kiểm tra thứ tự/track/mode/parent, phiên có cùng kịch bản và version context tồn tại. Lượt stale hợp lệ vẫn có thể backup/khôi phục và giữ cảnh báo.

Exam/Vocabulary tách biệt; không thêm đăng ký/đăng nhập, server transcript database, media hoặc quyền provider mới. Giới hạn giữ nguyên: 100 phiên / 300 attempts / backup 5 MB, không hỗ trợ chỉnh sửa đồng thời nhiều tab.

Còn thiếu: nhiều nhánh khách theo quyết định/intent đã kiểm định, thêm tình huống production/progress/minutes/acceptance, biên bản có cấu trúc, kiểm định AI consistency và provider thực tế.
