export const RELEASE_STATES = {
  CONSISTENT: 'CONSISTENT',
  FIRST_RELEASE: 'FIRST_RELEASE',
  INTERRUPTED_RELEASE: 'INTERRUPTED_RELEASE',
  PARTIAL_PUBLICATION: 'PARTIAL_PUBLICATION',
  ROLLBACK_REQUIRED: 'ROLLBACK_REQUIRED',
  MISSING_RELEASE: 'MISSING_RELEASE',
  MISSING_TAG: 'MISSING_TAG',
  MISSING_APK: 'MISSING_APK',
  METADATA_MISMATCH: 'METADATA_MISMATCH',
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  READY: 'READY',
  BLOCKED: 'BLOCKED',
  RECOVERY_REQUIRED: 'RECOVERY_REQUIRED',
};

export class ReleaseStateMachine {
  constructor(initialState = RELEASE_STATES.CONSISTENT) {
    this.currentState = initialState;
    this.history = [initialState];
  }

  transition(newState, reason = '') {
    if (!Object.values(RELEASE_STATES).includes(newState)) {
      throw new Error(`Invalid release state transition target: ${newState}`);
    }
    console.log(`[State Transition] ${this.currentState} → ${newState} (${reason})`);
    this.currentState = newState;
    this.history.push(newState);
    return this.currentState;
  }

  isBlocked() {
    return [
      RELEASE_STATES.BLOCKED,
      RELEASE_STATES.INTERRUPTED_RELEASE,
      RELEASE_STATES.PARTIAL_PUBLICATION,
      RELEASE_STATES.MISSING_RELEASE,
      RELEASE_STATES.MISSING_TAG,
      RELEASE_STATES.MISSING_APK,
      RELEASE_STATES.METADATA_MISMATCH,
      RELEASE_STATES.SIGNATURE_MISMATCH,
      RELEASE_STATES.RECOVERY_REQUIRED,
    ].includes(this.currentState);
  }
}

export function buildVersionSyncTable(rows = []) {
  const header = `+--------------------+--------------------+--------------------+--------+`;
  const lines = [
    `----------------------------------------`,
    `Version Synchronization Table           `,
    `----------------------------------------`,
    header,
    `| Component          | Current Value      | Expected Value     | Status |`,
    header,
  ];

  for (const r of rows) {
    const component = (r.component || '').padEnd(18);
    const current = (r.current || 'N/A').padEnd(18);
    const expected = (r.expected || 'N/A').padEnd(18);
    const statusStr = r.pass ? '\x1b[32mPASS\x1b[0m  ' : '\x1b[31mFAIL\x1b[0m  ';
    lines.push(`| ${component} | ${current} | ${expected} | ${statusStr} |`);
  }
  lines.push(header);
  return lines.join('\n');
}
