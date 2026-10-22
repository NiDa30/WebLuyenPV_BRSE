# S9 — Ôn từ theo lịch local

## Sử dụng

Tra và lưu một cụm → Nhật ngữ & Sổ từ → Ôn theo lịch → lật thẻ → tự chấm Chưa nhớ/Khó/Nhớ/Dễ. Chỉ những thẻ đến hạn và có mặt sau dùng được mới chấm được. Ôn flashcard tự do vẫn hoạt động và không đổi lịch.

Thẻ AUTHOR_CREATED dùng corpus tự biên soạn/ghi chú. Tham chiếu Jisho cần ghi chú cá nhân không rỗng; không tải hoặc lưu thêm nghĩa, câu ví dụ/media ngoài để làm mặt sau.

Sửa ghi chú làm version nội dung tăng; lịch cũ cần đặt lại sau khi rà soát. Sửa tags giữ lịch. Quản lý lịch từng từ → Đặt lại lịch có xác nhận, xóa lịch sử riêng từ đó và đưa về thẻ mới; giữ bookmark, ghi chú và tags. Hãy export backup trước nếu muốn giữ lịch sử cũ.

## Quy tắc, không phải dự đoán khả năng nhớ

Policy `FIXED_INTERVAL_V1`, ngày=24 giờ thực tính bằng milliseconds, không là mốc nửa đêm lịch địa phương:

| Mức tự khai | Khoảng tiếp theo |
|---|---|
| Chưa nhớ | 1 phút; interval nền trở về0 |
| Khó | max(1 ngày, làm tròn interval nền×1.2) |
| Nhớ | max(3 ngày, interval nền×2) |
| Dễ | max(7 ngày, interval nền×3) |

Các interval ngày tối đa180 ngày, tính từ lúc thực sự chấm, không từ ngày hẹn cũ. Thẻ mới đến hạn tại createdAt. Không tự trừ điểm khi bỏ lỡ lịch hoặc tự tạo lượt ôn khi đóng tab. UI chỉ hiện nút chấm sau khi lật, cho biết khoảng tiếp theo; store kiểm tra due/version/content fingerprint/event count để chặn chấm sớm hoặc thao tác trùng/cũ.

Đây là quy tắc thử nghiệm, không SM-2/FSRS, không dự đoán retention hoặc đánh giá tiếng Nhật/phỏng vấn/mastery. Lịch dựa trên đồng hồ thiết bị, không có chứng thực thời gian hoặc chống người dùng chỉnh đồng hồ. Không có thông báo ngoài app, lịch/calendar hoặc server job.

## Lịch sử và dữ liệu

Mỗi bookmark thêm `contentVersion` mặc định1 và optional `schedule:{policy,contentVersion,events:[{grade,at}]}`. Interval/due tính lại bằng replay, không tin trường điểm/hạn được nhập thêm. Import kiểm tra grade/policy, integer timestamps hữu hạn, thứ tự và khoảng hạn giữa events, source version không vượt version hiện hành, events trong khoảng createdAt/updatedAt, max100 lượt/thẻ. Nguồn cũ có thể nhập lại với lịch stale để người học chủ động reset.

Tối đa500 bookmark,100 events/thẻ,5 MB toàn backup. Tới100 lượt phải export/đặt lại lịch trước khi chấm tiếp; không tự âm thầm bỏ lịch sử. UI hiển thị10 event mới nhất, đánh dấu nếu thuộc version nội dung cũ. Chưa lưu snapshot nội dung cũ cho từng lượt, không có full content revision audit.

Không tăng IndexedDB version1 hay backup schemaVersion1: optional schedule/default contentVersion nằm trong bookmark store hiện có. Legacy input chưa có fields vẫn nhập được thành thẻ mới. App cũ strict schema có thể từ chối bản ghi/backup mới; không dùng bản cũ để ghi dữ liệu này. Invalid backup từ chối trước replacement; reset/xóa bookmark/xóa sổ từ xử lý lịch sử cùng bookmark, không động Exam/Interview/queue.

Không thay API, provider keys/flags hoặc quyền media. Xem ACCEPTANCE_TESTS.md cho mốc/clock fixtures, offline reload và dữ liệu không truyền ra ngoài. Chưa nghiệm thu retention dài hạn, đa trình duyệt, đồng bộ nhiều tab hoặc thông báo background.
