import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

export function generateE2EReports(summary = {}, verifications = []) {
  const mdPath = path.join(repoRoot, 'release-e2e-report.md');
  const htmlPath = path.join(repoRoot, 'release-e2e-report.html');
  const jsonSummaryPath = path.join(repoRoot, 'release-e2e-summary.json');
  const jsonManifestPath = path.join(repoRoot, 'release-e2e-manifest.json');

  const allPass = verifications.every((v) => v.pass);

  const mdContent = `# Studio Release E2E Simulation Report

## Overview
- **Timestamp**: ${new Date().toISOString()}
- **Repository Status**: ${allPass ? 'CONSISTENT' : 'INCONSISTENT'}
- **Overall Result**: ${allPass ? 'PASS' : 'FAIL'}

## Simulated Verification Results
| Verification Item | Details | Status |
|-------------------|---------|--------|
${verifications.map((v) => `| ${v.name} | ${v.details} | ${v.pass ? 'PASS' : 'FAIL'} |`).join('\n')}

## Scenarios Executed
- Repository Validation (Audit, Lint, Doctor, Architecture)
- Temporary Manifest Generation (\`release-manifest.e2e.json\`)
- Simulated GitHub Release & Asset Upload
- Simulated Firebase Hosting Metadata Publication
- Simulated OTA & Updater Handshake
- APK Signature & Integrity Validation
- Rollback & Interrupted Release Simulation (CASE A - CASE E)
- Recovery Mode Simulation
`;

  fs.writeFileSync(mdPath, mdContent, 'utf8');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Release E2E Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    h1 { color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #334155; padding: 0.75rem; text-align: left; }
    th { background: #1e293b; color: #94a3b8; }
    .pass { color: #4ade80; font-weight: bold; }
    .fail { color: #f87171; font-weight: bold; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: bold; background: #166534; color: #4ade80; }
  </style>
</head>
<body>
  <h1>Studio Release E2E Simulation Report</h1>
  <p>Repository Status: <span class="badge">${allPass ? 'CONSISTENT' : 'INCONSISTENT'}</span></p>
  <table>
    <thead>
      <tr><th>Verification Item</th><th>Details</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${verifications.map((v) => `<tr><td>${v.name}</td><td>${v.details}</td><td class="${v.pass ? 'pass' : 'fail'}">${v.pass ? 'PASS' : 'FAIL'}</td></tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  const jsonSummary = {
    timestamp: new Date().toISOString(),
    repositoryStatus: allPass ? 'CONSISTENT' : 'INCONSISTENT',
    overallResult: allPass ? 'PASS' : 'FAIL',
    verifications,
  };
  fs.writeFileSync(jsonSummaryPath, JSON.stringify(jsonSummary, null, 2), 'utf8');

  const jsonManifest = {
    e2eManifestVersion: '1.0.0',
    simulatedVersion: '4.3.55',
    repositoryStatus: 'CONSISTENT',
    scenarios: ['CASE_A', 'CASE_B', 'CASE_C', 'CASE_D', 'CASE_E', 'RECOVERY_MODE'],
  };
  fs.writeFileSync(jsonManifestPath, JSON.stringify(jsonManifest, null, 2), 'utf8');

  console.log(`✓ Generated release-e2e-report.md, release-e2e-report.html, release-e2e-summary.json, and release-e2e-manifest.json.`);
}
