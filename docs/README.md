# 📚 LaunchPad CMS Fullstack - Tài liệu & Workflows

Chào mừng bạn đến với trung tâm tài liệu của dự án LaunchPad. Tại đây, mọi quy trình từ phát triển (Development) đến triển khai (Deployment) đều được chuẩn hóa thành các Workflow rõ ràng, dễ hiểu và áp dụng theo tiêu chuẩn B2B SaaS Enterprise.

## 🧭 Danh sách Quy trình (Workflows)

Vui lòng đọc các tài liệu dưới đây theo thứ tự nếu bạn là người mới tiếp cận dự án:

1. 💻 **[Workflow 1: Development (Quy trình Phát triển Local)](./1-development-workflow.md)**
   - Hướng dẫn thiết lập môi trường máy cá nhân.
   - Các công cụ (Yarn, Docker, VS Code Tasks) để khởi động song song Backend và Frontend cực nhanh.
   - Cách xử lý lỗi thường gặp khi code ở môi trường Local.

2. 🚀 **[Workflow 2: VPS Deployment (Quy trình Triển khai Production)](./2-vps-deployment-workflow.md)**
   - Kiến trúc Zero-Build trên VPS (Tối ưu cho Server cấu hình thấp).
   - Quy trình đóng gói (Docker Build & Push) an toàn.
   - Cách cấu hình hạ tầng Nginx, SSL và xử lý cập nhật không gián đoạn (Zero-Downtime Update).

---
*Lưu ý: Các quy trình này đã được tích hợp chặt chẽ với các công cụ tự động hóa trong VS Code Tasks (`.vscode/tasks.json`) và Docker Compose để giảm thiểu tối đa rủi ro sai sót thao tác bằng tay (Human Error).*
