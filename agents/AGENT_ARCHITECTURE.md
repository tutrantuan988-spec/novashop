# 🧠 Enterprise Autonomous AI Agent Platform — Trọng Định Store

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                    🧠 SUPERVISOR AGENT                          │
│         Điều phối toàn bộ hệ thống đa tác nhân                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Analytics │  │   SEO    │  │  Content  │  │ Vietnam  │        │
│  │  Agent    │  │  Agent   │  │  Agent    │  │Geo Agent │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Recommend │  │Marketing │  │  Memory  │  │ DataPipe │        │
│  │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  Monitoring Agent │  │   Workflow Eng   │                     │
│  └──────────────────┘  └──────────────────┘                     │
├─────────────────────────────────────────────────────────────────┤
│                    🛠️  Infrastructure Layer                      │
│  Redis Queue │ Event Bus │ Memory Store │ Vector DB (Pinecone)   │
├─────────────────────────────────────────────────────────────────┤
│                    🌐  Backend API Layer                         │
│  Agent Routes │ Workflow Routes │ Vietnam Data │ Embeddings      │
├─────────────────────────────────────────────────────────────────┤
│                    🎨  Frontend Layer                            │
│  Agent Console │ Workflow Builder │ Vietnam Viewer │ Analytics   │
└─────────────────────────────────────────────────────────────────┘
```

## 10 Agent Chuyên Biệt

| # | Agent | Vai Trò |
|---|-------|---------|
| 1 | **SupervisorAgent** | Điều phối, routing task, phân quyền, retry |
| 2 | **MemoryAgent** | Short/long-term memory, context cache, vector search |
| 3 | **AnalyticsAgent** | Phân tích doanh thu, khách hàng, sản phẩm, dự báo |
| 4 | **SEOAgent** | Tối ưu meta, schema.org, sitemap, keyword research |
| 5 | **ContentAgent** | Tạo mô tả sản phẩm, blog, newsletter |
| 6 | **VietnamGeoAgent** | 63 tỉnh thành, quận huyện, logistics, shipping |
| 7 | **RecommendationAgent** | Gợi ý sản phẩm, cross-sell, up-sell |
| 8 | **MarketingAgent** | Campaign, promotion, email automation |
| 9 | **DataPipelineAgent** | Import/export sản phẩm, ETL, đồng bộ |
| 10 | **MonitoringAgent** | Health check, performance, cảnh báo |

## Agent Communication Protocol

Mỗi agent giao tiếp qua **EventBus** (pub/sub) với message format chuẩn:

```json
{
  "type": "agent.task",
  "from": "supervisor",
  "to": "analytics",
  "taskId": "uuid",
  "payload": {},
  "priority": "high|normal|low",
  "timestamp": "ISO8601"
}
```

## Memory Architecture (3-Tier)

1. **L1 - In-Memory** (30 phút TTL) — contextCache hiện tại
2. **L2 - Redis** (server-side caching + queues)
3. **L3 - Vector DB** (Pinecone) — semantic search

## Workflow Engine

Hỗ trợ 3 loại workflow:
- **Sequential** — chạy lần lượt từng agent
- **Parallel** — chạy đồng thời nhiều agent
- **Conditional** — rẽ nhánh dựa trên kết quả

## Security & Governance

- 🔐 Mỗi agent có scope permissions riêng
- ✅ Human approval gate cho actions nguy hiểm
- 📝 Audit log đầy đủ mọi hành động
- 🔄 Retry + rollback tự động khi fail
