# 🚀 AI Content Seeding (Tóm tắt nhanh)

Tài liệu này hướng dẫn cách thay thế toàn bộ nội dung CMS bằng dữ liệu do AI tạo ra thông qua các file CSV và REST API của Strapi v5.

## 🎯 3 Bước Thực Hiện Nhanh

**Bước 1: Nhờ AI tạo file CSV**
Yêu cầu ChatGPT/Claude tạo nội dung cho các bảng (Categories, Products, Plans, FAQs, Testimonials, Articles) và lưu thành các file `.csv` tương ứng vào thư mục `strapi/scripts/seed-data/`. (Xem template mẫu có sẵn trong thư mục đó).

**Bước 2: Cấp quyền API Token**
1. Vào Strapi Admin (`http://localhost:1337/admin`) > **Settings** > **API Tokens**.
2. Bấm **Create new token**, chọn Type là **Full access**.
3. Mở file `strapi/.env`, thêm dòng sau:
   ```env
   STRAPI_ADMIN_TOKEN=copy_token_cua_ban_vao_day
   ```

**Bước 3: Chạy Script**
Mở terminal, di chuyển vào thư mục `strapi/` và chạy:
```bash
node scripts/seed-from-csv.mjs
```
Script sẽ tự động đọc CSV, xử lý tuần tự (phụ thuộc relation) và đẩy dữ liệu vào Strapi một cách chuẩn xác nhất.

---

## 📸 Q&A: Vấn đề xử lý Hình Ảnh (Image Upload)

**Q: Cột `image_url` (link Unsplash) trong file CSV có tự động hiển thị lên website không?**
**A:** KHÔNG. Cột `image_url` trong CSV hiện tại chỉ mang tính chất *tham khảo (placeholder)*. Strapi yêu cầu hình ảnh phải được lưu trữ dưới dạng File Entity (quản lý qua Media Library) và cấp một `documentId` riêng, sau đó mới link ID đó vào bài viết/sản phẩm.

**Q: Vậy làm sao để AI sinh ra ảnh và gán thẳng vào bài viết tự động?**
**A:** Rất tiếc, điều này đòi hỏi một luồng xử lý cực kỳ phức tạp (Script phải tải ảnh từ URL ngoài về máy -> Gửi qua API `/api/upload` của Strapi -> Lấy ID ảnh -> Gán ngược lại vào Product/Article). Ở phiên bản Seeder hiện tại, chúng ta chưa tích hợp luồng tải ảnh tự động này để giữ cho script chạy nhanh và ổn định.

**Q: Cách giải quyết nhanh nhất là gì?**
**A:** Theo Best Practice của Frontend Architect:
1. Chạy lệnh seed CSV để toàn bộ text/content được đẩy lên Strapi trước.
2. Cấu hình Frontend Next.js: Ở những chỗ không có ảnh trả về từ API, hãy render một ảnh **Fallback UI** (ví dụ: Logo mờ, biểu tượng placeholder, hoặc random 1 ảnh từ mảng Unsplash tĩnh ở code Frontend) để giao diện không bị vỡ.
3. Chỉnh sửa thủ công: Developer/Content Editor vào Strapi Admin, upload ảnh thật qua Media Library và gán vào bài viết.

**Q: Nếu tôi muốn nâng cấp hệ thống để hỗ trợ link ảnh ngoài (External URL) thì sao?**
**A:** Bạn không cần upload qua Strapi nữa. Hãy vào schema của Strapi (VD: `product/schema.json`), đổi field `image` từ kiểu **Media** sang kiểu **String** (Text). Lúc này, Strapi chỉ lưu một đoạn chuỗi URL ảnh. Trên Frontend Next.js, bạn dùng thẻ `<img src={product.image} />` (Nhớ cấu hình `remotePatterns` trong `next.config.mjs` cho phép domain của ảnh). Đây là cách làm nhanh nhất khi chơi với AI!
