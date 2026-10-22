# S14 — Portfolio references và Demo dashboard

## Phạm vi chạy được

Mỗi lượt Demo có tối đa3 tham chiếu đặt tên (portfolio/repo/demo website). Lưu/xóa riêng trong lượt đang chọn, ở trạng thái RUNNING/PAUSED/DONE đều được. Link chỉ là metadata tự nhập; không xác minh sở hữu, không tải repo, đọc source code, chụp trang hay dùng media ngoài. Mở website khác chỉ khi bấm anchor HTTPS, tab mới có noopener/noreferrer/no-referrer. Không nên lưu URL bí mật hoặc token.

Dashboard có card Demo, việc tiếp tục lượt đang chạy, việc bổ sung bài/QA còn thiếu hoặc lỗi thời, recent filter DEMO và số lượt tạo theo ngày7/30. Mở đúng ID của action/recent; nếu lượt bị xóa/thay giữa lúc đọc dashboard và mở workspace, báo mất nguồn, không tự mở lượt khác. Backup Demo mở đúng khu vực dữ liệu. Nav Demo thông thường vẫn ưu tiên lượt đang luyện rồi lượt mới nhất.

## Reference contract

`references` optional(default[]) trên session và retry.baseline, giữ schemaVersion1/IndexedDBv1. Label trim1–80 ký tự. URL trim<=500, bắt đầu https://, không whitespace/backslash, không credentials/query/fragment. URL được canonicalize bằng URL.href trước kiểm tra trùng; max3, unique canonical URL. Field lạ bị từ chối như schema cũ. Cùng validation cho input, load, import và write; backup nguy hiểm không được thay thế dữ liệu trước đó. Mở URL không chứng nhận trang ngoài an toàn/thuộc người học.

Sửa tham chiếu không sửa timer/text/version/QA/reviews. Retry sao chép references hiện tại sang lượt con (ngữ cảnh dự án dùng chung); baseline chụp references độc lập. Sửa nguồn sau đó có thể làm cảnh báo snapshot khác nguồn. Chế độ INDEPENDENT vẫn dùng ngữ cảnh dự án và references của lượt con; nội dung bài/trả lời/hướng sửa cũ tiếp tục bị ẩn theo S13. Export/import mới giữ references, backup S12/S13 thiếu fields vẫn đọc được; frontend cũ có thể không đọc được backup mở rộng.

## Dashboard data boundary

Read-only load Demo DB khi mount dashboard, re-read khi quay lại từ workspace. Không ghi vào DB, không đồng bộ tự động giữa nhiều tab. Lỗi đọc => Demo N/A + cảnh báo; các nguồn khác giữ hoạt động, dữ liệu lỗi nguyên vẹn cho recovery bằng backup hợp lệ. Không có backend endpoint mới.

Card counts: total, timer DONE, active, DONE có text+3 QA hiện hành, số QA stale, số retry và mục tự review hiện hành (không tính review QA stale). Counts không phải điểm kỹ thuật/retention/mastery. Actions ưu tiên một pending Demo có stale QA trước lượt mới hơn chỉ thiếu câu trả lời. Dashboard không chứa full text, QA, review notes hoặc URLs.

Timestamp có sẵn chỉ là createdAt nên daily/recent Demo dùng **ngày tạo**, không giả ngày hoàn tất/review. Không tạo event sửa text/refs hay điểm giả. Các quy tắc timezone/DST/future omission/recent cap20 như S10. Nếu Demo chưa đọc được, demoStarts=N/A; đã đọc trống=0. Tạo retry là thêm lượt, không suy ra tiến bộ. Không cộng Demo vào một tổng điểm chung.

## Chưa làm

Phân tích repo, kiểm chứng quyền sở hữu, AI/voice, phản biện thích ứng, biểu đồ tiến bộ được kiểm định, dashboard lịch sử revision đầy đủ, đồng bộ nhiều tab/cross-device và kế hoạch dài hạn vẫn chưa triển khai. M11/M14 vẫn có một phần.
