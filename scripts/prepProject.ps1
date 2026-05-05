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
yarn install --immutable
checkLastExitCode
# NOTE: patch.diff for javascript-lp-solver is no longer needed.
# Vite externalizes fs/child_process for browser builds automatically.
yarn lint
checkLastExitCode

dotnet build -c Release $DataBuilderSolutionDir
checkLastExitCode
