#!/usr/bin/env pwsh

function checkLastExitCode() {
    if ($LASTEXITCODE) {
        Write-Error "Command exit code indicates failure: $LASTEXITCODE"
        Exit $LASTEXITCODE
    }
}

$ErrorActionPreference = "Stop"

# Assumes $PWD is repo root

[string[]]$sdks = dotnet --list-sdks
checkLastExitCode

$matchingSdk = $sdks | ? { $_ -match "^[5-9]\." }

Write-Host "Installed supported .NET Core SDK:"
Write-Host $matchingSdk
