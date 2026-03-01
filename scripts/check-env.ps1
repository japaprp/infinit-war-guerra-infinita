param(
    [string]$ApiUrl = "http://localhost:4000",
    [string]$MySqlPath = "C:\\xampp\\mysql\\bin\\mysql.exe",
    [string]$MySqlDb = "infinitwar",
    [string]$MySqlUser = "root",
    [string]$MySqlPassword = "",
    [switch]$FailOnWarning
)

$ErrorActionPreference = "Stop"

$results = [System.Collections.Generic.List[object]]::new()
$warnings = 0
$errors = 0

function Add-Result {
    param(
        [string]$Check,
        [string]$Status,
        [string]$Details
    )

    if ($Status -eq "WARN") { $script:warnings += 1 }
    if ($Status -eq "ERROR") { $script:errors += 1 }

    $script:results.Add([PSCustomObject]@{
        Check = $Check
        Status = $Status
        Details = $Details
    })
}

function Try-GetCommandVersion {
    param(
        [string]$CommandName,
        [string]$VersionArg = "--version"
    )

    try {
        $value = & $CommandName $VersionArg 2>$null
        return ($value | Select-Object -First 1)
    } catch {
        return $null
    }
}

function Test-TcpPort {
    param(
        [string]$HostName = "127.0.0.1",
        [int]$Port
    )

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($HostName, $Port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(1200, $false)
        if (-not $ok) {
            $client.Close()
            return $false
        }
        $client.EndConnect($iar)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

# Node
$nodeVersion = Try-GetCommandVersion -CommandName "node"
if ($null -eq $nodeVersion) {
    Add-Result -Check "Node.js" -Status "ERROR" -Details "Node nao encontrado no PATH."
} else {
    Add-Result -Check "Node.js" -Status "OK" -Details "$nodeVersion"
}

# npm
$npmVersion = Try-GetCommandVersion -CommandName "npm.cmd"
if ($null -eq $npmVersion) {
    Add-Result -Check "npm" -Status "ERROR" -Details "npm nao encontrado no PATH."
} else {
    Add-Result -Check "npm" -Status "OK" -Details "$npmVersion"
}

# Backend health
try {
    $healthResponse = Invoke-RestMethod -Method Get -Uri "$ApiUrl/health"
    $repo = if ($healthResponse.repository) { $healthResponse.repository } else { "unknown" }
    Add-Result -Check "Backend /health" -Status "OK" -Details "service=$($healthResponse.service) repository=$repo"
} catch {
    Add-Result -Check "Backend /health" -Status "WARN" -Details "API indisponivel em $ApiUrl"
}

# Backend port
$apiPort = 4000
try {
    $uri = [System.Uri]$ApiUrl
    if ($uri.Port -gt 0) { $apiPort = $uri.Port }
} catch {
    $apiPort = 4000
}

$apiPortOpen = Test-TcpPort -HostName "127.0.0.1" -Port $apiPort
if ($apiPortOpen) {
    Add-Result -Check "Porta API" -Status "OK" -Details "127.0.0.1:$apiPort aberta"
} else {
    Add-Result -Check "Porta API" -Status "WARN" -Details "127.0.0.1:$apiPort fechada"
}

# Redis port
$redisOpen = Test-TcpPort -HostName "127.0.0.1" -Port 6379
if ($redisOpen) {
    Add-Result -Check "Redis 6379" -Status "OK" -Details "Redis acessivel em 127.0.0.1:6379"
} else {
    Add-Result -Check "Redis 6379" -Status "WARN" -Details "Redis nao detectado (fallback em memoria continua funcionando)"
}

# XAMPP MySQL binary
if (Test-Path $MySqlPath) {
    Add-Result -Check "MySQL binary" -Status "OK" -Details $MySqlPath
} else {
    Add-Result -Check "MySQL binary" -Status "ERROR" -Details "Nao encontrado em $MySqlPath"
}

# MySQL service
try {
    $mysqlService = Get-Service -Name "mysql" -ErrorAction Stop
    if ($mysqlService.Status -eq "Running") {
        Add-Result -Check "Servico MySQL" -Status "OK" -Details "mysql em execucao"
    } else {
        Add-Result -Check "Servico MySQL" -Status "WARN" -Details "mysql encontrado, status=$($mysqlService.Status)"
    }
} catch {
    Add-Result -Check "Servico MySQL" -Status "WARN" -Details "Servico 'mysql' nao encontrado"
}

# MySQL query
if (Test-Path $MySqlPath) {
    try {
        $query = @"
SELECT COUNT(*) AS app_state_rows FROM app_state;
SELECT COUNT(*) AS has_receipts_table
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'receipts';
"@
        $args = @("-u", $MySqlUser)
        if ($MySqlPassword -ne "") {
            $args += "-p$MySqlPassword"
        }
        $args += @($MySqlDb, "-e", $query)
        $mysqlOut = & $MySqlPath @args 2>&1
        $joined = ($mysqlOut | Out-String).Trim()
        if ($LASTEXITCODE -eq 0) {
            Add-Result -Check "MySQL consulta" -Status "OK" -Details ($joined -replace "`r?`n", " | ")
        } else {
            Add-Result -Check "MySQL consulta" -Status "ERROR" -Details $joined
        }
    } catch {
        Add-Result -Check "MySQL consulta" -Status "ERROR" -Details $_.Exception.Message
    }
}

Write-Host ""
Write-Host "=== Infinit War | Environment Check ==="
$results | Format-Table -AutoSize
Write-Host ""
Write-Host ("Resumo: {0} erro(s), {1} aviso(s)" -f $errors, $warnings)

if ($errors -gt 0) {
    exit 1
}

if ($FailOnWarning -and $warnings -gt 0) {
    exit 2
}

exit 0
