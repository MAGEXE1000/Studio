import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

export function generateHtmlDoctorReport(checkResults, reportData) {
  const htmlPath = path.join(repoRoot, 'release-doctor.html');
  const now = new Date().toISOString();

  const rowsHtml = checkResults
    .map(
      (c) => `
      <tr class="${c.pass ? 'pass' : 'fail'}">
        <td><strong>${c.name}</strong></td>
        <td><span class="badge ${c.pass ? 'bg-pass' : 'bg-fail'}">${c.pass ? 'PASS' : 'FAILED'}</span></td>
        <td>${c.provider || 'N/A'}</td>
        <td>${c.details || c.rootCause || ''}</td>
      </tr>
    `
    )
    .join('\n');

  const failedHtml = checkResults
    .filter((c) => !c.pass)
    .map(
      (f, idx) => `
      <div class="card card-fail">
        <h3>[Failure ${idx + 1}] Component: ${f.name}</h3>
        <p><strong>Priority:</strong> ${f.priority || 'HIGH'}</p>
        <p><strong>Root Cause:</strong> ${f.rootCause}</p>
        <p><strong>Suggested Fix:</strong> <code>${f.suggestedFix}</code></p>
        <p><strong>Expected Resolution:</strong> ${f.expectedResolution}</p>
      </div>
    `
    )
    .join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Studio Release Doctor Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; margin: 0; }
    .container { max-width: 960px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { margin-top: 0; color: #38bdf8; font-size: 28px; border-bottom: 2px solid #334155; padding-bottom: 15px; }
    .score-box { display: flex; align-items: center; justify-content: space-between; background: #334155; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
    .score { font-size: 36px; font-weight: bold; color: ${reportData.isHealthy ? '#4ade80' : '#f87171'}; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; font-size: 13px; text-transform: uppercase; }
    tr.pass:hover { background: rgba(74, 222, 128, 0.05); }
    tr.fail:hover { background: rgba(248, 113, 113, 0.05); }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .bg-pass { background: #166534; color: #4ade80; }
    .bg-fail { background: #991b1b; color: #f87171; }
    .card { background: #0f172a; border-left: 4px solid #f87171; padding: 15px 20px; border-radius: 6px; margin-bottom: 15px; }
    code { background: #334155; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #f43f5e; }
    .timestamp { font-size: 12px; color: #64748b; margin-top: 20px; text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Studio Release Doctor Report</h1>
    <div class="score-box">
      <div>
        <div style="font-size: 14px; color: #94a3b8;">Overall Release Ecosystem Health</div>
        <div class="score">${reportData.healthPercent}%</div>
      </div>
      <div>
        <span class="badge ${reportData.isHealthy ? 'bg-pass' : 'bg-fail'}" style="font-size: 16px; padding: 8px 16px;">
          ${reportData.isHealthy ? 'READY FOR PRODUCTION RELEASE' : 'DEGRADED / ACTION REQUIRED'}
        </span>
      </div>
    </div>

    <h2>Component Health Matrix</h2>
    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Status</th>
          <th>Provider</th>
          <th>Diagnostic / Details</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    ${failedHtml ? `<h2>Actionable Failure Diagnostics</h2>${failedHtml}` : ''}

    <div class="timestamp">Generated: ${now}</div>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  return htmlPath;
}
