#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

$DataBuilderSolutionDir = (Resolve-Path "./DataBuilder/DataBuilder.sln").Path

# Assumes $PWD is repo root
yarn install --immutable
yarn lint

dotnet build -c Release $DataBuilderSolutionDir
