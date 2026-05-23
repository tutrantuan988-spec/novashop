# Sequential Thinking — MCP Template

> Hướng dẫn sử dụng **Sequential Thinking MCP Server** cho development workflow của TRỌNG ĐỊNH STORE.
> Dùng để giải quyết các vấn đề phức tạp theo từng bước có cấu trúc.

---

## 📋 Template 1: Debug Lỗi

```
1. XÁC ĐỊNH VẤN ĐỀ
   - Bug là gì? (mô tả ngắn gọn)
   - Khi nào xảy ra? (step to reproduce)
   - Môi trường? (dev/prod, browser, device)

2. THU THẬP THÔNG TIN
   - Log lỗi
   - Network requests
   - Console errors
   - File liên quan

3. PHÂN TÍCH NGUYÊN NHÂN
   - Hypothesis A: ...
   - Hypothesis B: ...
   - Evidence cho từng hypothesis

4. GIẢI PHÁP
   - Solution 1: ... (ưu/nhược điểm)
   - Solution 2: ... (ưu/nhược điểm)

5. IMPLEMENT
   - Chọn giải pháp tốt nhất
   - Code changes
   - Test

6. VERIFY
   - Bug đã fix chưa?
   - Có side effects không?
   - Cần thêm test không?
```

## 📋 Template 2: Thiết Kế Tính Năng Mới

```
1. REQUIREMENTS
   - User story
   - Acceptance criteria
   - Constraints

2. CURRENT ARCHITECTURE
   - File structure hiện tại
   - Data flow
   - Integrations

3. DESIGN OPTIONS
   - Option A: ...
   - Option B: ...
   - Option C: ...

4. EVALUATION
   - Pros/Cons
   - Effort estimate
   - Risk assessment

5. IMPLEMENTATION PLAN
   - Step 1: ...
   - Step 2: ...
   - Step 3: ...

6. REVIEW
   - Code review
   - Performance impact
   - Security implications
```

## 📋 Template 3: Debug Inventory (P3-style)

```
Vấn đề: Race condition trong inventory transaction

Branch 1: Giải pháp hiện tại
  → Dùng reserveInventory/releaseInventory
  → Firestore transaction
  → Webhook idempotency

Branch 2: Vấn đề còn lại
  → Concurrent requests vượt quá stock
  → Network timeout khi reserve
  → Không release khi order expired

Branch 3: Cải tiến
  → Optimistic locking với version field
  → Queuing với BullMQ/Redis
  → Dead letter queue cho failed transactions

Kết luận: Chọn optimistic locking + Redis queue
```

## 📋 Template 4: Migration từ Firebase → PostgreSQL

```
Step 1: Đánh giá dữ liệu hiện tại
  - Firebase collections
  - Document structures
  - Data volume

Step 2: Map schema
  - Firebase field → PostgreSQL column
  - Relations
  - Indexes

Step 3: Export từ Firebase
  - Script export
  - Data validation
  - Backup

Step 4: Import vào PostgreSQL
  - Transform data
  - Import với Prisma
  - Validate data integrity

Step 5: Cut-over
  - Feature flag
  - Dual-write
  - Switch
```

---

## 🚀 Cách dùng với MCP

Khi cần giải quyết vấn đề phức tạp, hãy yêu cầu:

> "Hãy dùng Sequential Thinking để phân tích và giải quyết vấn đề [mô tả vấn đề]"

AI sẽ tự động:
1. Chia vấn đề thành các bước nhỏ
2. Phân tích từng nhánh
3. Đánh giá các lựa chọn
4. Đưa ra kết luận và implementation plan
