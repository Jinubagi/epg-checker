@echo off
echo.
echo  EPG 검수 앱 시작 중...
echo.
cd /d "%~dp0"

:: 패키지 설치 여부 확인
if not exist node_modules (
  echo  패키지 설치 중 (최초 1회)...
  npm install
  echo.
)

echo  브라우저에서 열기: http://localhost:3000
echo  종료하려면 이 창을 닫으세요.
echo.
node server.js
pause
