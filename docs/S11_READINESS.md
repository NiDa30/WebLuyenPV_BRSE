# S11 — Checklist chuẩn bị phỏng vấn

M15 increment local: 10 mục tự biên soạn, nhóm thiết bị/kết nối/không gian/ứng xử dành cho phỏng vấn trực tuyến. Người học tự kiểm tra rồi đánh dấu; không có network benchmark, truy cập camera/mic, điểm năng lực, phân tích tính cách hay xác nhận tuyển dụng.

Sidebar → Checklist phỏng vấn → đánh dấu → lưu ghi chú → reload → xuất/nhập JSON → chuẩn bị lại. Không bắt buộc hoàn tất checklist để luyện Interview. Dữ liệu không nối vào AI hoặc tổng hợp điểm dashboard.

IndexedDB riêng `brse-readiness` v1, store `state`, key `current`. Backup `BRSE_READINESS_BACKUP` v1 chứa checked IDs duy nhất thuộc catalog, note tối đa 2000 ký tự, updatedAt nullable. Giới hạn file 20 KB. Validation trước ghi; ghi thành công mới cập nhật trạng thái. Lỗi đọc chặn ghi thông thường, cho phép khôi phục backup đã kiểm tra. Import/reset cần xác nhận. Export chỉ chứa bản đã lưu; nháp ghi chú cần bấm Lưu. Toggle không tự lưu hoặc xóa nháp ghi chú.

Một checklist hiện tại, không có lịch sử phiên hoặc đồng bộ nhiều tab. Ngày lưu là thời gian thiết bị, không chứng minh đã kiểm tra thiết bị. Kiểm tra lại trước mỗi cuộc họp. JSON chưa mã hóa, không nên ghi thông tin bí mật. Reset chỉ ảnh hưởng DB readiness.

Còn thiếu: checklist theo loại phỏng vấn, liên kết phiên/lịch sử, kiểm tra thiết bị có consent và nghiệm thu thực tế, nội dung chuyên sâu có kiểm duyệt. Không coi M15 hoàn tất vision.
