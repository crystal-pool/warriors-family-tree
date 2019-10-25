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

$matchingSdk = $sdks | ? { $_ -match "^[3-9]\." }

Write-Host "Installed supported .NET Core SDK:"
Write-Host $matchingSdk

if (-not $matchingSdk) {
    Write-Host "Installing .NET Core SDK."
    Invoke-WebRequest https://packages.microsoft.com/config/ubuntu/18.04/packages-microsoft-prod.deb -OutFile packages-microsoft-prod.deb
    sudo dpkg -i packages-microsoft-prod.deb
    checkLastExitCode
    sudo add-apt-repository universe
    checkLastExitCode
    sudo apt-get update
    checkLastExitCode
    sudo apt-get install apt-transport-https
    checkLastExitCode
    sudo apt-get update
    checkLastExitCode
    sudo apt-get install dotnet-sdk-3.0
    checkLastExitCode
}
