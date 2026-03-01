param(
    [string]$RepoName = "",
    [ValidateSet("public", "private")]
    [string]$Visibility = "private",
    [string]$Branch = "main",
    [switch]$RequireCodeOwnerReviews,
    [int]$Approvals = 1,
    [switch]$SkipBranchProtection
)

$ErrorActionPreference = "Stop"

function Invoke-CmdChecked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        [string[]]$Arguments = @()
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Falha no comando: $Command $($Arguments -join ' ')"
    }
}

function Ensure-GitRepo {
    if (-not (Test-Path ".git")) {
        throw "Este diretorio nao e um repositorio Git."
    }
}

function Resolve-GhExecutable {
    $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($ghCmd) { return $ghCmd.Source }

    $defaultPath = "C:\\Program Files\\GitHub CLI\\gh.exe"
    if (Test-Path $defaultPath) { return $defaultPath }

    throw "GitHub CLI nao encontrado. Instale com: winget install --id GitHub.cli -e"
}

function HasOriginRemote {
    $remotes = git remote
    return $remotes -contains "origin"
}

Ensure-GitRepo
$gh = Resolve-GhExecutable

Invoke-CmdChecked -Command $gh -Arguments @("auth", "status")

if ([string]::IsNullOrWhiteSpace($RepoName)) {
    $RepoName = Split-Path -Leaf (Get-Location)
}

if ($Approvals -lt 1) { $Approvals = 1 }

$owner = (& $gh api user --jq ".login").Trim()
if (-not $owner) {
    throw "Nao foi possivel resolver o owner da conta GitHub autenticada."
}

$fullRepo = "$owner/$RepoName"

$repoExists = $true
try {
    Invoke-CmdChecked -Command $gh -Arguments @("repo", "view", $fullRepo)
} catch {
    $repoExists = $false
}

if (-not (HasOriginRemote)) {
    if (-not $repoExists) {
        Invoke-CmdChecked -Command $gh -Arguments @("repo", "create", $fullRepo, "--$Visibility", "--source", ".", "--remote", "origin")
    } else {
        Invoke-CmdChecked -Command "git" -Arguments @("remote", "add", "origin", "https://github.com/$fullRepo.git")
    }
}

Invoke-CmdChecked -Command "git" -Arguments @("push", "-u", "origin", $Branch)

if (-not $SkipBranchProtection) {
    $protectScript = Join-Path "scripts" "setup-branch-protection.ps1"
    try {
        Invoke-CmdChecked -Command "powershell" -Arguments @(
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            $protectScript,
            "-Owner",
            $owner,
            "-Repo",
            $RepoName,
            "-Branch",
            $Branch,
            "-Approvals",
            "$Approvals"
        )
    } catch {
        Write-Warning "Nao foi possivel aplicar branch protection automaticamente. Push concluido com sucesso."
        Write-Warning "Se o repo for privado em conta pessoal gratuita, essa API pode exigir GitHub Pro."
    }
}

Write-Host "Publicacao concluida: https://github.com/$fullRepo"
