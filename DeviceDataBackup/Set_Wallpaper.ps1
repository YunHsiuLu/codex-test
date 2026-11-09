
$UsbRoot = $env:WALLPAPER_USB_ROOT

if ([string]::IsNullOrWhiteSpace($UsbRoot)) {
    $UsbRoot = $PSScriptRoot
}

$ErrorActionPreference = "Stop"

# Source and destination
$source = Join-Path $UsbRoot "Notice.jpg"
$targetDir = Join-Path $env:USERPROFILE "Pictures"
$target = Join-Path $targetDir "Notice.jpg"

# USB log directory
$logDir = Join-Path $UsbRoot "Logs\Wallpaper"
$logFile = Join-Path $logDir "$env:COMPUTERNAME.log"

# Local state file
$stateFile = Join-Path $targetDir "wallpaper_last_change.txt"

# Windows wallpaper cache directory
$cacheDir = Join-Path $env:APPDATA `
    "Microsoft\Windows\Themes\TranscodedWallpaperCached"

try {
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Notice.jpg not found on USB."
    }

    New-Item -ItemType Directory -Path $targetDir `
        -Force | Out-Null

    New-Item -ItemType Directory -Path $logDir `
        -Force | Out-Null

    # Read previous successful BAT change
    $previous = "No previous record"

    if (Test-Path -LiteralPath $stateFile) {
        $previous = (
            Get-Content -LiteralPath $stateFile -Raw
        ).Trim()
    }

    # ========================================
    # STEP 1: Collect wallpaper cache history
    # BEFORE changing the wallpaper
    # ========================================

    $scanTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $cacheLog = @()
    $cacheLog += "=== Wallpaper Cache Before Reset ==="
    $cacheLog += "Scan Time: $scanTime"
    $cacheLog += "Cache Directory: $cacheDir"

    if (Test-Path -LiteralPath $cacheDir -PathType Container) {

        $cacheFiles = @(
            Get-ChildItem -LiteralPath $cacheDir `
                -File -Recurse -ErrorAction Stop |
            Sort-Object LastWriteTime
        )

        if ($cacheFiles.Count -eq 0) {
            $cacheLog += "No cache files found."
        }
        else {
            $cacheLog += "Total Files: $($cacheFiles.Count)"
            $cacheLog += ""

            foreach ($file in $cacheFiles) {
                $cacheLog += "File: $($file.Name)"
                $cacheLog += "Full Path: $($file.FullName)"
                $cacheLog += "Created: $($file.CreationTime.ToString('yyyy-MM-dd HH:mm:ss'))"
                $cacheLog += "Last Modified: $($file.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))"
                $cacheLog += "Size: $($file.Length) bytes"
                $cacheLog += "----------------------------------------"
            }
        }
    }
    else {
        $cacheLog += "Wallpaper cache directory not found."
    }

    # Save cache evidence BEFORE wallpaper reset
    $preLog = @(
        ""
        "========================================"
        "Computer: $env:COMPUTERNAME"
        "User: $env:USERNAME"
        "Scan Time: $scanTime"
        "Previous BAT Change: $previous"
        ""
    ) + $cacheLog + @(
        ""
        "Wallpaper reset not yet performed."
        ""
    )

    Add-Content -LiteralPath $logFile `
        -Value $preLog -Encoding UTF8

    Write-Host "Wallpaper cache history saved."
    Write-Host "Files found: $($cacheFiles.Count)"

    # ========================================
    # STEP 2: Copy wallpaper
    # ========================================

    Copy-Item -LiteralPath $source `
        -Destination $target -Force

    # Wallpaper mode: Fit
    Set-ItemProperty `
        -Path "HKCU:\Control Panel\Desktop" `
        -Name "WallpaperStyle" `
        -Value "6"

    Set-ItemProperty `
        -Path "HKCU:\Control Panel\Desktop" `
        -Name "TileWallpaper" `
        -Value "0"

    # Background: Black
    Set-ItemProperty `
        -Path "HKCU:\Control Panel\Colors" `
        -Name "Background" `
        -Value "0 0 0"

    # ========================================
    # STEP 3: Apply wallpaper using Windows API
    # ========================================

    if (-not ("WallpaperAPI" -as [type])) {
        Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class WallpaperAPI
{
    [DllImport(
        "user32.dll",
        CharSet = CharSet.Unicode,
        SetLastError = true
    )]
    public static extern bool SystemParametersInfo(
        int action,
        int param,
        string value,
        int flags
    );
}
"@
    }

    $success = [WallpaperAPI]::SystemParametersInfo(
        20,
        0,
        $target,
        3
    )

    if (-not $success) {
        $win32Error = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
        throw "Windows failed to apply wallpaper. Error: $win32Error"
    }

    # ========================================
    # STEP 4: Save successful change time
    # ========================================

    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $entry = @"
=== Wallpaper Reset Result ===
Computer: $env:COMPUTERNAME
User: $env:USERNAME
Previous BAT Change: $previous
Current BAT Change: $now
Source: $source
Destination: $target
Wallpaper Mode: Fit
Background: Black
Result: SUCCESS
========================================

"@

    Add-Content -LiteralPath $logFile `
        -Value $entry -Encoding UTF8

    Set-Content -LiteralPath $stateFile `
        -Value $now -Encoding UTF8

    Write-Host ""
    Write-Host "Wallpaper updated successfully."
    Write-Host "Previous change: $previous"
    Write-Host "Current change: $now"
    Write-Host "Log: $logFile"
}
catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Line: $($_.InvocationInfo.ScriptLineNumber)"
    Write-Host "Command: $($_.InvocationInfo.Line)"
    Write-Host "USB Root: $UsbRoot"
    Write-Host "Source: $source"
    Write-Host "Target: $target"

    # Record failure if log directory is available
    try {
        if (Test-Path -LiteralPath $logDir) {
            $failureTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

            Add-Content -LiteralPath $logFile `
                -Value @(
                    "=== Wallpaper Setup Failure ==="
                    "Time: $failureTime"
                    "Error: $($_.Exception.Message)"
                    "Line: $($_.InvocationInfo.ScriptLineNumber)"
                    "Result: FAILED"
                    ""
                ) -Encoding UTF8
        }
    }
    catch {
        Write-Host "Could not write failure log."
    }

    exit 1
}

