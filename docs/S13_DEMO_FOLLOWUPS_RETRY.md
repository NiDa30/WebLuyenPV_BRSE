# S13 — Phản biện kỹ thuật và luyện lại Demo

## Luồng chạy được

Lượt Demo DONE + nội dung đã lưu → chọn một trong3 câu hỏi cố định (vai trò, đánh đổi kỹ thuật, kết quả/cách kiểm chứng) → tự nhập trả lời → lưu → self-review bằng quote và hướng sửa → hoàn tất3 trả lời hiện hành → tạo lượt Demo GUIDED hoặc INDEPENDENT → timer/bài trình bày/trả lời mới trống → hoàn tất lượt mới → đối chiếu bản chụp bài cũ và câu trả lời mới.

Nội dung/câu hỏi tự biên soạn, không phải AI thích ứng, chưa được hiệu chuẩn. Không ghi âm, không tự xác minh claims. Không có điểm năng lực, tổng điểm, kết luận tiến bộ hoặc timestamp âm thanh. Không bắt buộc review trước retry; điều kiện3 câu trả lời là hoàn thành thao tác lưu, không chứng nhận chất lượng.

## Evidence và thay đổi nguồn

Mỗi trả lời thuộc criterion role/tradeoff/outcome, text1–8000 ký tự (trim), version và sourceVersion của bài trình bày. Một review/answer với quote/next1–2000, quote phải là substring của text đã lưu và version bằng answer.version. `demo-qa-self-v1` là self-review cố định, không phải AI.

Sửa câu trả lời tăng version và bỏ review câu đó; lưu lại cùng text/nguồn giữ review. Sửa bài trình bày tăng source version, xóa review bài trình bày như S12, giữ câu trả lời/review cũ với nhãn lỗi thời. Review mới/retry khóa cho đến khi các câu trả lời được kiểm tra và lưu lại theo sourceVersion hiện hành; lưu lại kể cả cùng text sau đổi nguồn cũng tăng answer.version và xóa review cũ. Xóa text bài trình bày vẫn giữ trả lời cũ dưới dạng lỗi thời, chưa được review/luyện lại cho đến khi khôi phục nội dung hiện hành.

## Retry snapshot và đối chiếu

Chỉ tạo retry từ lượt DONE có text và3 trả lời hiện hành, tối đa50lượt và1lượt timer chưa kết thúc như S12. Lượt con cùng tên dự án; không copy bài/câu trả lời vào nội dung mới. `retry` lưu parentId, mode và baseline snapshot gồm version/text/reviews/followups của lượt gốc; không lồng chuỗi snapshot sâu. Baseline giữ nguyên sau sửa nguồn. UI phát hiện nguồn khác snapshot, báo so sánh bản cũ; đây là phát hiện thay đổi dữ liệu local, không phải xác minh chữ ký hay nguồn tin cậy.

GUIDED hiện bài cũ/trả lời/hướng sửa cũ. INDEPENDENT không render nội dung baseline/hints cho đến khi lượt con DONE có text và3 trả lời hiện hành; sau khi sửa bài gây stale, baseline lại ẩn. Người học vẫn có thể chủ động mở lịch sử của chính mình; đây là cơ chế luyện tập, không phải kiểm soát thi/gian lận. Sau hoàn tất, đối chiếu từng câu cũ/mới bằng text gốc, không suy ra điểm/tiến bộ.

## Local data và tương thích

Không HTTP mới, không thay DB version: `brse-demo`v1/store`state`/key`current`, `BRSE_DEMO_BACKUP` schemaVersion1 mở rộng followups optional(default[]) và retry optional. Load/import cũ chuẩn hóa và giữ timer/text/reviews. Các tham chiếu parent phải tồn tại, DONE, cùng tên, không ở tương lai so với child.createdAt; baseline.version<=parent.version. Chặn ID tự tham chiếu/vòng lặp và schema/evidence không hợp lệ trước write. Dữ liệu backup là tự khai, không xác minh lịch sử sửa đã bị thay thế ở nguồn.

Giới hạn5MB UTF8, import thay riêng Demo sau validation/confirm, write atomic và cập nhật UI sau thành công. JSON chưa mã hóa, export chỉ chứa bản đã lưu; chuyển câu/lượt/rời trang có thể bỏ nháp, có hướng dẫn lưu rõ ràng. Không đồng bộ nhiều tab. Không đặt nội dung bí mật vào bài tập.

## Còn thiếu

Portfolio/repo reference, phản biện thích ứng, AI/voice thật, so sánh được kiểm định, lịch sử revision đầy đủ và dashboard Demo chưa triển khai. M11 vẫn có một phần; không tính3 câu phản tư là phân hệ Technical Interview chuyên sâu M10 hoàn tất.
