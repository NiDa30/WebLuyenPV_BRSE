# S18 — Mục tiêu theo chế độ và dashboard

## Luồng chạy được

Technical Drill → tạo mục tiêu với chế độ Tất cả/Initial/Guided/Independent → liên kết lượt đã gửi đúng bài và đúng chế độ → count theo pin transcript version → tự ghi nhận khi đủ target → dashboard xem mục mở/đủ lượt/DONE còn hiện hành/refs thiếu hoặc lỗi thời → mở đúng goal ID và focus card. Mở danh sách để backup/recovery. Link dashboard đã bị xóa/thay thế được báo rõ, không âm thầm chọn mục tiêu khác.

Không tạo attempt/retry tự động, không hiểu nội dung mục tiêu bằng NLP hay đánh giá kỹ năng. Mode là điều kiện đếm lượt, không chứng nhận mức độ độc lập ngoài thao tác của ứng dụng. Người học vẫn có thể chủ động xem dữ liệu cũ như các luồng training trước đó.

## Mode và tương thích

Goal v1 thêm optional mode với default ANY. Backup/DB S17 thiếu field vẫn đọc và giữ cách đếm tất cả chế độ. New create hỗ trợ ANY/INITIAL/GUIDED/INDEPENDENT, một OPEN mỗi cặp questionId+mode; có thể đặt ANY và INDEPENDENT song song. Không đổi mode của goal cũ hồi tố; tạo mục mới nếu cần điều kiện khác. Frontend cũ có thể không đọc được backup mở rộng.

Link helper từ chối attempt chưa gửi/sai bài/sai mode. Currentness vẫn cần status REVIEWED, đúng question và version pin; count/met dùng các current links đúng mode. Initial/Guided/Independent totals cho biết phân bố các current links đang có; imported refs hiện hành nhưng khác mode được báo excluded và không làm met=true. Import không tự đổi mode hay refs để đạt target. Snapshot IDs không chứng minh nguồn dữ liệu được xác thực.

DONE là tự ghi nhận: guard target đủ count đúng mode, thiếu nguồn/đang edit/version đổi có thể khiến mục DONE chỉ còn lịch sử. Không xóa trạng thái hay suy ra mất kỹ năng. Giữ target1..20,links<=20,goals<=50,UTF8<=200KB,strict schema/unique IDs/date/status như S17. Không DB-version/API mới, vẫn DB brse-technical-goals riêng và backup goal/Interview riêng.

## Dashboard và read failure

Read-only goal load độc lập với Interview. Card có total/open/manualDone; met là OPEN đủ lượt đúng mode, doneCurrent là DONE còn đủ current count. Missing/stale là tổng liên kết across goals (một attempt có thể được liên kết nhiều mục, không phải số kỹ năng). Nếu goals unreadable→card N/A; nếu goals đọc được nhưng Interview unreadable→open/DONE vẫn biết, derived counts N/A. Không đổi N/A thành0, không ghi đè khi đọc. Valid import ở TechnicalGoals phục hồi DB rồi quay lại dashboard sẽ đọc lại.

Pending action chọn OPEN có stale/missing trước rồi mới theo createdAt, target chứa exact goal UUID. Detail chỉ có authored question title/mode/current count, không chứa objective text/transcript/review/URL. Không thêm các goal counts vào Interview attempt totals hay overall score; không tạo ngày hoàn tất/event lịch sử giả.

After fresh goal load, exact ID được kiểm tra trước scroll/focus; read failure không bị báo thành deleted target. Ordinary Technical Drill sidebar không tự chọn goal, dashboard list target scroll đúng section. Không đồng bộ nhiều tab; dashboard re-read khi mount.

## Còn thiếu

Chưa chỉnh sửa mode của goal cũ, deadline/reminder, progress charts được kiểm định, lập kế hoạch thích ứng, CV/JD inference hay cloud sync. M10/M14 vẫn có một phần. Live AI/Jisho/physical voice chưa nghiệm thu, không có mới inference trong increment này.
