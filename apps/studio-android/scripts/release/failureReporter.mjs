import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

export function createReleaseFailureReport(details = {}) {
  const { failedStep, rootCause, evidence, suggestedFix, nextCommand, priority, expectedResolution } = details;
  const reportPath = path.join(repoRoot, 'release_failure_report.md');

  const content = `# Automatic Release Failure Report

> [!CAUTION]
> **Release Validation / Dry Run Blocked**

### Summary
- **Failed Step**: ${failedStep || 'Unknown Step'}
- **Priority**: ${priority || 'HIGH'}
- **Timestamp**: ${new Date().toISOString()}

---

### Diagnostic Analysis
- **Root Cause**: ${rootCause || 'No root cause specified.'}
- **Evidence**: ${evidence || 'See logs above.'}
- **Expected Resolution**: ${expectedResolution || 'All release invariants passed.'}

---

### Actionable Recovery Steps
1. **Suggested Fix**: \`${suggestedFix || 'Investigate release failure details.'}\`
2. **Next Command**: \`${nextCommand || 'pnpm release:doctor'}\`
`;

  fs.writeFileSync(reportPath, content, 'utf8');
  console.log(`\x1b[31m⚠ Failure report written to ${reportPath}\x1b[0m`);
  return reportPath;
}
