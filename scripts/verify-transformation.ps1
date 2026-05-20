# NOVASHOP TRANSFORMATION VERIFICATION
Write-Output "=== STEP 1: Check pet files deleted ==="
if (Test-Path "C:\Users\TUAN TU\OneDrive\Desktop\Website\src\pages\DogFoodPage.jsx") {
    Write-Output "FAIL: DogFoodPage.jsx still exists"
} else {
    Write-Output "PASS: DogFoodPage.jsx deleted"
}
if (Test-Path "C:\Users\TUAN TU\OneDrive\Desktop\Website\src\pages\CatFoodPage.jsx") {
    Write-Output "FAIL: CatFoodPage.jsx still exists"
} else {
    Write-Output "PASS: CatFoodPage.jsx deleted"
}
if (Test-Path "C:\Users\TUAN TU\OneDrive\Desktop\Website\src\pages\PetAccessoriesPage.jsx") {
    Write-Output "FAIL: PetAccessoriesPage.jsx still exists"
} else {
    Write-Output "PASS: PetAccessoriesPage.jsx deleted"
}
if (Test-Path "C:\Users\TUAN TU\OneDrive\Desktop\Website\src\data\products.js") {
    Write-Output "FAIL: products.js still exists"
} else {
    Write-Output "PASS: products.js deleted"
}
if (Test-Path "C:\Users\TUAN TU\OneDrive\Desktop\Website\src\data\categoryProducts.js") {
    Write-Output "FAIL: categoryProducts.js still exists"
} else {
    Write-Output "PASS: categoryProducts.js deleted"
}

Write-Output "`n=== STEP 2: Start server ==="
$logFile = "C:\Users\TUAN TU\OneDrive\Desktop\Website\server-verify.log"
$nodeExe = "C:\Program Files\nodejs\node.exe"
$serverScript = "C:\Users\TUAN TU\OneDrive\Desktop\Website\server\index.js"

# Kill any existing node servers first
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object { $_.Kill() }
Start-Sleep -Seconds 2

# Start fresh
$p = Start-Process -NoNewWindow -FilePath $nodeExe -ArgumentList $serverScript -RedirectStandardOutput $logFile -RedirectStandardError $logFile -PassThru
Write-Output "Server PID: $($p.Id)"
Start-Sleep -Seconds 8

Write-Output "`n=== STEP 3a: GET /api/categories ==="
try {
    $r = Invoke-RestMethod "http://localhost:3001/api/categories" -UseBasicParsing -TimeoutSec 5
    $r | ConvertTo-Json
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}

Write-Output "`n=== STEP 3b: GET /api/categories/:id/schema (Thời trang) ==="
try {
    $r = Invoke-RestMethod "http://localhost:3001/api/categories/ff0d5643-2246-441e-a0de-682159e813ff/schema" -UseBasicParsing -TimeoutSec 5
    $r | ConvertTo-Json -Depth 5
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}

Write-Output "`n=== STEP 3c: GET /api/categories/:id/schema (Điện tử) ==="
try {
    $r = Invoke-RestMethod "http://localhost:3001/api/categories/7a3702d2-73a5-46cc-9e6e-5a9907ac9bd9/schema" -UseBasicParsing -TimeoutSec 5
    $r | ConvertTo-Json -Depth 5
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}

Write-Output "`n=== STEP 3d: GET /api/categories/:id/schema (Thú cưng) ==="
try {
    $r = Invoke-RestMethod "http://localhost:3001/api/categories/8d2c556e-8b36-4df4-beb2-d1b77c73a69e/schema" -UseBasicParsing -TimeoutSec 5
    $r | ConvertTo-Json -Depth 5
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}

Write-Output "`n=== STEP 4: DynamicProductForm & AddProductPage check ==="
if (Test-Path "C:\Users\TUAN TU\OneDrive\Desktop\Website\src\components\DynamicProductForm.jsx") {
    Write-Output "PASS: DynamicProductForm.jsx exists"
} else {
    Write-Output "FAIL: DynamicProductForm.jsx missing"
}
if (Test-Path "C:\Users\TUAN TU\OneDrive\Desktop\Website\src\pages\AddProductPage.jsx") {
    Write-Output "PASS: AddProductPage.jsx exists"
} else {
    Write-Output "FAIL: AddProductPage.jsx missing"
}

Write-Output "`n=== Server log tail ==="
Get-Content $logFile -Tail 5

Write-Output "`n=== Cleaning up ==="
Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
Write-Output "DONE"
