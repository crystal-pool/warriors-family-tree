#!/usr/bin/env pwsh

param (
    [Parameter()]
    [string]
    $RdfPath = "../Dump/wbdump.ttl"
)

function checkLastExitCode() {
    if ($LASTEXITCODE) {
        Write-Error "Command exit code indicates failure: $LASTEXITCODE"
        Exit $LASTEXITCODE
    }
}

$ErrorActionPreference = "Stop"

$RdfPath = (Resolve-Path $RdfPath).Path
$DataPath = (New-Item "./assets/data" -ItemType Directory -Force).FullName
$DataBuilderProjectDir = (Resolve-Path "./DataBuilder/DataBuilder.csproj").Path

# Assumes $PWD is repo root
dotnet run -c Release -p $DataBuilderProjectDir -- $RdfPath $DataPath
checkLastExitCode

yarn build-prod
checkLastExitCode
