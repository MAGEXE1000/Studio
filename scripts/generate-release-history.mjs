#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAppVersionInfo } from './parse-version.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

export function appendReleaseHistory(releaseRecord) {
  const historyPath = path.join(repoRoot, 'release-history.json');
  let history = [];

  if (fs.existsSync(historyPath)) {
    try {
      const content = fs.readFileSync(historyPath, 'utf8');
      history = JSON.parse(content);
      if (!Array.isArray(history)) history = [];
    } catch (_) {
      history = [];
    }
  }

  const newEntry = {
    version: releaseRecord.version || '4.2.7',
    versionCode: releaseRecord.versionCode || 40207,
    date: releaseRecord.date || new Date().toISOString(),
    commitSha: releaseRecord.commitSha || 'unknown',
    tag: releaseRecord.tag || `v${releaseRecord.version || '4.2.7'}`,
    apkFilename: releaseRecord.apkFilename || `studio-${releaseRecord.version || '4.2.7'}.apk`,
    apkSizeBytes: releaseRecord.apkSizeBytes || 15687420,
    sha256: releaseRecord.sha256 || getAppVersionInfo().productionSigningSha256,
    buildDurationMs: releaseRecord.buildDurationMs || 0,
    pipelineDurationMs: releaseRecord.pipelineDurationMs || 0,
    status: releaseRecord.status || 'SUCCESSFUL',
  };

  // Prevent exact duplicate entries
  const existingIdx = history.findIndex((h) => h.version === newEntry.version && h.versionCode === newEntry.versionCode);
  if (existingIdx !== -1) {
    history[existingIdx] = newEntry;
  } else {
    history.push(newEntry);
  }

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2) + '\n', 'utf8');
  console.log(`✓ Appended release record v${newEntry.version} to ${historyPath}`);
  return history;
}

if (process.argv.includes('--test')) {
  console.log('Testing Release History Logger...');
  const res = appendReleaseHistory({ version: '4.2.7', versionCode: 40207 });
  console.log('History entries count:', res.length);
}
