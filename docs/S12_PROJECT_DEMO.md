# S12 — Project Demo local

## Luồng được triển khai

Sidebar Project Demo → nhập tên dự án → agenda 6 phần/10 phút (bối cảnh1, vai trò1, kiến trúc2, tính năng3, thách thức2, kết quả1) → timer tổng, ghi split khi chuyển phần → pause/resume hoặc kết thúc chủ động → ghi nội dung sau luyện → tự review 3 tiêu chí có trích dẫn và hướng sửa → lịch sử → backup/khôi phục/xóa riêng.

Agenda và câu hỏi phản tư tự biên soạn, không phải rubric tuyển dụng được hiệu chuẩn. Không tự chấm điểm. Không lấy repo/URL, không xin mic/camera, không gọi AI, không lưu media. Text là nội dung do người học tự ghi, không phải transcript được ghi âm/xác thực. Chứng cứ trích nguyên văn text, không suy ra timestamp audio.

## Domain và persistence

`domain/demo.ts`: schema strict, thao tác bất biến, timer tính accumulated elapsed + delta từ anchor wall time, tách pause, splits tích lũy không giảm. Mục tiêu600s, không tự kết thúc ở mốc này; cap24h để giới hạn dữ liệu. Reload/rời màn hình khôi phục từ anchor đã lưu. Chỉnh đồng hồ có thể làm sai timer; delta âm clamp0, không chứng nhận độ chính xác hay tương đương thi thật. Chỉ kết thúc/chuyển phần theo thao tác người học, không suy đoán nội dung nói.

`demo-storage.ts`: IndexedDB `brse-demo` v1, store `state`, key `current`, dữ liệu toàn module ghi atomic một record. Load/import/write đều validate. Tối đa50 lượt, chỉ1 chưa kết thúc, ID duy nhất, UTF8 backup<=5MB. Export `BRSE_DEMO_BACKUP` v1. Không ảnh hưởng DB khác. Lỗi đọc chặn tạo mới; backup hợp lệ có thể khôi phục. UI chỉ nhận bản mới sau write thành công, thao tác ghi có busy guard. Không có đồng bộ nhiều tab.

Nội dung tối đa20.000 ký tự; sửa tăng version và xóa reviews cũ (có xác nhận khi đã review), lưu text không đổi giữ review. Review `demo-self-v1`: role/tradeoff/outcome, mỗi tiêu chí1 review, quote/next1–2000 ký tự, quote phải thuộc text/version của lượt DONE. Không có tổng điểm; thiếu review không được thay bằng0. Nội dung và review cần lưu rõ ràng, không autosave nháp. Export chỉ chứa dữ liệu đã lưu. Đổi lượt/rời trang có thể bỏ nháp chưa lưu; không nhập thông tin dự án bí mật.

## Phạm vi còn lại

M11 mới có một phần: portfolio/repo reference, đối thoại phản biện thích ứng, evidence feedback AI thật, voice tích hợp và so sánh retry chưa triển khai. Các câu hỏi phản tư cố định chỉ hỗ trợ tự review. Dashboard chưa tổng hợp Demo. Chưa kiểm thử đa trình duyệt/đa tab, không có backend endpoint mới.
