# S8 — Hàng đợi luyện lại có chứng cứ

## Luồng sử dụng

Trong feedback, tự đánh giá có trích dẫn rồi chọn **Đưa tiêu chí này vào hàng đợi**, hoặc chọn tiêu chí AI có annotation sau một yêu cầu AI đã được đồng ý. Mở tab **Hàng đợi luyện lại** để lọc track/trạng thái, ghi hành động lần tới, ưu tiên và bắt đầu Guided/Independent Retry.

Không tự suy ra lỗi từ local REVIEW_PROMPT, độ dài hoặc điểm thấp. Người học chọn tiêu chí cần luyện. Với AI, snapshot lấy annotation đầu của tiêu chí; không coi queue là xác nhận mô hình đúng. Không gọi provider khi thêm/xem/sửa queue.

## Snapshot và trạng thái

Mỗi mục ghim attempt, transcript version, criterion, source SELF_REVIEW/AI_MODEL, exact quote/UTF-16 offsets, điểm và lý do tại lúc thêm. Snapshot AI có provider/model; tự đánh giá không giả nhãn AI. Snapshot không bị thay khi người học đổi note/điểm hoặc mô hình ở cùng transcript version; UI luôn ghi đây là snapshot khi thêm. Mục trùng cùng attempt/version/criterion/source giữ nguyên ID/kế hoạch, không tạo thêm mục.

Sửa transcript hoặc thay ngữ cảnh scenario khiến mục nguồn stale. Quote cũ vẫn được giữ để kiểm chứng; chỉ mở nguồn hiện tại, không gán lại quote vào version mới. Muốn luyện theo nguồn mới, rà soát feedback và thêm mục version mới. Có thể xóa mục cũ; không tự thay chứng cứ.

Queue OPEN/DONE là theo dõi tự luyện. DONE cần một retry hiện hành đã gửi xong; với scenario cần cả ba lượt/ngữ cảnh hiện hành. Không bắt buộc tự chấm đủ rubric để đánh dấu đã thực hành, không tự kết luận mastery/readiness hoặc tiến bộ độc lập. Khi nguồn/retry đổi sau DONE, dấu DONE là lịch sử tự khai, UI ghi không còn hiện hành; có thể mở lại. Guided không được coi là bằng chứng tiến bộ độc lập.

## Retry

- Câu độc lập hoặc một lượt trong script S5: tạo attempt mới với parent/version đúng nguồn.
- Scenario CSV/production: phải hoàn tất phiên nguồn; tạo cả phiên retry cùng scenario, liên kết mục với đúng vị trí lượt. Bắt đầu từ lượt đầu qua báo cáo để giữ ngữ cảnh.
- Retry gần nhất chưa hoàn tất thì tiếp tục nó, không tạo liên tiếp bản nháp. Sau khi hoàn tất có thể tạo lần mới; giữ tối đa10 liên kết mỗi mục.
- Không sao chép câu trả lời/biên bản parent. Independent dùng variant/ẩn hỗ trợ; mọi so sánh vẫn theo guard rubric/baseline hiện có.
- Xóa queue metadata không xóa transcript/retry/điểm. Xóa Interview xóa queue cùng dữ liệu Interview; Exam/Vocabulary riêng biệt.

## Dữ liệu và giới hạn

`review-queue.ts` định nghĩa schema, khóa chống trùng, cross-reference và trạng thái nguồn/target. Pinia Interview quản lý queue cùng attempts/sessions. IndexedDB `brse-interviews` v3 thêm store `reviewQueue`, giữ v1/v2 attempts/sessions/minutes. Load là một readonly transaction, ghi/import/clear là một readwrite transaction trên cả ba stores.

Backup Interview schemaVersion1 thêm `reviewQueue` optional mặc định[]; legacy input vẫn nhập được. Bản app cũ có strict schema/DB version thấp hơn không thể đọc/ghi dữ liệu mới; không quay lại app cũ để ghi DB. Import kiểm tra IDs/source/version/quote/criterion, target parent/version và toàn phiên scenario. Stale hợp lệ được khôi phục với cảnh báo; file sai từ chối trước ghi.

Tối đa300 mục,10 retry/mục, hành động1–1000 ký tự; giới hạn Interview300 attempts/100 sessions/backup5 MB vẫn áp dụng. Không thêm HTTP endpoint, tài khoản, server persistence, upload timeline/queue/provider key hoặc media.

Chưa có SRS, due-date/reminder, tự phân loại lỗi ngữ nghĩa, tự động tạo kế hoạch học, lịch sử sửa kế hoạch hoặc dashboard mastery. AI live/chất lượng speech vẫn cần nghiệm thu riêng.
