
@echo off
setlocal
title Windows Wallpaper Setup

set "SCRIPT=%~dp0Set_Wallpaper.ps1"

if not exist "%SCRIPT%" (
    echo ERROR: PowerShell script not found.
    pause
    exit /b 1
)

:: Pass USB path through environment variable
set "WALLPAPER_USB_ROOT=%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"

if errorlevel 1 (
    echo.
    echo ERROR: Wallpaper setup failed.
) else (
    echo.
    echo Wallpaper setup completed.
)

echo.
pause
endlocal

