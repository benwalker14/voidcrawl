# Voidcrawl - Agent Orchestrator
# Continuously dispatches the right agent based on what needs doing.
#
# Usage: .\orchestrator.ps1 [-MaxIterations 50] [-CooldownSeconds 120]
# For indefinite run: .\orchestrator.ps1 -MaxIterations 0

param(
    [int]$MaxIterations = 50,
    [int]$CooldownSeconds = 120,
    [int]$StrategistEveryNDevRuns = 3,
    [int]$ReporterIntervalHours = 12,
    [int]$HealthIntervalHours = 4,
    [int]$IdleSleepSeconds = 600
)

$projectDir = "D:\development\voidcrawl"
$agentScript = "$projectDir\agents\run-agent.ps1"
$timestampDir = "$projectDir\agents\logs"
$taskBoard = "$projectDir\TASK_BOARD.md"
$devRunsSinceStrategist = 0

function Get-LastRunTime($agentType) {
    $file = "$timestampDir\last-$agentType.txt"
    if (Test-Path $file) {
        return [DateTime](Get-Content $file -Raw).Trim()
    }
    return [DateTime]::MinValue
}

function Set-LastRunTime($agentType) {
    $dir = Split-Path "$timestampDir\last-$agentType.txt"
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    (Get-Date).ToString("o") | Set-Content "$timestampDir\last-$agentType.txt"
}

function Get-PendingTaskCount {
    if (-not (Test-Path $taskBoard)) { return 0 }
    $content = Get-Content $taskBoard -Raw
    $matches = [regex]::Matches($content, '- \[ \]')
    return $matches.Count
}

function Select-Agent {
    $now = Get-Date
    $pendingTasks = Get-PendingTaskCount
    $hoursSinceHealth = ($now - (Get-LastRunTime "health")).TotalHours
    $hoursSinceReporter = ($now - (Get-LastRunTime "reporter")).TotalHours

    # Priority 1: Health check if overdue
    if ($hoursSinceHealth -ge $HealthIntervalHours) {
        return @{ type = "health"; reason = "Health check overdue ($('{0:N1}' -f $hoursSinceHealth)h since last)" }
    }

    # Priority 2: Strategist interleave
    if ($script:devRunsSinceStrategist -ge $StrategistEveryNDevRuns -and $pendingTasks -gt 0) {
        return @{ type = "strategist"; reason = "Interleave: $($script:devRunsSinceStrategist) dev runs since last strategist review" }
    }

    # Priority 3: Developer if there are tasks
    if ($pendingTasks -gt 0) {
        return @{ type = "developer"; reason = "$pendingTasks pending tasks on board" }
    }

    # Priority 4: Strategist when queue is empty
    return @{ type = "strategist"; reason = "No pending tasks - strategist needed to plan next work" }
}

Set-Location $projectDir

Write-Host "=== Voidcrawl Agent Orchestrator ==="
Write-Host "Max iterations: $(if ($MaxIterations -eq 0) { 'unlimited' } else { $MaxIterations })"
Write-Host "Cooldown: ${CooldownSeconds}s | Idle sleep: ${IdleSleepSeconds}s"
Write-Host "Strategist every $StrategistEveryNDevRuns dev runs | Health every ${HealthIntervalHours}h | Reporter every ${ReporterIntervalHours}h"
Write-Host ""

$iteration = 0
while ($MaxIterations -eq 0 -or $iteration -lt $MaxIterations) {
    $selected = Select-Agent

    # Reporter check
    $hoursSinceReporter = ((Get-Date) - (Get-LastRunTime "reporter")).TotalHours
    if ($hoursSinceReporter -ge $ReporterIntervalHours -and $selected.type -ne "health") {
        $selected = @{ type = "reporter"; reason = "Reporter overdue ($('{0:N1}' -f $hoursSinceReporter)h since last)" }
    }

    $iteration++
    $label = if ($MaxIterations -eq 0) { "#$iteration" } else { "$iteration/$MaxIterations" }
    Write-Host "============================================"
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Iteration $label | Agent: $($selected.type)"
    Write-Host "  Reason: $($selected.reason)"
    Write-Host "============================================"

    & $agentScript -AgentType $selected.type
    Set-LastRunTime $selected.type

    if ($selected.type -eq "developer") {
        $script:devRunsSinceStrategist++
    } elseif ($selected.type -eq "strategist") {
        $script:devRunsSinceStrategist = 0
    }

    Write-Host ""
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $($selected.type) agent finished. Cooling down ${CooldownSeconds}s..."
    Start-Sleep -Seconds $CooldownSeconds
}

Write-Host ""
Write-Host "=== Orchestrator finished after $iteration iterations. ==="
