# S10 — Dashboard học tập hợp nhất

## Mở dashboard

Chọn Dashboard học tập trong thanh điều hướng, hoặc nút từ trang Tổng quan. Trang Tổng quan/luồng Exam cũ vẫn giữ nguyên. Dashboard dùng dữ liệu guest trên thiết bị; không yêu cầu tài khoản hoặc gửi thống kê ra ngoài.

Bốn nhóm hiển thị riêng:

- Exam: tổng/đang dở/hoàn tất, số phần có số câu làm/đúng hoặc điểm nhập tay (0 hợp lệ vẫn được tính). Không trung bình điểm giữa đề, loại điểm, cấu hình hoặc nguồn khác nhau.
- Interview: attempts nháp/đã gửi, INITIAL/GUIDED/INDEPENDENT riêng, phiên3 lượt hiện hành/cần rà soát, số tiêu chí tự chấm và số attempts có AI feedback. Đã gửi không đồng nghĩa đánh giá độc lập.
- Queue: mục mở, nguồn đổi, dấu đã luyện tự khai và số dấu còn nguồn/retry hiện hành. Các nhóm có thể giao nhau; không cộng thành mastery.
- Vocabulary: đến hạn/chờ/thiếu ghi chú/stale/full, số lượt nhớ tự khai còn giữ trong log. Reset/xóa/import làm thống kê thay đổi.

“Việc có thể làm tiếp” mở timer đang dở, phiên3 lượt cần làm/rà soát, bản nháp riêng lẻ, queue, ôn từ đến hạn hoặc notebook thiếu ghi chú. Ưu tiên điều hướng theo trạng thái, chưa phải kế hoạch học cá nhân hóa dựa vào năng lực.

## Bảng ngày và hoạt động gần đây

Chọn7 hoặc30 ngày lịch, theo múi giờ trình duyệt (có nhãn timezone). Tách ba đơn vị: timer Exam kết thúc, version transcript gửi và lượt nhớ tự khai. Không cộng thành điểm/chỉ số chung. Gửi lại transcript thêm một sự kiện, không thêm một năng lực.

Exam chỉ được tính vào ngày hoàn tất nếu có EXAM_END timestamp. Phiên thiếu mốc không tự gán createdAt làm giờ kết thúc; số thiếu mốc hiển thị riêng. Timestamp không hợp lệ/ở tương lai bị loại khỏi bảng/recent, không tự sửa ngày. Chuyển DST dùng ngày địa phương, không chia timestamp thành khối24 giờ UTC.

Recent hiển thị tối đa20 sự kiện còn giữ, lọc từ20 sự kiện đó theo nhóm; không bị giới hạn bởi khoảng ngày ở bảng. Không có full audit log vĩnh viễn: xóa/reset/import thay nguồn dữ liệu. Không đưa toàn transcript, ghi chú tự đánh giá/plan hoặc note từ vựng vào dashboard. Tên đề/câu hỏi/cụm từ vẫn hiển thị local.

Recent transcript v1 mở attempt hiện tại (có thể đã sửa thành v2); UI ghi rõ điều đó. Điều hướng dùng ID hiện có và kiểm tra nếu đã xóa/thay thế, không là URL chia sẻ hoặc route được persist qua reload.

## Tải dữ liệu và quyền ghi

Dashboard gọi init Interview/Vocabulary một lần theo store; init Interview được deduplicate để chuyển trang trong lúc load không tạo hai read có thể ghi đè state mới. Exam do App init/timer hiện có quản lý, không recover lại mỗi lần xem dashboard.

Nhóm chưa đọc xong/đọc lỗi hiện N/A, không0. Các nhóm còn lại hoạt động độc lập. Hiển thị lỗi lưu và thông báo nếu có snapshot còn chờ ghi. Cung cấp nút backup đúng module để khôi phục có xác nhận. Exam read failure chặn persist/create; chỉ backup/import hoặc xóa có xác nhận mới phục hồi được trạng thái ghi bình thường.

Các số liệu là projection từ state hiện tại trong app; khi ghi chậm có thể chưa durable, banner chỉ rõ. Dashboard không ghi aggregate, không đổi source scores, schedule, quote, queue flags hoặc transcript. Timer đang chạy vẫn tiếp tục theo cơ chế sẵn có khi dashboard mở.

Không đổi IndexedDB schemas, backup envelope hay HTTP contracts; không thêm analytics/provider calls. Chưa có đối chiếu score/AI calibration, readiness/mastery, lịch nhắc, đồng bộ nhiều tab, route URL chia sẻ, biểu đồ retention hoặc nghiên cứu hiệu quả học.
