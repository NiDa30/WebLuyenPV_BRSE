# S15 — Kế hoạch luyện Demo gắn chứng cứ

## Luồng chạy được

Trong lượt Demo DONE, lưu review bài trình bày hoặc câu phản biện hiện hành → chọn review trong Kế hoạch luyện Demo → chọn ngày → tạo mục có snapshot quote/hướng sửa → đổi ngày, mở nguồn hoặc tạo GUIDED/INDEPENDENT retry → mở đúng lượt retry đã liên kết → hoàn tất bài trình bày +3 trả lời hiện hành → người học tự ghi nhận đã luyện → xem lịch sử DONE, backup hoặc xóa riêng mục kế hoạch.

Một kế hoạch gắn một retry, không tự tạo lại khi đã có liên kết. Phải tiếp tục lượt đó; nếu nguồn review đổi cần review và tạo mục mới. Không yêu cầu tạo đủ review trước retry; điều kiện retry của S13 vẫn là bài nguồn cùng3 câu trả lời hiện hành, không có timer khác đang chạy và giới hạn50lượt. Nút retry giữ lỗi rõ ràng khi chưa đáp ứng.

Đây là kế hoạch tự đặt, không có push notification hay cam kết coaching/retention. Đã luyện là tự khai; hoàn tất thao tác không chứng nhận đã sửa đúng hoặc tăng năng lực. Mục kế hoạch không cộng vào điểm/chấm AI và không thay đổi hàng đợi Interview.

## Snapshot và nguồn đổi

Plan lưu sessionId, criterion, loại nguồn PRESENTATION/FOLLOWUP, createdAt, ngày YYYY-MM-DD, OPEN/DONE, doneAt nullable, retryId nullable. Snapshot lưu sourceVersion, answerVersion(nullable cho presentation), source text, exact quote và next action. Chỉ tạo từ review còn hiện hành; chặn kế hoạch OPEN trùng cùng nguồn/version/snapshot. Review quote/next hoặc phiên bản nguồn thay đổi => stale, không tự sửa snapshot, không cho tạo retry mới hay đánh dấu đã luyện từ nguồn cũ.

Sửa câu trả lời/nguồn giữ mục cũ và báo stale. DONE không bị tự xóa hoặc chuyển OPEN; nếu source/retry không còn current, UI ghi đây là tự ghi nhận trước đây. `canFinish` cần nguồn review hiện hành, retry đúng parent và đủ saved text+3current QA. Sửa bài retry sau DONE có thể khiến doneCurrent=false. Không suy ra điểm tiến bộ từ số DONE.

Chế độ INDEPENDENT chưa hoàn tất ẩn quote/hướng sửa trong bảng kế hoạch cùng với baseline S13; DOM không render dữ liệu này. Metadata lịch/tiêu chí còn thấy; người học vẫn có thể chủ động mở lịch sử nguồn của mình (training, không phải hệ thống chống gian lận).

## Data contract và recovery

Không API/DB-version mới. `BRSE_DEMO_BACKUP` v1 thêm root plans optional→default[], tối đa200 mục. IndexedDB `brse-demo`v1/state/current vẫn ghi một record atomically, UI chỉ cập nhật sau write thành công. Cùng giới hạn5MB UTF8; backup cũ không plans vẫn đọc được. Import mới thay cả Demo sessions và plans sau validation+confirmation. Xóa tất cả Demo xóa kế hoạch; xóa một kế hoạch giữ nguyên source/retry.

Ngày thực trong khoảng2000-01-01..2100-12-31, không chấp nhận ngày lịch không tồn tại. Ngày kế hoạch là calendar date theo thiết bị, giữ nguyên khi export/import, không tự đổi múi giờ hoặc đánh thức trình duyệt. Dashboard dùng ngày local của S10 để tính OPEN đến ngày (bao gồm overdue); không tạo event hoàn tất giả cho bảng lịch sử.

Strict schema: UUID duy nhất, exact quote trong snapshot text, version/source loại phù hợp, max quote/next2000, source text20000 (QA8000), plan source tồn tại/DONE, phiên bản snapshot không vượt source hiện tại. Khi source version còn trùng thì source text phải khớp. Retry link tồn tại và parent đúng sessionId; thứ tự createdAt/doneAt hợp lệ, DONE cần retry+doneAt. Các snapshot là self-report local, không chứng minh lịch sử source đã bị chỉnh sửa. Invalid import/write không ghi đè trạng thái đã lưu.

## Dashboard và phạm vi còn lại

Card Demo có kế hoạch OPEN, đến ngày, stale và DONE (tự khai) riêng; action mở đúng vùng kế hoạch. Dashboard chỉ đọc, không hiển thị quote/hướng sửa. DB/schema lỗi => N/A như S14, không biến lỗi thành0 hoặc ghi đè dữ liệu.

Chưa có nhắc lịch nền, kế hoạch dài hạn thích ứng, nhiều retry trên một mục, đồng bộ nhiều tab/cross-device, unified Interview/Demo queue, coaching AI hay kiểm định độ cải thiện. M11/M14 vẫn có một phần.
