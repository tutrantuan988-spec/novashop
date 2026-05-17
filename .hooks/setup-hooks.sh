#!/bin/bash
# ============================================
# Cài đặt Git Hooks — TRỌNG ĐỊNH STORE
# Pattern from everything-claude-code
# 
# Chạy: bash .hooks/setup-hooks.sh
# Hoặc (Windows): .hooks\setup-hooks.bat
# ============================================

echo "🔗 Cài đặt Git Hooks cho TRỌNG ĐỊNH STORE..."

HOOKS_DIR=".git/hooks"
SOURCE_DIR=".hooks"

# Tạo .git/hooks nếu chưa có
mkdir -p "$HOOKS_DIR"

# Copy hooks và set executable
for hook in pre-commit post-commit; do
    if [ -f "$SOURCE_DIR/$hook" ]; then
        cp "$SOURCE_DIR/$hook" "$HOOKS_DIR/$hook"
        chmod +x "$HOOKS_DIR/$hook"
        echo "  ✅ Installed: $hook"
    else
        echo "  ⚠️  Skipped: $hook (file not found)"
    fi
done

echo ""
echo "✅ Git hooks installed successfully!"
echo "   They will run automatically on git commit."
echo "   To bypass hooks: git commit --no-verify"
