# scripts/publish-release.ps1
# Automate version bump, git push, GitHub workflow trigger, monitoring, and post-deploy verification.

$VersionName = "3.7.97"
$VersionCode = "225"
$ReleaseNote = "v3.7.97 - Release 3.7.97: Centralized version parser and normalizer supporting multiple formats (3.7.96, v3.7.96, Version 3.7.96, release-3.7.96, refs/tags/v3.7.96) and robust release detection."

# Get current branch name
$BranchName = (git symbolic-ref --short HEAD).Trim()
Write-Host "Current branch: $BranchName"

Write-Host "1. Bumping Android and Web versions to $VersionName ($VersionCode)..."
pnpm version:android --name $VersionName --code $VersionCode
pnpm version:web -- $VersionName

Write-Host "2. Committing and pushing version changes to Git..."
git add packages/studio-core/src/lib/appVersion.ts
git add packages/studio-core/src/lib/startupCoordinator.ts
git add packages/studio-core/src/lib/otaUpdate.ts
git add packages/studio-core/src/lib/performanceProfiler.ts
git add packages/studio-core/src/lib/updater/diagnostics.ts
git add packages/studio-core/src/lib/updater/stateMachine.ts
git add packages/studio-core/src/lib/updater/updaterSimulation.ts
git add packages/studio-core/src/lib/apkDownloader.ts
git add packages/studio-core/src/lib/updater/cacheManager.ts
git add packages/studio-core/src/lib/updater/releaseMetadata.ts
git add packages/ui-shared/src/components/updater-diagnostics/diagnosticsGenerator.ts
git add packages/ui-shared/src/components/updater-diagnostics/UpdaterDiagnosticsPage.tsx
git add packages/ui-shared/src/components/updater-diagnostics/TelemetryGrid.tsx
git add packages/ui-shared/src/components/updater-diagnostics/SimulationLab.tsx
git add packages/ui-shared/src/components/UpdateIndicator.tsx
git add packages/ui-shared/src/components/StudioHub.tsx
git add apps/studio-android/src/index.css
git add apps/studio-web/src/index.css
git add apps/studio-android/package.json
git add apps/studio-android/android/app/build.gradle
git add apps/studio-android/public/version.json
git add apps/studio-web/package.json
git add CHANGELOG.md
git add apps/studio-android/CHANGELOG.md
git add apps/studio-web/CHANGELOG.md
git add release-notes.md
git add scripts/run-updater-regression-tests.mjs
git add scripts/publish-release.ps1
git add .github/workflows/release.yml
if (git diff --staged --quiet) {
    Write-Host "No changes to commit."
} else {
    git commit -m "Release v${VersionName} - ${ReleaseNote}"
}
Write-Host "Pushing HEAD to origin/$BranchName..."
git push origin HEAD

Write-Host "3. Triggering GitHub Actions Release Pipeline on branch $BranchName..."
gh workflow run release.yml --ref $BranchName -f release_type=both -f note="$ReleaseNote"

Write-Host "Waiting 15 seconds for the workflow run to initialize..."
Start-Sleep -Seconds 15

Write-Host "4. Finding the active workflow run..."
$RunId = $null
$RunStatusLabel = "unknown"
for ($attempt = 1; $attempt -le 12; $attempt++) {
    $Runs = gh run list --workflow=release.yml --branch $BranchName --limit 5 --json databaseId,status,conclusion | ConvertFrom-Json
    if ($Runs) {
        foreach ($r in $Runs) {
            if ($r.status -eq "queued" -or $r.status -eq "in_progress") {
                $RunId = $r.databaseId
                $RunStatusLabel = $r.status
                break
            }
        }
    }
    if ($RunId) { break }
    Write-Host "Waiting for new run to register (attempt $attempt/12)..."
    Start-Sleep -Seconds 10
}
if (-not $RunId) {
    if ($Runs) {
        $RunId = $Runs[0].databaseId
        $RunStatusLabel = $Runs[0].status
    } else {
        Write-Error "Could not find any runs for release.yml on branch $BranchName"
        exit 1
    }
}
Write-Host "Found run ID: $RunId. Status: $RunStatusLabel"

Write-Host "5. Monitoring workflow run $RunId until completion..."
while ($true) {
    $RunStatus = gh run view $RunId --json status,conclusion | ConvertFrom-Json
    $Status = $RunStatus.status
    $Conclusion = $RunStatus.conclusion
    Write-Host "$(Get-Date -Format 'HH:mm:ss') - Status: $Status, Conclusion: $Conclusion"
    if ($Status -eq "completed") {
        if ($Conclusion -ne "success") {
            Write-Error "Workflow failed with conclusion: $Conclusion"
            exit 1
        }
        break
    }
    Start-Sleep -Seconds 20
}

Write-Host "6. Verifying GitHub Release..."
$Release = gh release view "v$VersionName" --json assets | ConvertFrom-Json
if (-not $Release) {
    Write-Error "GitHub Release v$VersionName not found!"
    exit 1
}
Write-Host "GitHub Release v$VersionName exists."

$ApkAsset = $Release.assets | Where-Object { $_.name -eq "studio-$VersionName.apk" }
if (-not $ApkAsset) {
    Write-Error "Release APK asset studio-$VersionName.apk not found!"
    exit 1
}
Write-Host "Release APK asset exists."

$ShaAsset = $Release.assets | Where-Object { $_.name -eq "studio-$VersionName.sha256" }
if (-not $ShaAsset) {
    Write-Error "Release SHA asset studio-$VersionName.sha256 not found!"
    exit 1
}
Write-Host "Release SHA asset exists."

Write-Host "7. Verifying Firebase Metadata & In-App Updater..."
Write-Host "Fetching app-release.json from production..."
$AppReleaseJson = Invoke-RestMethod -Uri "https://studio-30f44.web.app/app-release.json" -Headers @{ "Cache-Control" = "no-cache" }
Write-Host "Production app-release.json version: $($AppReleaseJson.version), versionCode: $($AppReleaseJson.versionCode)"
if ($AppReleaseJson.version -ne $VersionName) {
    Write-Error "Production app-release.json version mismatch! Expected $VersionName, got $($AppReleaseJson.version)"
    exit 1
}

Write-Host "Fetching version.json from production..."
$VersionJson = Invoke-RestMethod -Uri "https://studio-30f44.web.app/version.json" -Headers @{ "Cache-Control" = "no-cache" }
Write-Host "Production version.json version: $($VersionJson.version)"
if ($VersionJson.version -ne $VersionName) {
    Write-Error "Production version.json version mismatch! Expected $VersionName, got $($VersionJson.version)"
    exit 1
}

Write-Host "SUCCESS: Release v$VersionName successfully published and verified!"
