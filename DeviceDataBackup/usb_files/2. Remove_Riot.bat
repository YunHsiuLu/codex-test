
@echo off
setlocal EnableExtensions DisableDelayedExpansion
title CKSH Riot Cleanup

fltmc >nul 2>&1
if errorlevel 1 (
    echo Requesting administrator privileges...
    powershell.exe -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

set "RIOT_USB_ROOT=%~dp0"
set "SCRIPT=%~dp0Remove_Riot.ps1"

if not exist "%SCRIPT%" (
    echo ERROR: Remove_Riot.ps1 not found.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "RC=%ERRORLEVEL%"

echo.
echo Exit code: %RC%
echo Review the log in Logs\Riot.
pause
exit /b %RC%
