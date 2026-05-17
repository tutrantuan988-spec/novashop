#!/bin/bash
# 🚀 AUTO DEPLOY - TRỌNG ĐỊNH STORE (Unix/Git Bash version)
# Dùng: bash scripts/auto-deploy.sh

set -e

echo "========================================"
echo "  🚀 AUTO DEPLOY - TRỌNG ĐỊNH STORE"
echo "========================================"
echo ""

cd "$(dirname "$0")/.."

# 1. Kiểm tra git
if ! command -v git &> /dev/null; then
    echo "❌ Git chưa được cài đặt!"
    exit 1
fi

# 2. Kiểm tra thay đổi
echo "📁 1. Kiểm tra thay đổi..."
git status --short
echo ""

if git diff --quiet && git diff --cached --quiet; then
    echo "✅ Không có thay đổi. Deploy không cần thiết."
    exit 0
fi

# 3. Add
echo "📦 2. Add files..."
git add -A
echo "✅ Add thành công"
echo ""

# 4. Commit
echo "📝 3. Commit..."
DEFAULT_MSG="auto-deploy: $(date '+%Y-%m-%d %H:%M')"
read -p "Nhập commit message (Enter để dùng mặc định): " commit_msg
commit_msg="${commit_msg:-$DEFAULT_MSG}"

git commit -m "$commit_msg"
echo "✅ Commit thành công"
echo ""

# 5. Push
echo "☁️ 4. Push lên GitHub..."
git push
echo "✅ Push thành công!"
echo ""

# 6. Mở GitHub Actions
echo "🔍 5. Mở GitHub Actions..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://github.com/$(git config --get remote.origin.url | sed 's/.*:\(.*\)\.git/\1/')/actions"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    start "https://github.com/$(git config --get remote.origin.url | sed 's/.*:\(.*\)\.git/\1/')/actions"
fi

echo ""
echo "========================================"
echo "  ✅ DEPLOY HOÀN TẤT!"
echo "  🌐 https://trong-dinh-store.netlify.app"
echo "========================================"
echo ""
