# 🚀 MCP Servers — Setup Guide

> Hướng dẫn cài đặt và cấu hình các MCP Servers cho dự án **TRỌNG ĐỊNH STORE**

---

## 📋 Danh sách MCP Servers

| Server | Mô tả | Cấu hình |
|--------|-------|----------|
| **github-mcp** | Quản lý GitHub repo, issues, PRs | `GITHUB_TOKEN` |
| **playwright-mcp** | Browser automation, E2E testing | Tự động |
| **context7** | Persistent context với Upstash Redis | `UPSTASH_REDIS_*` |
| **sequential-thinking** | Structured reasoning | Tự động |
| **filesystem** | File system access | `PROJECT_PATH` |
| **markitdown** | Convert PDF/DOCX/XLSX → Markdown | pipx install |

---

## 1️⃣ Cài đặt Dependencies

### Node.js Packages
```bash
# Playwright cho E2E testing
npm install --save-dev @playwright/test
npx playwright install chromium

# XLSX cho Excel import
npm install xlsx pdf-parse
```

### Python Packages (cho markitdown)
```bash
# Cài pipx (nếu chưa có)
pip install pipx

# Cài markitdown
pipx install markitdown

# Kiểm tra
markitdown --help
```

---

## 2️⃣ Cấu hình MCP Servers

### Cách 1: File `.mcp.json` (tự động)
File `.mcp.json` đã được tạo sẵn trong project. Các MCP client (Claude, Codebuff, Cursor) sẽ tự động đọc file này.

### Cách 2: Environment Variables
Tạo file `.env.local` với các biến sau:

```env
# === GitHub MCP ===
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# === Upstash Redis (context7) ===
# Đăng ký free tại: https://console.upstash.com/
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxx

# === Playwright MCP ===
# (tự động, không cần env)
```

### Cách 3: Claude Desktop Config
Windows: `%APPDATA%\Claude\claude_desktop_config.json`
macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7"],
      "env": {
        "UPSTASH_REDIS_REST_URL": "https://xxx.upstash.io",
        "UPSTASH_REDIS_REST_TOKEN": "xxx"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\TUAN TU\\OneDrive\\Desktop\\Website"]
    }
  }
}
```

---

## 3️⃣ Kiểm tra hoạt động

### GitHub MCP
```
Yêu cầu AI: "Hãy dùng github-mcp để tạo issue mới trong repo này với title 'Test MCP integration'"
```

### Playwright MCP
```bash
# Chạy E2E test
npx playwright test

# Chạy với UI mode
npx playwright test --ui

# Gen report
npx playwright show-report e2e/report
```

### Context7 (Upstash)
```
Yêu cầu AI: "Hãy dùng context7 để lưu context cho phiên làm việc này"
```

### Sequential Thinking
```
Yêu cầu AI: "Hãy dùng Sequential Thinking để phân tích vấn đề [mô tả]"
```

### MarkItDown
```bash
# Convert file
markitdown path/to/file.pdf > output.md
markitdown path/to/products.xlsx > products.md
markitdown path/to/image.jpg > image-content.md
```

---

## 4️⃣ Scripts trong package.json

Các scripts mới được thêm:

| Script | Lệnh | Mô tả |
|--------|------|-------|
| `test:e2e` | `npx playwright test` | Chạy E2E tests |
| `test:e2e:ui` | `npx playwright test --ui` | Chạy với UI mode |
| `test:e2e:report` | `npx playwright show-report e2e/report` | Xem report |
| `import:products` | `node server/utils/productImport.js` | Import sản phẩm |
| `import:template` | `node server/utils/productImport.js --generate-template` | Tạo template |
| `redis:check` | `node -e "require('./server/services/redis').getRedis().then(r => console.log('Redis OK:', !!r))"` | Kiểm tra Redis |

---

## 5️⃣ Upstash Redis Setup (Free)

1. **Đăng ký**: https://console.upstash.com/ (GitHub login)
2. **Tạo database**: 
   - Region: Singapore (gần VN nhất)
   - Tier: Free ($0)
3. **Lấy credentials**:
   - `UPSTASH_REDIS_REST_URL` → REST API URL
   - `UPSTASH_REDIS_REST_TOKEN` → REST API Token
4. **Cập nhật `.env.local`**:

```env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## 6️⃣ GitHub Token Setup

1. **Tạo token**: https://github.com/settings/tokens
2. **Quyền cần**:
   - `repo` (full control)
   - `workflow` (để trigger Actions)
   - `read:org` (nếu dùng organization)
3. **Cập nhật `.env.local`**:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

---

## 🎯 Lợi ích khi dùng MCP Servers

| Server | Lợi ích cho TRỌNG ĐỊNH STORE |
|--------|-------------------------------|
| **github-mcp** | Auto-commit, auto-create issues, quản lý code |
| **playwright-mcp** | Test thanh toán Stripe, test UI tự động |
| **context7** | Persistent context giữa các phiên làm việc |
| **sequential-thinking** | Debug phức tạp, thiết kế architecture |
| **filesystem** | Đọc/ghi file, quản lý codebase |
| **markitdown** | Import sản phẩm từ Excel/PDF, OCR hóa đơn |
