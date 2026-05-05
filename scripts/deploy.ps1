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

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $True

$HEAD = git rev-parse HEAD
$CommitMessage = "Deploy app for crystal-pool/warriors-family-tree@$HEAD ."

git remote add __publish_temp https://$AuthPrefix@github.com/$env:GITHUB_REPOSITORY.git *> $null

yarn run deploy-prod --user $PublishingUser --remote __publish_temp --message $CommitMessage

git remote remove __publish_temp 
