# Deploy frontend lên Vercel

## Chẩn đoán deployment a1e4f8c

Log Vercel clone commit `a1e4f8c`, chạy xong trong 18ms và báo không có deployable output. Kiểm tra `git ls-tree --name-only a1e4f8c` trong workspace: commit này chỉ có README.md. Source code đang là file chưa được Git theo dõi; Vercel không nhận được chúng. Đây không phải lỗi biên dịch Vue.

## Đưa source lên GitHub

Từ thư mục repo, kiểm tra `git status --short`, rồi stage các source/config/docs/tests cần thiết và xem lại `git diff --cached --stat` cùng nội dung diff trước khi commit/push lên main. Không đưa private ZIP/raw feedback, .env, keys, node_modules, dist hoặc backend/target vào Git. .gitignore đã loại các đường dẫn thông dụng này, nhưng vẫn phải kiểm tra nội dung trước khi publish. Workspace chưa tự commit hoặc push.

Sau push, xác nhận GitHub có package.json, package-lock.json, index.html, src/, shared/, vite.config.ts, tsconfig.json và vercel.json. Redeploy commit mới, không redeploy lại a1e4f8c.

## Vercel Project Settings

- Root Directory: thư mục chứa package.json; với layout repo hiện tại là root (để trống), không phải tên thư mục workspace.
- Framework Preset: Vite.
- Node.js: 22.x (ít nhất 22.12).
- Install Command: npm ci.
- Build Command: npm run build.
- Output Directory: dist.

vercel.json khai báo framework/install/build/output để dùng thống nhất. Nếu Dashboard có override cũ, đưa về các giá trị trên. Log đúng phải có bước cài npm, vue-tsc và Vite build; kiểm tra deployment phục vụ giao diện và các assets không 404.

## Phạm vi frontend

Frontend guest/local-first chạy được không cần backend. Dữ liệu IndexedDB gắn với origin; đổi domain không tự chuyển dữ liệu, hãy export/import nếu cần.

Vercel static hosting không khởi chạy Spring Boot JAR trong backend/. Proxy /api trong vite.config.ts chỉ phục vụ dev/preview local. Muốn AI/Jisho live cần Java hosting riêng và cấu hình route /api tới backend đã bảo vệ phù hợp; chưa có cấu hình backend production trong increment này. Không đưa provider keys vào VITE_* hoặc frontend.

## Xác minh

Local production build được ghi trong ACCEPTANCE_TESTS.md. Remote Vercel deployment, URL thực, API production và provider live: NOT_RUN cho tới khi có deployment mới để kiểm tra.
