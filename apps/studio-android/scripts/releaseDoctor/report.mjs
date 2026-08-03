import { formatTable } from './formatter.mjs';

export function buildDoctorReport(checkResults = []) {
  const total = checkResults.length;
  const passed = checkResults.filter((c) => c.pass).length;
  const healthPercent = total > 0 ? Math.round((passed / total) * 100) : 0;

  const header = [
    '====================================================================',
    '                   STUDIO RELEASE DOCTOR REPORT                    ',
    '====================================================================',
  ].join('\n');

  const tableStr = formatTable(checkResults);

  const failedChecks = checkResults.filter((c) => !c.pass);

  let failureDetails = '';
  if (failedChecks.length > 0) {
    failureDetails = [
      '',
      '====================================================================',
      '                     DETAILED DIAGNOSTIC REPORT                     ',
      '====================================================================',
      ...failedChecks.map((f, idx) =>
        [
          `[Failure ${idx + 1}] Component: ${f.name}`,
          `Status:              FAILED`,
          `Provider:            ${f.provider || 'N/A'}`,
          `Priority:            ${f.priority || 'HIGH'}`,
          `Root Cause:          ${f.rootCause}`,
          `Suggested Fix:       ${f.suggestedFix}`,
          `Expected Resolution: ${f.expectedResolution}`,
          '--------------------------------------------------------------------',
        ].join('\n')
      ),
    ].join('\n');
  }

  const summary = [
    '',
    '====================================================================',
    `Overall Health:      ${healthPercent}% (${passed}/${total} checks passed)`,
    `Status:              ${healthPercent === 100 ? '\x1b[32mHEALTHY (100%)\x1b[0m' : '\x1b[31mDEGRADED\x1b[0m'}`,
    '====================================================================',
  ].join('\n');

  return {
    healthPercent,
    isHealthy: healthPercent === 100,
    output: `${header}\n${tableStr}${failureDetails}\n${summary}`,
  };
}
