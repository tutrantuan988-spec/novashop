@echo off
REM ============================================
REM Cài đặt Git Hooks — TRỌNG ĐỊNH STORE (Windows)
REM Pattern from everything-claude-code
REM 
REM Chạy: .hooks\setup-hooks.bat
REM Hoặc: npm run setup:hooks
REM ============================================

echo [setup-hooks] Cài đặt Git Hooks cho TRỌNG ĐỊNH STORE...
echo.

if not exist ".git\hooks" (
    mkdir ".git\hooks"
    echo [OK] Tao thu muc .git\hooks
)

if exist ".hooks\pre-commit" (
    copy /Y ".hooks\pre-commit" ".git\hooks\pre-commit"
    echo [OK] Da cai dat: pre-commit
) else (
    echo [WARN] Khong tim thay: .hooks\pre-commit
)

if exist ".hooks\post-commit" (
    copy /Y ".hooks\post-commit" ".git\hooks\post-commit"
    echo [OK] Da cai dat: post-commit
) else (
    echo [WARN] Khong tim thay: .hooks\post-commit
)

echo.
echo [OK] Git hooks installed thanh cong!
echo     Chay tu dong khi git commit.
echo     Bo qua: git commit --no-verify
echo.
pause
