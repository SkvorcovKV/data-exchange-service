# clean_project.ps1
Write-Host "=== Cleaning project ===" -ForegroundColor Yellow

# Save working exe if needed
if (Test-Path "dist\app.exe") {
    Write-Host "Saving working exe to project root..." -ForegroundColor Cyan
    Copy-Item "dist\app.exe" "ent-exchange-service.exe" -Force
}

# Remove build folders
Write-Host "Removing build..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue

Write-Host "Removing dist..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue

Write-Host "Removing release..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "release" -ErrorAction SilentlyContinue

# Remove temporary files
Write-Host "Removing .spec files..." -ForegroundColor Cyan
Remove-Item -Force *.spec -ErrorAction SilentlyContinue

Write-Host "Removing .log files..." -ForegroundColor Cyan
Remove-Item -Force *.log -ErrorAction SilentlyContinue

Write-Host "Removing debug files..." -ForegroundColor Cyan
Remove-Item -Force debug_output.txt -ErrorAction SilentlyContinue
Remove-Item -Force simple_test.py -ErrorAction SilentlyContinue
Remove-Item -Force test_event.json -ErrorAction SilentlyContinue
Remove-Item -Force fatal_*.log -ErrorAction SilentlyContinue
Remove-Item -Force startup_debug.log -ErrorAction SilentlyContinue

# Remove old archives
Write-Host "Removing old archives..." -ForegroundColor Cyan
Remove-Item -Force *.zip -ErrorAction SilentlyContinue

Write-Host "=== Cleanup complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Remaining important files:" -ForegroundColor Green
Get-ChildItem -Exclude "venv", "web" | Select-Object Name