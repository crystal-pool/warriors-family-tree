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
dotnet run -c Release -p $TimelineBuilderProjectDir -- "$RawDataPath/Timeline.json"
if ($LASTEXITCODE) {
    Write-Warning "TimelineBuilder fetching live module failed. Will use fallback timeline data."
}
dotnet run -c Release -p $AssetsBuilderProjectDir -- $RawDataPath $DataPath
checkLastExitCode

yarn build-prod
checkLastExitCode

yarn build-embed-prod
checkLastExitCode
New-Item -ItemType Directory ./dist/embed -Force
Copy-Item ./embed/dist/* ./dist/embed/ -Recurse
