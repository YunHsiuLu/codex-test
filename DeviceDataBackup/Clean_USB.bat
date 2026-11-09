@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Clean_USB.ps1"
set "result=%errorlevel%"
echo.
echo Exit code: %result%
pause
exit /b %result%
