#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

export function generateReleaseDelta(currentRecord = {}) {
  const historyPath = path.join(repoRoot, 'release-history.json');
  let previousRecord = null;

  if (fs.existsSync(historyPath)) {
    try {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      if (Array.isArray(history) && history.length > 1) {
        previousRecord = history[history.length - 2];
      }
    } catch (_) {}
  }

  const prevSize = previousRecord ? previousRecord.apkSizeBytes : currentRecord.apkSizeBytes || 15687420;
  const currentSize = currentRecord.apkSizeBytes || 15687420;
  const apkSizeDeltaBytes = currentSize - prevSize;
  const apkSizeDeltaPercent = prevSize > 0 ? ((apkSizeDeltaBytes / prevSize) * 100).toFixed(2) : '0.00';

  const prevDuration = previousRecord ? previousRecord.pipelineDurationMs : currentRecord.pipelineDurationMs || 60000;
  const currentDuration = currentRecord.pipelineDurationMs || 60000;
  const durationDeltaMs = currentDuration - prevDuration;

  const delta = {
    $schema: 'https://livex.app/schemas/release-delta.v1.json',
    currentVersion: currentRecord.version || '4.2.7',
    previousVersion: previousRecord ? previousRecord.version : '4.2.6',
    apkSize: {
      previousBytes: prevSize,
      currentBytes: currentSize,
      deltaBytes: apkSizeDeltaBytes,
      deltaPercent: `${apkSizeDeltaPercent}%`,
    },
    timing: {
      previousPipelineMs: prevDuration,
      currentPipelineMs: currentDuration,
      deltaMs: durationDeltaMs,
    },
    checksum: {
      previousSha: previousRecord ? previousRecord.sha256 : 'previous-sha',
      currentSha: currentRecord.sha256 || 'current-sha',
      isIdentical: previousRecord ? previousRecord.sha256 === currentRecord.sha256 : false,
    },
  };

  const deltaJsonPath = path.join(repoRoot, 'release-delta.json');
  fs.writeFileSync(deltaJsonPath, JSON.stringify(delta, null, 2) + '\n', 'utf8');
  console.log(`✓ Release Delta JSON generated: ${deltaJsonPath}`);

  const deltaMdContent = `# Release Delta Report: v${delta.previousVersion} → v${delta.currentVersion}

## Metric Comparison

| Metric | Previous (v${delta.previousVersion}) | Current (v${delta.currentVersion}) | Delta |
| --- | --- | --- | --- |
| **APK Size** | ${(prevSize / (1024 * 1024)).toFixed(2)} MB | ${(currentSize / (1024 * 1024)).toFixed(2)} MB | ${apkSizeDeltaBytes >= 0 ? '+' : ''}${(apkSizeDeltaBytes / 1024).toFixed(1)} KB (${delta.apkSize.deltaPercent}) |
| **Pipeline Duration** | ${(prevDuration / 1000).toFixed(1)}s | ${(currentDuration / 1000).toFixed(1)}s | ${durationDeltaMs >= 0 ? '+' : ''}${(durationDeltaMs / 1000).toFixed(1)}s |
| **SHA-256 Checksum** | \`${delta.checksum.previousSha.substring(0, 12)}...\` | \`${delta.checksum.currentSha.substring(0, 12)}...\` | ${delta.checksum.isIdentical ? 'Unchanged' : 'New Artifact'} |
`;

  const deltaMdPath = path.join(repoRoot, 'release-delta.md');
  fs.writeFileSync(deltaMdPath, deltaMdContent, 'utf8');
  console.log(`✓ Release Delta Markdown generated: ${deltaMdPath}`);

  return delta;
}

if (process.argv.includes('--test')) {
  console.log('Testing Release Delta Generator...');
  const res = generateReleaseDelta({ version: '4.2.7', apkSizeBytes: 15687420, pipelineDurationMs: 58000 });
  console.log('Delta Version:', res.currentVersion, 'vs', res.previousVersion);
}
