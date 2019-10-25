#!/usr/bin/env pwsh

param (
    # Your Name <email@example.com>
    [Parameter(Mandatory = $True)]
    [string]
    $PublishingUser,

    # UserName:Token
    [Parameter(Mandatory = $True)]
    [string]
    $AuthPrefix
)

function checkLastExitCode() {
    if ($LASTEXITCODE) {
        Write-Error "Command exit code indicates failure: $LASTEXITCODE"
        Exit $LASTEXITCODE
    }
}

$ErrorActionPreference = "Stop"

$HEAD = git rev-parse HEAD
$CommitMessage = "Deploy app for crystal-pool/warriors-family-tree@$HEAD ."

git remote add __publish_temp https://$AuthPrefix@github.com/$env:GITHUB_REPOSITORY.git *> $null
checkLastExitCode
yarn run deploy-prod --user $PublishingUser --remote __publish_temp --message $CommitMessage
checkLastExitCode
git remote remove __publish_temp 
checkLastExitCode
