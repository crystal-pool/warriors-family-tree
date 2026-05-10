#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

# Assumes $PWD is repo root

[string[]]$sdks = dotnet --list-sdks

$matchingSdk = $sdks | ? { $_ -match "^[5-9]\." }

Write-Host "Installed supported .NET Core SDK:"
Write-Host $matchingSdk
