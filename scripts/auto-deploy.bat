@echo off
chcp 65001 >nul
title 🚀 TRỌNG ĐỊNH STORE - Auto Deploy
cd /d "%~dp0.."

echo ========================================
echo   🚀 AUTO DEPLOY - TRỌNG ĐỊNH STORE
echo ========================================
echo.

:: 1. Kiểm tra git
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Git chưa được cài đặt!
    pause
    exit /b 1
)

:: 2. Kiểm tra thay đổi
echo 📁 1. Kiểm tra thay đổi...
git status --short
echo.

:: 3. Nếu không có thay đổi thì thoát
git diff --quiet --cached
if %ERRORLEVEL% equ 0 (
    git diff --quiet
    if %ERRORLEVEL% equ 0 (
        echo ✅ Không có thay đổi. Deploy không cần thiết.
        pause
        exit /b 0
    )
)

:: 4. Add tất cả
echo 📦 2. Add files...
git add -A
if %ERRORLEVEL% neq 0 (
    echo ❌ Git add thất bại!
    pause
    exit /b 1
)
echo ✅ Add thành công
echo.

:: 5. Commit
echo 📝 3. Commit...
set /p commit_msg="Nhập commit message (Enter để dùng mặc định): "
if "%commit_msg%"=="" set commit_msg="auto-deploy: cap nhat tu dong"

git commit -m "%commit_msg%"
if %ERRORLEVEL% neq 0 (
    echo ❌ Commit thất bại!
    pause
    exit /b 1
)
echo ✅ Commit thành công
echo.

:: 6. Push
echo ☁️ 4. Push lên GitHub...
git push
if %ERRORLEVEL% neq 0 (
    echo ❌ Push thất bại! Kiểm tra kết nối mạng hoặc quyền truy cập.
    pause
    exit /b 1
)
echo ✅ Push thành công!
echo.

:: 7. Mở GitHub Actions
echo 🔍 5. Mở GitHub Actions...
start https://github.com/your-repo/actions

:: 8. Mở Netlify
echo 🌐 6. Mở Netlify...
start https://app.netlify.com/sites/trong-dinh-store

echo.
echo ========================================
echo   ✅ DEPLOY HOÀN TẤT!
echo   📊 Xem build: https://github.com/your-repo/actions
echo   🌐 Website: https://trong-dinh-store.netlify.app
echo ========================================
echo.

pause
