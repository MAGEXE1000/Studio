export function buildDiagnosticReport(caseType, details = {}) {
  const { firebaseVersion, githubTag, apkUrl, httpStatus, rootCause, steps, provider } = details;

  const header = `====================================================================`;
  let title = '';
  switch (caseType) {
    case 'CASE_B':
      title = 'INTERRUPTED RELEASE DETECTED (CASE B: MISSING RELEASE ASSET)';
      break;
    case 'CASE_C':
      title = 'CRITICAL REPOSITORY INCONSISTENCY DETECTED (CASE C: INCOMPLETE DEPLOYMENT)';
      break;
    case 'CASE_D':
      title = 'CASE D: FIRST VALID RELEASE DETECTED';
      break;
    case 'CASE_E':
      title = 'CASE E: INTENTIONAL REPOSITORY HISTORY RESET CONFIRMED';
      break;
    default:
      title = `RELEASE DIAGNOSTIC (${caseType})`;
  }

  const lines = [
    header,
    title,
    header,
    `Provider:                  ${provider || 'N/A'}`,
    `Firebase Deployed Version: ${firebaseVersion || '(none)'}`,
    `GitHub Release Tag:        ${githubTag || '(none)'}`,
    `Target Previous APK URL:   ${apkUrl || '(none)'}`,
    `Asset HTTP Status:         ${httpStatus || 'N/A'}`,
    '',
    'ROOT CAUSE:',
    rootCause || 'Unknown inconsistency.',
  ];

  if (Array.isArray(steps) && steps.length > 0) {
    lines.push('', 'ACTIONABLE RECOVERY STEPS:');
    steps.forEach((step, idx) => {
      lines.push(`${idx + 1}. ${step}`);
    });
  }

  lines.push(header);
  return lines.join('\n');
}
