#!/usr/bin/env pwsh

param (
    [Parameter()]
    [string]
    $RdfPath = "Dump/wbdump.ttl"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

$RdfPath = (Resolve-Path $RdfPath).Path
$DataPath = (New-Item "./packages/app/public/data" -ItemType Directory -Force).FullName
$RawDataPath = (Resolve-Path "./DataBuilder/Raw").Path
$TimelineBuilderProjectDir = (Resolve-Path "./DataBuilder/TimelineBuilder/TimelineBuilder.csproj").Path
$AssetsBuilderProjectDir = (Resolve-Path "./DataBuilder/AssetsBuilder/AssetsBuilder.csproj").Path

Copy-Item $RdfPath "$RawDataPath/wbdump.ttl"
# Assumes $PWD is repo root
{
    $PSNativeCommandUseErrorActionPreference = $false
    dotnet run -c Release --project $TimelineBuilderProjectDir -- "$RawDataPath/Timeline.json"
    if ($LASTEXITCODE) {
        # https://docs.github.com/en/free-pro-team@latest/actions/reference/workflow-commands-for-github-actions#setting-a-warning-message
        Write-Warning "::warning ::TimelineBuilder fetching live module failed. Will use fallback timeline data."
    }
}
dotnet run -c Release --project $AssetsBuilderProjectDir -- $RawDataPath $DataPath

yarn workspace warriors-family-tree run build -- --mode production

yarn workspace wft-embed run build -- --mode production
New-Item -ItemType Directory ./packages/app/dist/embed -Force
Copy-Item ./packages/embed/dist/* ./packages/app/dist/embed/ -Recurse
