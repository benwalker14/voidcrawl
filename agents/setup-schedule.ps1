# Voidcrawl - Task Scheduler Setup
# Run this script as Administrator to set up the agent orchestrator
# Usage: Right-click PowerShell > Run as Administrator > .\setup-schedule.ps1

$projectDir = "D:\development\voidcrawl"
$orchestrator = "$projectDir\agents\orchestrator.ps1"

Write-Host "Voidcrawl - Setting up agent orchestrator..."
Write-Host "Project directory: $projectDir"
Write-Host ""

# Remove old task if exists
Unregister-ScheduledTask -TaskName "Voidcrawl-Orchestrator" -Confirm:$false -ErrorAction SilentlyContinue

# Orchestrator runs indefinitely, restarts daily at midnight as safety net
Write-Host "Setting up Voidcrawl Orchestrator (always on, restarts at midnight)..."
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$orchestrator`" -MaxIterations 0 -CooldownSeconds 120 -StrategistEveryNDevRuns 3 -ReporterIntervalHours 12 -HealthIntervalHours 4 -IdleSleepSeconds 600"

$triggerStartup = New-ScheduledTaskTrigger -AtStartup
$triggerDaily = New-ScheduledTaskTrigger -Daily -At "00:00"

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Duration 0) `
    -MultipleInstances IgnoreNew `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

Register-ScheduledTask -TaskName "Voidcrawl-Orchestrator" `
    -Action $action `
    -Trigger @($triggerStartup, $triggerDaily) `
    -Settings $settings `
    -Description "Voidcrawl agent orchestrator - runs 24/7, dispatches agents as needed" `
    -Force

Write-Host ""
Write-Host "Scheduled task created!"
Write-Host ""
Write-Host "How it works:"
Write-Host "  - Runs 24/7 (starts at boot, restarts at midnight as safety net)"
Write-Host "  - Developer agent runs whenever there are pending tasks"
Write-Host "  - Strategist runs every 3 dev runs to review priorities"
Write-Host "  - Reporter runs every 12h to summarize activity"
Write-Host "  - Health check runs every 4h"
Write-Host ""
Write-Host "Manual commands:"
Write-Host "  Start now:       .\agents\orchestrator.ps1 -MaxIterations 0"
Write-Host "  Single agent:    .\agents\run-agent.ps1 -AgentType developer"
Write-Host ""
Write-Host "To view task:  Get-ScheduledTask -TaskName 'Voidcrawl-Orchestrator'"
Write-Host "To stop:       Stop-ScheduledTask -TaskName 'Voidcrawl-Orchestrator'"
Write-Host "To remove:     Unregister-ScheduledTask -TaskName 'Voidcrawl-Orchestrator'"
