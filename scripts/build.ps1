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
$RawDataPath = (Resolve-Path "./DataBuilder/Raw").Path
$TimelineBuilderProjectDir = (Resolve-Path "./DataBuilder/TimelineBuilder/TimelineBuilder.csproj").Path
$AssetsBuilderProjectDir = (Resolve-Path "./DataBuilder/AssetsBuilder/AssetsBuilder.csproj").Path

Copy-Item $RdfPath "$RawDataPath/wbdump.ttl"
# Assumes $PWD is repo root
dotnet run -c Release --project $TimelineBuilderProjectDir -- "$RawDataPath/Timeline.json"
if ($LASTEXITCODE) {
    # https://docs.github.com/en/free-pro-team@latest/actions/reference/workflow-commands-for-github-actions#setting-a-warning-message
    Write-Warning "::warning ::TimelineBuilder fetching live module failed. Will use fallback timeline data."
}
dotnet run -c Release --project $AssetsBuilderProjectDir -- $RawDataPath $DataPath
checkLastExitCode

yarn build-prod
checkLastExitCode

yarn build-embed-prod
checkLastExitCode
New-Item -ItemType Directory ./dist/embed -Force
Copy-Item ./embed/dist/* ./dist/embed/ -Recurse
