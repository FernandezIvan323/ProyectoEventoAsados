$base = "C:\Users\USUARIO\Nueva carpeta\ProyectoAsado"
$logDir = "$base\logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

try {
  Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "$base\backend" -WindowStyle Hidden -RedirectStandardOutput "$logDir\backend.log" -RedirectStandardError "$logDir\backend.err"
  Write-Host "Backend started"
} catch { Write-Host "Backend error: $_" }

try {
  Start-Process -FilePath "cmd" -ArgumentList "/c cd /d `"$base\frontend`" && npx vite" -WindowStyle Hidden -RedirectStandardOutput "$logDir\frontend.log" -RedirectStandardError "$logDir\frontend.err"
  Write-Host "Frontend started"
} catch { Write-Host "Frontend error: $_" }
