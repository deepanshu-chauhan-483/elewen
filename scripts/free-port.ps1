# Free a dev port on Windows (e.g. when Strapi grabbed 5173)
param(
  [int]$Port = 5173
)

$lines = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
if (-not $lines) {
  Write-Host "Port $Port is free."
  exit 0
}

$pids = $lines | ForEach-Object {
  if ($_ -match '\s+(\d+)\s*$') { [int]$Matches[1] }
} | Sort-Object -Unique

foreach ($procId in $pids) {
  $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
  Write-Host "Stopping PID $procId ($($proc.ProcessName)) on port $Port..."
  taskkill /PID $procId /F | Out-Null
}

Write-Host "Port $Port should now be free."
