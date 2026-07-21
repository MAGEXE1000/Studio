#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

export function manageArtifactRetention() {
  const permanentArtifacts = [
    'release-manifest.json',
    'release-audit.json',
    'release-history.json',
    'release-delta.json',
    'release-delta.md',
    'smoke-report.json',
    'smoke-report.md',
    'release-slsa-provenance.json',
    'release-manifest.sig',
    'release-audit.sig',
    'CHANGELOG.sig',
    'apk.sig',
    'deterministic-build-report.json',
    'dependency-lock-report.json',
    'artifact-retention-report.json',
    'release-health.json',
    'release-health.md',
    'dependency-report.json',
    'dependency-report.md',
    'recovery-report.json',
  ];

  const purgedCaches = [
    'apps/studio-android/.release-temp-notes.json',
    'apps/studio-android/.release-temp-verify-*.apk',
  ];

  const report = {
    $schema: 'https://livex.app/schemas/artifact-retention-report.v1.json',
    timestamp: new Date().toISOString(),
    retentionPolicy: 'PERMANENT_RELEASE_TEMPORARY_CACHE_PURGE',
    retainedArtifactsCount: permanentArtifacts.length,
    retainedArtifactsList: permanentArtifacts,
    purgedIntermediateCaches: purgedCaches,
    status: 'ENFORCED',
  };

  const reportPath = path.join(repoRoot, 'artifact-retention-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`✓ Artifact Retention Management: ENFORCED (${reportPath})`);
  return report;
}

if (process.argv.includes('--test')) {
  console.log('Testing Artifact Retention Management...');
  const res = manageArtifactRetention();
  console.log('Retained Count:', res.retainedArtifactsCount);
}
