# Script khởi động toàn bộ hệ thống Cinema Ticket Booking (MongoDB + Spring Boot BE + Vite FE)
$ErrorActionPreference = "Continue"

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mongoDataDir = Join-Path $rootDir ".mongodb-data"
$mongodExe = "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
$mvnCmd = "C:\Users\ADMIN\.m2\wrapper\dists\apache-maven-3.9.14\ed7edd442f634ac1c1ef5ba2b61b6d690b5221091f1a8e1123f5fadcc967520d\bin\mvn.cmd"

if (-not (Test-Path $mongoDataDir)) {
    New-Item -ItemType Directory -Path $mongoDataDir -Force | Out-Null
}

Write-Host "1. Kiểm tra và khởi động MongoDB trên cổng 27017..." -ForegroundColor Cyan
$mongoPort = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
if (-not $mongoPort) {
    Start-Process -FilePath $mongodExe -ArgumentList "--dbpath `"$mongoDataDir`" --port 27017 --bind_ip 127.0.0.1" -WindowStyle Minimized
    Start-Sleep -Seconds 3
    Write-Host "   -> Đã khởi động MongoDB (mongodb://localhost:27017/cinema_booking_db)" -ForegroundColor Green
} else {
    Write-Host "   -> MongoDB đang chạy ở cổng 27017." -ForegroundColor Green
}

Write-Host "2. Khởi động Backend Spring Boot ở cổng 8080..." -ForegroundColor Cyan
$beJar = Join-Path $rootDir "cinema-booking-be\target\cinema-booking-be-1.0.0.jar"
if (Test-Path $beJar) {
    Start-Process -FilePath "java" -ArgumentList "-jar `"$beJar`"" -WorkingDirectory (Join-Path $rootDir "cinema-booking-be") -WindowStyle Minimized
} else {
    Start-Process -FilePath $mvnCmd -ArgumentList "spring-boot:run" -WorkingDirectory (Join-Path $rootDir "cinema-booking-be") -WindowStyle Minimized
}

Write-Host "3. Khởi động Frontend Vite ở cổng 3000..." -ForegroundColor Cyan
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory (Join-Path $rootDir "FE") -WindowStyle Minimized

Write-Host "Hoàn tất! Hệ thống đang chạy tại:" -ForegroundColor Yellow
Write-Host " - MongoDB:    mongodb://localhost:27017/cinema_booking_db"
Write-Host " - Backend:    http://localhost:8080/swagger-ui.html"
Write-Host " - Frontend:   http://localhost:3000"

