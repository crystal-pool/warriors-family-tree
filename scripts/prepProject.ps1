#!/usr/bin/env pwsh

function checkLastExitCode() {
    if ($LASTEXITCODE) {
        Write-Error "Command exit code indicates failure: $LASTEXITCODE"
        Exit $LASTEXITCODE
    }
}

$ErrorActionPreference = "Stop"

$DataBuilderSolutionDir = (Resolve-Path "./DataBuilder/DataBuilder.sln").Path

# Assumes $PWD is repo root
yarn install
checkLastExitCode
git apply ./patch.diff --verbose --ignore-whitespace
checkLastExitCode
yarn lint
checkLastExitCode

dotnet build -c Release $DataBuilderSolutionDir
checkLastExitCode
