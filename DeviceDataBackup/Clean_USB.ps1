# Windows PowerShell 5.1. Save beside Clean_USB.bat at the USB root.
$ErrorActionPreference = 'Stop'
$knownHashes = @(
    'FF3B2F5E22B5FE8897A076529F8231DB4F70B2FE8B034D590DDFF7408A90E384',
    'F49B71A7A364C8991D18E3F50328FD2BFF2B4CBD55C3E65F3FC03FD36A7AD60E'
)
$root = [IO.Path]::GetPathRoot($PSScriptRoot)
$log = Join-Path $PSScriptRoot ('USB-cleanup-{0}.log' -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
$started = $false
function Say([string]$message) { Write-Host ('[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $message) }
function Is-Link($item) { return (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) }
function Walk([string]$path) {
    foreach ($item in @(Get-ChildItem -LiteralPath $path -Force)) {
        if (Is-Link $item) { throw "Reparse point found; stopped to avoid following links: $($item.FullName)" }
        $item
        if ($item.PSIsContainer) { Walk $item.FullName }
    }
}
function Unhide($item) {
    $item.Attributes = $item.Attributes -band (-bnot ([IO.FileAttributes]::Hidden -bor [IO.FileAttributes]::System))
}
function Remove-KnownSamples([string]$path) {
    if (-not (Test-Path -LiteralPath $path)) { return }
    $base = Get-Item -LiteralPath $path -Force
    if (Is-Link $base) { throw "Refusing linked directory: $path" }
    foreach ($item in @(Walk $path)) {
        if (-not $item.PSIsContainer -and
            ($item.Name -like 'Safely_Open*.exe' -or $item.Name -eq 'CCleanerReactivator.dll')) {
            $hash = (Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash
            if ($hash -in $knownHashes) {
                Unhide $item
                Remove-Item -LiteralPath $item.FullName -Force
                Say "Deleted confirmed sample: $($item.FullName)"
            } else {
                throw "Unrecognized suspect file preserved; manual analysis required: $($item.FullName) SHA256=$hash"
            }
        }
    }
}
function Restore-Contents([string]$source, [string]$destination) {
    foreach ($item in @(Get-ChildItem -LiteralPath $source -Force)) {
        if (Is-Link $item) { throw "Refusing linked item: $($item.FullName)" }
        # Flatten only the underscore directories used by this sample.
        if ($item.PSIsContainer -and $item.Name -eq '_') {
            Restore-Contents $item.FullName $destination
            if (@(Get-ChildItem -LiteralPath $item.FullName -Force).Count -eq 0) {
                Remove-Item -LiteralPath $item.FullName -Force
            }
            continue
        }
        Unhide $item
        if ($item.PSIsContainer) { foreach ($child in @(Walk $item.FullName)) { Unhide $child } }
        $target = Join-Path $destination $item.Name
        $counter = 1
        while (Test-Path -LiteralPath $target) {
            $target = Join-Path $destination ('{0}.recovered-{1}{2}' -f
                [IO.Path]::GetFileNameWithoutExtension($item.Name), $counter, [IO.Path]::GetExtension($item.Name))
            $counter++
        }
        Move-Item -LiteralPath $item.FullName -Destination $target
        Say "Restored: $target"
    }
}
try {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Right-click Clean_USB.bat and choose Run as administrator. Use the affected user account.'
    }
    if ($PSScriptRoot.TrimEnd('\') -ne $root.TrimEnd('\')) {
        throw 'Copy BOTH cleaner files to the USB drive ROOT, then run Clean_USB.bat there.'
    }
    $drive = Get-CimInstance Win32_LogicalDisk -Filter ("DeviceID='{0}'" -f $root.Substring(0,2))
    if (-not $drive -or $drive.DriveType -notin @(2,3) -or
        $root.Substring(0,2) -eq $env:SystemDrive) { throw 'Invalid USB/data drive.' }
    Start-Transcript -LiteralPath $log | Out-Null
    $started = $true
    Say "Target drive: $root ; current account: $($identity.Name)"
    $install = Join-Path $env:ProgramData 'DeviceDataBackup'
    # Inspect all processes, including renamed hosts with this DLL loaded.
    foreach ($process in @(Get-Process)) {
        $matched = $false
        try {
            if ($process.ProcessName -like 'Safely_Open*') { $matched = $true }
            elseif ($process.Path -and $process.Path.StartsWith($install + '\', [StringComparison]::OrdinalIgnoreCase)) {
                $matched = $true
            } else {
                foreach ($module in $process.Modules) {
                    if ($module.ModuleName -eq 'CCleanerReactivator.dll' -and
                        (Get-FileHash -LiteralPath $module.FileName -Algorithm SHA256).Hash -in $knownHashes) {
                        $matched = $true; break
                    }
                }
            }
        } catch { Say "Could not fully inspect PID $($process.Id): $($_.Exception.Message)" }
        if ($matched) {
            Stop-Process -Id $process.Id -Force
            if (-not $process.WaitForExit(5000)) { throw "Process did not exit: $($process.Id)" }
            Say "Stopped PID $($process.Id): $($process.ProcessName)"
        }
    }
    # Remove only SafelySoft values pointing at the identified payload, for loaded user hives.
    foreach ($hive in @(Get-ChildItem Registry::HKEY_USERS)) {
        $key = 'Registry::{0}\Software\Microsoft\Windows\CurrentVersion\Run' -f $hive.Name
        if (Test-Path -LiteralPath $key) {
            $entry = Get-ItemProperty -LiteralPath $key
            if ($entry.PSObject.Properties.Name -contains 'SafelySoft') {
                $value = [string]$entry.SafelySoft
                if ($value -like '*DeviceDataBackup\Safely_Open_Your_USB_Files.exe*') {
                    Remove-ItemProperty -LiteralPath $key -Name SafelySoft
                    Say "Removed startup entry: $key ; $value"
                } else { Say "Preserved unrecognized SafelySoft value: $key ; $value" }
            }
        }
    }
    Remove-KnownSamples $install
    # Do not recursively delete ProgramData: it may contain user data.
    if (Test-Path -LiteralPath $install) {
        if (@(Get-ChildItem -LiteralPath $install -Force).Count -eq 0) {
            Remove-Item -LiteralPath $install -Force
        } else { Say "Remaining files preserved in $install" }
    }
    # Restrict USB traversal to the root files and the sample's storage directory.
    $backup = Join-Path $root 'DeviceDataBackup'
    foreach ($item in @(Get-ChildItem -LiteralPath $root -File -Force)) {
        if ($item.Name -like 'Safely_Open*.exe' -or $item.Name -eq 'CCleanerReactivator.dll') {
            if (Is-Link $item) { throw "Refusing linked file: $($item.FullName)" }
            $hash = (Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash
            if ($hash -notin $knownHashes) { throw "Unrecognized suspect file preserved: $($item.FullName)" }
            Unhide $item
            Remove-Item -LiteralPath $item.FullName -Force
            Say "Deleted confirmed sample: $($item.FullName)"
        }
    }
    Remove-KnownSamples $backup
    if (Test-Path -LiteralPath $backup) {
        Restore-Contents $backup $root
        if (@(Get-ChildItem -LiteralPath $backup -Force).Count -eq 0) {
            Remove-Item -LiteralPath $backup -Force
        }
    }
    Say 'Cleanup finished. Review the log. This is a targeted cleaner, not a full-system malware scan.'
    exit 0
} catch {
    Write-Host "STOPPED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    if ($started) { Stop-Transcript | Out-Null }
}
