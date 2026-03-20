# Voidcrawl - Agent Runner
# Usage: .\run-agent.ps1 -AgentType health
# Agent types: health, developer, strategist, reporter

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("health", "developer", "strategist", "reporter")]
    [string]$AgentType
)

$projectDir = "D:\development\voidcrawl"
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$logDir = "$projectDir\agents\logs"
$logFile = "$logDir\$AgentType-$timestamp.log"

# Ensure log directory exists
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

# Map agent type to prompt file and max turns
$config = @{
    "health" = @{ prompt = "health-check.md"; maxTurns = 15 }
    "developer" = @{ prompt = "developer.md"; maxTurns = 75 }
    "strategist" = @{ prompt = "strategist.md"; maxTurns = 30 }
    "reporter" = @{ prompt = "reporter.md"; maxTurns = 20 }
}

$agentConfig = $config[$AgentType]
$promptFile = "$projectDir\agents\$($agentConfig.prompt)"

if (-not (Test-Path $promptFile)) {
    Write-Error "Prompt file not found: $promptFile"
    exit 1
}

$prompt = Get-Content $promptFile -Raw

Write-Host "[$timestamp] Starting $AgentType agent..."
Write-Host "Prompt file: $promptFile"
Write-Host "Max turns: $($agentConfig.maxTurns)"
Write-Host "Log file: $logFile"
Write-Host ""

# Change to project directory
Set-Location $projectDir

# Run Claude agent
claude -p $prompt --dangerously-skip-permissions --max-turns $($agentConfig.maxTurns) --output-format text 2>&1 | Tee-Object -FilePath $logFile

$exitCode = $LASTEXITCODE
$endTimestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
Write-Host ""
Write-Host "[$endTimestamp] $AgentType agent finished with exit code $exitCode"
