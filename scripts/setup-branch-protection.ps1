param(
    [string]$Owner = "",
    [string]$Repo = "",
    [string]$Branch = "main",
    [string]$RequiredCheck = "Backend Integration / integration-tests",
    [switch]$RequireCodeOwnerReviews,
    [int]$Approvals = 1
)

$ErrorActionPreference = "Stop"
$script:GhExecutable = "gh"

function Resolve-OwnerRepoFromGit {
    try {
        $remoteUrl = (git remote get-url origin).Trim()
        if (-not $remoteUrl) { return $null }

        if ($remoteUrl -match "github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)(\.git)?$") {
            return @{
                Owner = $Matches["owner"]
                Repo = $Matches["repo"]
            }
        }
    } catch {
        return $null
    }

    return $null
}

function Ensure-GhCli {
    $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($ghCmd) {
        $script:GhExecutable = $ghCmd.Source
        return
    }

    $defaultPath = "C:\\Program Files\\GitHub CLI\\gh.exe"
    if (Test-Path $defaultPath) {
        $script:GhExecutable = $defaultPath
        return
    }

    throw "GitHub CLI (gh) nao encontrado. Instale com: winget install --id GitHub.cli -e"
}

function Ensure-GhAuth {
    Invoke-Gh @("auth", "status")
}

function Invoke-Gh {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & $script:GhExecutable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Comando gh falhou: gh $($Arguments -join ' ')"
    }
}

function Write-JsonNoBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Json
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Json, $utf8NoBom)
}

if ([string]::IsNullOrWhiteSpace($Owner) -or [string]::IsNullOrWhiteSpace($Repo)) {
    $resolved = Resolve-OwnerRepoFromGit
    if ($resolved) {
        $Owner = $resolved.Owner
        $Repo = $resolved.Repo
    }
}

if ([string]::IsNullOrWhiteSpace($Owner) -or [string]::IsNullOrWhiteSpace($Repo)) {
    throw "Nao foi possivel resolver owner/repo. Informe -Owner e -Repo."
}

Ensure-GhCli
Ensure-GhAuth

if ($Approvals -lt 1) { $Approvals = 1 }

$payloadWithChecks = @{
    required_status_checks = @{
        strict = $true
        checks = @(
            @{
                context = $RequiredCheck
                app_id = -1
            }
        )
    }
    enforce_admins = $true
    required_pull_request_reviews = @{
        dismiss_stale_reviews = $true
        require_code_owner_reviews = [bool]$RequireCodeOwnerReviews
        required_approving_review_count = $Approvals
    }
    restrictions = $null
    required_linear_history = $true
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $true
    lock_branch = $false
    allow_fork_syncing = $true
} | ConvertTo-Json -Depth 10

$payloadWithContexts = @{
    required_status_checks = @{
        strict = $true
        contexts = @(
            $RequiredCheck,
            "integration-tests"
        )
    }
    enforce_admins = $true
    required_pull_request_reviews = @{
        dismiss_stale_reviews = $true
        require_code_owner_reviews = [bool]$RequireCodeOwnerReviews
        required_approving_review_count = $Approvals
    }
    restrictions = $null
    required_linear_history = $true
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $true
    lock_branch = $false
    allow_fork_syncing = $true
} | ConvertTo-Json -Depth 10

$endpoint = "/repos/$Owner/$Repo/branches/$Branch/protection"
$tmpPayloadPath = [System.IO.Path]::GetTempFileName()
$applied = $false

try {
    Write-JsonNoBom -Path $tmpPayloadPath -Json $payloadWithChecks
    Invoke-Gh @("api", "--method", "PUT", $endpoint, "--input", $tmpPayloadPath)
    Write-Host "Branch protection aplicada com checks no repo $Owner/$Repo branch $Branch."
    $applied = $true
} catch {
    Write-Warning "Falha ao aplicar formato 'checks'. Tentando fallback com 'contexts'."
}

if (-not $applied) {
    Write-JsonNoBom -Path $tmpPayloadPath -Json $payloadWithContexts
    Invoke-Gh @("api", "--method", "PUT", $endpoint, "--input", $tmpPayloadPath)
    Write-Host "Branch protection aplicada com contexts no repo $Owner/$Repo branch $Branch."
}

if (Test-Path $tmpPayloadPath) {
    Remove-Item $tmpPayloadPath -Force -ErrorAction SilentlyContinue
}
