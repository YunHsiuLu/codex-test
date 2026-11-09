
$ErrorActionPreference = "Stop"

$root = $env:RIOT_USB_ROOT
if ([string]::IsNullOrWhiteSpace($root)) {
    $root = $PSScriptRoot
}

$logDir = Join-Path $root "Logs\Riot"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$stamp = Get-Date -Format "yyyyMMdd_HHmmss_fff"
$logFile = Join-Path $logDir "$env:COMPUTERNAME`_$stamp.log"

# Track failures
$script:failed = 0
$script:removed = 0
$script:recorded = 0

function Log {
    param([string]$Message)

    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"

    Write-Host $line

    # Stop immediately if USB logging fails
    Add-Content -LiteralPath $logFile `
        -Value $line -Encoding UTF8 -ErrorAction Stop
}

function Get-RiotProcesses {
    @(
        Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -match '(?i)^(Riot.*|VALORANT.*|LeagueClient.*|League of Legends.*|vgtray\.exe|vgc\.exe)$' -or
            (
                $_.ExecutablePath -and
                $_.ExecutablePath -match '(?i)\\(Riot Games|Riot Vanguard|VALORANT|League of Legends)\\'
            )
        }
    )
}

function Stop-RiotProcesses {
    Log "[STOP RIOT PROCESSES]"

    for ($attempt = 1; $attempt -le 5; $attempt++) {
        $running = @(Get-RiotProcesses)

        if ($running.Count -eq 0) {
            return $true
        }

        foreach ($proc in $running) {
            Log "STOP: $($proc.Name) PID=$($proc.ProcessId)"

            try {
                Stop-Process -Id $proc.ProcessId `
                    -Force -ErrorAction Stop
            }
            catch {
                Log "FAILED TO STOP: $($proc.Name) $($_.Exception.Message)"
            }
        }

        Start-Sleep -Seconds 2
    }

    $remaining = @(Get-RiotProcesses)

    if ($remaining.Count -gt 0) {
        foreach ($proc in $remaining) {
            Log "STILL RUNNING: $($proc.Name) PID=$($proc.ProcessId)"
        }
        return $false
    }

    return $true
}

function Get-RiotApps {
    $paths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )

    @(
        Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue |
        Where-Object {
            $_.DisplayName -match '(?i)Riot Client|Riot Games|VALORANT|Riot Vanguard|League of Legends'
        } |
        Sort-Object PSPath -Unique
    )
}

function Get-TargetDirectories {
    $paths = @(
        "C:\Riot Games"
        "C:\Program Files\Riot Games"
        "C:\Program Files (x86)\Riot Games"
        "C:\Program Files\Riot Vanguard"
        "C:\Program Files (x86)\Riot Vanguard"
        "C:\ProgramData\Riot Games"
        "C:\ProgramData\Riot Vanguard"
    )

    Get-ChildItem "C:\Users" -Directory -Force `
        -ErrorAction SilentlyContinue |
    ForEach-Object {
        $userPath = $_.FullName

        $paths += @(
            (Join-Path $userPath "AppData\Local\Riot Games")
            (Join-Path $userPath "AppData\Local\Riot Client")
            (Join-Path $userPath "AppData\Local\VALORANT")
            (Join-Path $userPath "AppData\Local\Riot Vanguard")
            (Join-Path $userPath "AppData\Roaming\Riot Games")
            (Join-Path $userPath "AppData\Roaming\Riot Client")
        )
    }

    @(
        $paths | Sort-Object -Unique |
        Where-Object {
            Test-Path -LiteralPath $_ -PathType Container
        }
    )
}

# Record every file before removing it
function Record-DirectoryFiles {
    param([string]$Path)

    $files = @(
        Get-ChildItem -LiteralPath $Path -File -Recurse -Force `
            -ErrorAction Stop
    )

    foreach ($file in $files) {
        Log "FILE: $($file.Name)"
        Log "PATH: $($file.FullName)"
        Log "LAST MODIFIED: $($file.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))"
        Log "SIZE: $($file.Length) bytes"
        $script:recorded++
    }
}

