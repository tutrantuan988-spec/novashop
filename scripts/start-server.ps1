Remove-Item -Path "C:\Users\TUAN TU\OneDrive\Desktop\Website\server.log" -Force -ErrorAction SilentlyContinue
$logFile = "C:\Users\TUAN TU\OneDrive\Desktop\Website\server.log"
$nodeExe = "C:\Program Files\nodejs\node.exe"
$script = "C:\Users\TUAN TU\OneDrive\Desktop\Website\server\index.js"

$p = Start-Process -NoNewWindow -FilePath $nodeExe -ArgumentList $script -PassThru
Write-Output "PID: $($p.Id)"

Start-Sleep -Seconds 12

Write-Output "=== PORT CHECK ==="
netstat -ano | findstr :3001
