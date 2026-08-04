#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { getAppVersionInfo } from './parse-version.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

export function getGitInfo() {
  const runGit = (args) => {
    try {
      const res = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
      return res.status === 0 ? res.stdout.trim() : 'unknown';
    } catch (_) {
      return 'unknown';
    }
  };

  return {
    commitSha: runGit(['rev-parse', 'HEAD']),
    shortSha: runGit(['rev-parse', '--short', 'HEAD']),
    branch: runGit(['rev-parse', '--abbrev-ref', 'HEAD']),
    lastTag: runGit(['describe', '--tags', '--abbrev=0']),
  };
}

export function getToolchainVersions() {
  const getPkgVersion = (pkgPath) => {
    try {
      if (fs.existsSync(pkgPath)) {
        return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || 'unknown';
      }
    } catch (_) {}
    return 'unknown';
  };

  const getCmdVersion = (cmd, args = ['--version']) => {
    try {
      const res = spawnSync(cmd, args, { cwd: repoRoot, encoding: 'utf8', shell: process.platform === 'win32' });
      if (res.status === 0) {
        const match = (res.stdout || '').match(/\d+\.\d+\.\d+/);
        return match ? match[0] : res.stdout.trim().split('\n')[0];
      }
    } catch (_) {}
    return 'unknown';
  };

  return {
    node: process.version,
    pnpm: getCmdVersion('pnpm'),
    java: getCmdVersion('java', ['-version']),
    capacitor: getPkgVersion(path.join(repoRoot, 'node_modules/@capacitor/core/package.json')),
    vite: getPkgVersion(path.join(repoRoot, 'node_modules/vite/package.json')),
    androidSdk: process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || 'default-ci-sdk',
  };
}

export function generateReleaseManifest(options = {}) {
  const git = getGitInfo();
  const toolchain = getToolchainVersions();

  const version = options.version || '4.2.7';
  const versionCode = options.versionCode || 40207;
  const apkPath = options.apkPath || path.join(repoRoot, 'apps/studio-android/android/app/build/outputs/apk/release/app-release.apk');
  const apkFilename = options.apkFilename || `studio-${version}.apk`;

  let apkSizeBytes = 0;
  let sha256 = options.sha256 || '';

  if (fs.existsSync(apkPath)) {
    const stat = fs.statSync(apkPath);
    apkSizeBytes = stat.size;
    if (!sha256) {
      const buf = fs.readFileSync(apkPath);
      sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    }
  }

  const manifest = {
    $schema: 'https://livex.app/schemas/release-manifest.v1.json',
    manifestVersion: '1.0.0',
    version,
    versionCode,
    releaseTag: `v${version}`,
    buildTimestampUtc: new Date().toISOString(),
    git: {
      commitSha: git.commitSha,
      shortSha: git.shortSha,
      branch: git.branch,
      previousTag: git.lastTag,
    },
    artifact: {
      filename: apkFilename,
      sizeBytes: apkSizeBytes,
      sizeFormatted: (apkSizeBytes / (1024 * 1024)).toFixed(2) + ' MB',
      sha256,
      signingCertFingerprint: options.signingCertFingerprint || getAppVersionInfo().productionSigningSha256,
    },
    timingMetrics: {
      preflightMs: options.preflightMs || 0,
      buildFrontendMs: options.buildFrontendMs || 0,
      gradleBuildMs: options.gradleBuildMs || 0,
      signingVerificationMs: options.signingVerificationMs || 0,
      uploadMs: options.uploadMs || 0,
      totalPipelineMs: options.totalPipelineMs || 0,
    },
    toolchain,
    metadataVersions: {
      appReleaseSchema: '1.0.0',
      otaMetadataVersion: '4.0.0',
      firebaseHostingChannel: 'live',
    },
  };

  const outputPath = path.join(repoRoot, 'release-manifest.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`✓ Release Manifest generated successfully: ${outputPath}`);
  return manifest;
}

if (process.argv.includes('--test')) {
  console.log('Testing Release Manifest generation...');
  const manifest = generateReleaseManifest();
  console.log('Sample Manifest Keys:', Object.keys(manifest));
}
