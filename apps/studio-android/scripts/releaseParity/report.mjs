import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

export function generateParityReports(comparison = {}) {
  const mdPath = path.join(repoRoot, 'release-parity-report.md');
  const htmlPath = path.join(repoRoot, 'release-parity-report.html');
  const jsonSummaryPath = path.join(repoRoot, 'release-parity-summary.json');

  const allPass = comparison.allPass;

  const mdContent = `# Studio Release Pipeline Parity Report

## Overview
- **Timestamp**: ${new Date().toISOString()}
- **Repository Status**: ${allPass ? 'CONSISTENT' : 'INCONSISTENT'}
- **Overall Result**: ${allPass ? 'PASS' : 'FAIL'}

## Stage Parity Verification
| Release Stage | Production Workflow | Simulator | Status |
|---------------|---------------------|-----------|--------|
${(comparison.parityChecks || []).map((c) => `| ${c.stage} | ${c.workflowPresent ? 'PRESENT' : 'MISSING'} | ${c.simulatorPresent ? 'PRESENT' : 'MISSING'} | ${c.pass ? 'PASS' : 'FAIL'} |`).join('\n')}
`;

  fs.writeFileSync(mdPath, mdContent, 'utf8');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Release Parity Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    h1 { color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #334155; padding: 0.75rem; text-align: left; }
    th { background: #1e293b; color: #94a3b8; }
    .pass { color: #4ade80; font-weight: bold; }
    .fail { color: #f87171; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Studio Release Pipeline Parity Report</h1>
  <table>
    <thead>
      <tr><th>Release Stage</th><th>Production Workflow</th><th>Simulator</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${(comparison.parityChecks || []).map((c) => `<tr><td>${c.stage}</td><td>${c.workflowPresent ? 'PRESENT' : 'MISSING'}</td><td>${c.simulatorPresent ? 'PRESENT' : 'MISSING'}</td><td class="${c.pass ? 'pass' : 'fail'}">${c.pass ? 'PASS' : 'FAIL'}</td></tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  const jsonSummary = {
    timestamp: new Date().toISOString(),
    repositoryStatus: allPass ? 'CONSISTENT' : 'INCONSISTENT',
    overallResult: allPass ? 'PASS' : 'FAIL',
    parityChecks: comparison.parityChecks,
  };
  fs.writeFileSync(jsonSummaryPath, JSON.stringify(jsonSummary, null, 2), 'utf8');

  console.log(`✓ Generated release-parity-report.md, release-parity-report.html, and release-parity-summary.json.`);
}
