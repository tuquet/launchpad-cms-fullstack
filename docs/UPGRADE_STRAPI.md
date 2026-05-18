## 🚨 LƯU Ý BẮT BUỘC TRƯỚC KHI LÀM

- **Backup (Sao lưu):** Luôn sao lưu toàn bộ mã nguồn (codebase) và cơ sở dữ liệu (database) trước khi chạy lệnh.
- **Phạm vi hỗ trợ:** Công cụ này chỉ tự động cập nhật dependency (thư viện) và tự động sửa code cũ theo chuẩn mới (codemods). Nó **KHÔNG** tự chuyển đổi dữ liệu database (do hệ thống DB migration của Strapi tự lo) và **KHÔNG** tự di chuyển cấu trúc thư mục file.

---

## 💻 CÁC LỆNH UPGRADE CHÍNH

Tùy thuộc vào phiên bản bạn muốn hướng tới, hãy chọn 1 trong các lệnh sau (chạy trực tiếp tại thư mục gốc của dự án):

### 1. Cập nhật Patch (Sửa lỗi - Ví dụ: v4.25.1 $\rightarrow$ v4.25.9)

Cập nhật lên phiên bản vá lỗi mới nhất của bản Minor hiện tại.

```bash
npx @strapi/upgrade patch

```

### 2. Cập nhật Minor (Tính năng mới - Ví dụ: v4.14.1 $\rightarrow$ v4.25.9)

Cập nhật lên bản có tính năng mới nhất trong cùng một đời Major.

```bash
npx @strapi/upgrade minor

```

### 3. Cập nhật Major (Lên đời phiên bản - Ví dụ: v4.25.9 $\rightarrow$ v5.0.0)

Nâng cấp hẳn lên phiên bản lớn tiếp theo (ví dụ từ v4 lên v5).

```bash
npx @strapi/upgrade major

```

> ⚠️ **Lưu ý quy trình 2 bước:** Bạn **không thể** nhảy cóc từ một bản v4 quá cũ (ví dụ v4.14.1) thẳng lên v5. Bạn bắt buộc phải chạy `npx @strapi/upgrade minor` để lên bản v4 mới nhất trước, sau đó mới chạy lệnh `major`.

### 4. Cập nhật thẳng lên bản mới nhất (Latest)

Tự động đưa dự án lên phiên bản Strapi mới nhất hiện tại (sẽ có cảnh báo xác nhận nếu có nhảy đời Major).

```bash
npx @strapi/upgrade latest

```

---

## 🛠️ CÁC TÙY CHỌN MỞ RỘNG (OPTIONS) HỮU ÍCH

Bạn có thể đính kèm các flag sau vào sau lệnh chính để kiểm soát quá trình:

- **Chạy thử nghiệm (Dry Run):** Thử nghiệm xem code sẽ thay đổi thế nào mà **không** thực sự ghi đè file hay cài đặt lại thư viện (rất nên dùng để check trước).

```bash
npx @strapi/upgrade major --dry

```

- **Tự động đồng ý (`-y` hoặc `--yes`):** Bỏ qua các câu hỏi xác nhận của hệ thống.

```bash
npx @strapi/upgrade minor -y

```

- **Bật nhật ký Debug (`-d` hoặc `--debug`):** Xem log chi tiết nếu quá trình upgrade gặp lỗi.

````bash
    npx @strapi/upgrade major --debug
    ```
*   **Chỉ định thư mục dự án (`-p`):** Nếu bạn không đứng ở thư mục gốc của Strapi.

```bash
    npx @strapi/upgrade patch -p /đường/dẫn/đến/folder/strapi
    ```

---

## 🔄 CHỈ CHẠY CODEMODS (SỬA CODE, KHÔNG ĐỔI VERSION THƯ VIỆN)
Nếu bạn chỉ muốn áp dụng các đoạn script tự động sửa code cũ theo chuẩn mới mà không muốn cập nhật file `package.json`:

*   Xem danh sách các codemods có sẵn: `npx @strapi/upgrade codemods ls`
*   Chọn và chạy từ danh sách: `npx @strapi/upgrade codemods run`

**Sau khi tool chạy xong:** Hãy luôn kiểm tra lại (Review) các file đã bị chỉnh sửa bằng Git trước khi khởi chạy (`npm run develop`) lại ứng dụng!

````
