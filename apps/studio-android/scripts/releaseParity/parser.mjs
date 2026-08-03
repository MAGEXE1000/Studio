import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

export function parseWorkflowStages() {
  const workflowPath = path.join(repoRoot, '.github/workflows/release.yml');
  if (!fs.existsSync(workflowPath)) return [];

  const content = fs.readFileSync(workflowPath, 'utf8');
  const stages = [];

  if (content.includes('Preflight') || content.includes('release:audit')) stages.push('Preflight & Audit');
  if (content.includes('build') || content.includes('assembleRelease')) stages.push('Build & Package');
  if (content.includes('sign') || content.includes('apksigner')) stages.push('Signing Validation');
  if (content.includes('manifest') || content.includes('release-manifest.json')) stages.push('Release Manifest Generation');
  if (content.includes('firebase') || content.includes('app-release.json')) stages.push('Firebase Metadata Validation');
  if (content.includes('ota') || content.includes('updater') || content.includes('Hosting') || content.includes('propagation')) stages.push('OTA & Updater Validation');
  if (content.includes('github') || content.includes('gh release') || content.includes('Publish')) stages.push('GitHub Release Publication');

  return stages;
}

export function parseSimulatorStages() {
  const simulatorPath = path.join(repoRoot, 'apps/studio-android/scripts/releaseE2E/runner.mjs');
  if (!fs.existsSync(simulatorPath)) return [];

  const content = fs.readFileSync(simulatorPath, 'utf8');
  const stages = [];

  if (content.includes('Step 1') || content.includes('runReleaseAudit')) stages.push('Preflight & Audit');
  if (content.includes('Step 2') || content.includes('simulateSimulatedManifest')) stages.push('Release Manifest Generation');
  if (content.includes('Step 3') || content.includes('simulateGitHubRelease')) stages.push('GitHub Release Publication');
  if (content.includes('Step 4') || content.includes('simulateFirebaseMetadata')) stages.push('Firebase Metadata Validation');
  if (content.includes('Step 5') || content.includes('OTA')) stages.push('OTA & Updater Validation');
  if (content.includes('Step 6') || content.includes('Packaging')) stages.push('Signing Validation');
  if (content.includes('Build & Package') || content.includes('Step 2')) stages.push('Build & Package');

  return stages;
}