function Remove-RiotDirectory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        return
    }

    Log "[DIRECTORY TO REMOVE] $Path"

    try {
        # The complete file inventory must succeed first
        Record-DirectoryFiles -Path $Path

        Log "[DELETE START] $Path"

        Remove-Item -LiteralPath $Path -Recurse -Force `
            -ErrorAction Stop

        if (Test-Path -LiteralPath $Path) {
            throw "Directory still exists."
        }

        Log "REMOVED: $Path"
        $script:removed++
    }
    catch {
        Log "FAILED: $Path"
        Log "REASON: $($_.Exception.Message)"
        $script:failed++
    }
}

function Invoke-RegisteredUninstaller {
    param($App)

    $name = $App.DisplayName
    $command = $App.QuietUninstallString

    if (-not $command) {
        $command = $App.UninstallString
    }

    Log "[UNINSTALL] $name"

    if ([string]::IsNullOrWhiteSpace($command)) {
        Log "FAILED: No uninstall command registered."
        $script:failed++
        return
    }

    Log "REGISTERED COMMAND: $command"

    # MSI uninstall
    if (
        $command -match '(?i)msiexec' -and
        $command -match '\{[0-9A-Fa-f-]{36}\}'
    ) {
        $guid = $Matches[0]

        $process = Start-Process "msiexec.exe" `
            -ArgumentList "/x $guid /qn /norestart" `
            -Wait -PassThru

        Log "UNINSTALL EXIT CODE: $($process.ExitCode)"

        if ($process.ExitCode -notin @(0, 3010, 1605)) {
            $script:failed++
        }
        return
    }

    # Parse executable and arguments
    $exe = $null
    $args = ""

    if ($command -match '^\s*"([^"]+\.exe)"\s*(.*)$') {
        $exe = $Matches[1]
        $args = $Matches[2]
    }
    elseif ($command -match '^\s*(.+?\.exe)(?:\s+(.*))?$') {
        $exe = $Matches[1]
        $args = $Matches[2]
    }

    if (-not $exe) {
        Log "FAILED: Cannot parse uninstall command."
        $script:failed++
        return
    }

    $exe = [Environment]::ExpandEnvironmentVariables($exe)

    if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) {
        Log "FAILED: Uninstaller not found: $exe"
        $script:failed++
        return
    }

    # Only execute recognized Riot uninstallers
    if ($exe -notmatch '(?i)\\(Riot Games|Riot Vanguard|VALORANT|League of Legends)\\') {
        Log "SKIPPED: Uninstaller location requires manual review."
        $script:failed++
        return
    }

    try {
        Log "RUNNING: $exe"

        $process = Start-Process -FilePath $exe `
            -ArgumentList $args -Wait -PassThru `
            -ErrorAction Stop

        Log "UNINSTALL EXIT CODE: $($process.ExitCode)"

        if ($process.ExitCode -notin @(0, 3010)) {
            $script:failed++
        }
    }
    catch {
        Log "UNINSTALL FAILED: $($_.Exception.Message)"
        $script:failed++
    }
}


function Scan-ResidualFiles {

    Log "[C DRIVE RESIDUAL SCAN START]"

    # Scan common Riot installation and user-data locations.
    # Avoid scanning the entire Windows system directory.

    $scanPaths = @(
        "C:\Riot Games"
        "C:\Program Files"
        "C:\Program Files (x86)"
        "C:\ProgramData"
        "C:\Users"
        "C:\Games"
    )

    $scanPaths = @(
        $scanPaths | Where-Object {
            Test-Path -LiteralPath $_ -PathType Container
        } | Sort-Object -Unique
    )

    $pattern = '(?i)Riot Games|Riot Vanguard|VALORANT|League of Legends|RiotClient|LeagueClient'

    $totalFound = 0
    $totalPaths = $scanPaths.Count
    $currentPath = 0

    foreach ($scanPath in $scanPaths) {

        $currentPath++

        Write-Host ""
        Write-Host "Scanning [$currentPath/$totalPaths]: $scanPath"

        Log "SCAN START: $scanPath"

        try {
            Get-ChildItem -LiteralPath $scanPath `
                -Recurse -Force `
                -ErrorAction SilentlyContinue |
            Where-Object {
                $_.Name -match $pattern
            } |
            ForEach-Object {

                $item = $_

                # Immediately record each finding
                Log "RESIDUAL FILE: $($item.Name)"
                Log "FULL PATH: $($item.FullName)"
                Log "LAST MODIFIED: $($item.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))"

                if ($item.PSIsContainer) {
                    Log "TYPE: Directory"
                }
                else {
                    Log "TYPE: File"
                    Log "SIZE: $($item.Length) bytes"
                }

                $totalFound++

                Write-Host "FOUND: $($item.FullName)"
            }

            Log "SCAN FINISHED: $scanPath"
        }
        catch {
            Log "SCAN ERROR: $scanPath"
            Log "REASON: $($_.Exception.Message)"
        }
    }

    Log "[C DRIVE RESIDUAL SCAN FINISHED]"
    Log "TOTAL RESIDUAL MATCHES: $totalFound"

    Write-Host ""
    Write-Host "Residual scan completed."
    Write-Host "Total matches: $totalFound"
}


try {
    Log "========================================"
    Log "CKSH RIOT CLEANUP"
    Log "COMPUTER: $env:COMPUTERNAME"
    Log "USER: $env:USERNAME"
    Log "START: $(Get-Date)"
    Log "========================================"

    # --------------------------------------
    # 1. Inventory before uninstall
    # --------------------------------------

    $apps = @(Get-RiotApps)
    $dirs = @(Get-TargetDirectories)

    foreach ($app in $apps) {
        Log "[INSTALLED] $($app.DisplayName)"
        Log "INSTALL DATE: $($app.InstallDate)"
        Log "INSTALL LOCATION: $($app.InstallLocation)"
    }

    foreach ($dir in $dirs) {
        Log "[FOUND DIRECTORY] $dir"
        $item = Get-Item -LiteralPath $dir -Force
        Log "CREATED: $($item.CreationTime)"
        Log "MODIFIED: $($item.LastWriteTime)"
    }

    # Preserve Prefetch metadata
    Get-ChildItem "C:\Windows\Prefetch" -Filter "*.pf" `
        -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -match '(?i)RIOT|VALORANT|LEAGUE|VANGUARD|VGTRAY'
    } |
    ForEach-Object {
        Log "[PREFETCH] $($_.Name)"
        Log "LAST MODIFIED: $($_.LastWriteTime)"
    }

    # --------------------------------------
    # 2. Confirm cleanup
    # --------------------------------------

    Write-Host ""
    $answer = Read-Host "Proceed with uninstall and deletion? (Y/N)"

    if ($answer -ne "Y") {
        Log "CANCELLED"
        exit 0
    }

    # --------------------------------------
    # 3. Stop processes
    # --------------------------------------

    $stopped = Stop-RiotProcesses

    if (-not $stopped) {
        Log "ABORTED: Riot processes are still running."
        exit 2
    }

    # Stop Vanguard services
    foreach ($service in @("vgc", "vgk")) {
        $svc = Get-Service -Name $service -ErrorAction SilentlyContinue

        if ($svc) {
            Log "[STOP SERVICE] $service"
            & sc.exe stop $service 2>&1 |
                ForEach-Object { Log "$_" }
        }
    }

    Start-Sleep -Seconds 3

    # --------------------------------------
    # 4. Official uninstall
    # --------------------------------------

    foreach ($app in $apps) {
        Invoke-RegisteredUninstaller -App $app
    }

    # Uninstallers may restart Riot processes
    $stopped = Stop-RiotProcesses

    if (-not $stopped) {
        Log "ABORTED: Riot processes remain after uninstall."
        exit 2
    }

    # --------------------------------------
    # 5. Check uninstall results
    # --------------------------------------

    $remainingApps = @(Get-RiotApps)

    foreach ($app in $remainingApps) {
        Log "STILL REGISTERED: $($app.DisplayName)"
    }

    if ($remainingApps.Count -gt 0) {
        Log "WARNING: Registered Riot applications remain."
        Log "Directory deletion skipped to avoid breaking an installed application."
        exit 3
    }

    # --------------------------------------
    # 6. Remove Vanguard services
    # --------------------------------------

    foreach ($service in @("vgc", "vgk")) {
        $svc = Get-Service -Name $service -ErrorAction SilentlyContinue

        if ($svc) {
            Log "[DELETE SERVICE] $service"
            & sc.exe delete $service 2>&1 |
                ForEach-Object { Log "$_" }
        }
    }

    # --------------------------------------
    # 7. Delete known Riot directories
    # --------------------------------------

    $dirs = @(Get-TargetDirectories)

    foreach ($dir in $dirs) {
        Remove-RiotDirectory -Path $dir
    }

    # --------------------------------------
    # 8. Verify cleanup
    # --------------------------------------

    foreach ($dir in @(Get-TargetDirectories)) {
        Log "STILL EXISTS: $dir"
        $script:failed++
    }

    Scan-ResidualFiles

    # --------------------------------------
    # 9. Final summary
    # --------------------------------------

    Log "========================================"
    Log "CLEANUP SUMMARY"
    Log "FILES RECORDED: $script:recorded"
    Log "DIRECTORIES REMOVED: $script:removed"
    Log "FAILURES: $script:failed"
    Log "FINISHED: $(Get-Date)"
    Log "========================================"

    Write-Host ""
    Write-Host "Please restart Windows."
    Write-Host "Log: $logFile"

    if ($script:failed -gt 0) {
        exit 4
    }

    exit 0
}
catch {
    try {
        Log "FATAL ERROR: $($_.Exception.Message)"
        Log "LINE: $($_.InvocationInfo.ScriptLineNumber)"
    }
    catch {
        Write-Host "FATAL ERROR: $($_.Exception.Message)"
        Write-Host "USB logging may have failed."
    }

    exit 1
}
