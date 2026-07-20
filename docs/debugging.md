# Chordex Studio — Debugging & Diagnostics Guide

This document defines the debugging workflows, telemetry collection systems, and root-cause analysis instructions.

---

## 1. 10-Step Debugging Workflow

Do not write or modify code when diagnosing a defect. Always follow this 10-step engineering workflow:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 1. Understand   ├─────>│ 2. Gather       ├─────>│ 3. Read Related ├─────┐
│    Problem      │      │    Evidence     │      │    Architecture │     │
└─────────────────┘      └─────────────────┘      └─────────────────┘     │
                                                                          │
                                                                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│ 7. Refactor &   │<─────│ 6. Validate     │<─────│ 5. Produce Plan │<────┤ 4. Locate Root  │
│    Implement    │      │    Assumptions  │      │  (Docs & Diffs) │     │    Cause        │
└────────┬────────┘      └─────────────────┘      └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 8. Build        ├─────>│ 9. Test         ├─────>│ 10. Document &  │
│    Workspace    │      │    Regressions  │      │     Report      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Process Details

1. **Understand Problem**: Document observed symptoms, app states, battery, and storage profiles.
2. **Gather Evidence**: Fetch native console logs, transition history logs, and device configurations.
3. **Read Related Architecture**: Study the codebase design files (e.g. `capgoUpdater.ts` or `otaUpdate.ts`) before editing.
4. **Locate Root Cause**: Pinpoint where code behaviors deviate from specifications.
5. **Produce Plan**: Define affected files, components, and alternative solutions in `docs/architecture_decisions.md`.
6. **Validate Assumptions**: Verify that the proposed changes address the core defect without causing regressions.
7. **Refactor & Implement**: Write code that targets the root cause directly.
8. **Build Workspace**: Build targets via `pnpm run build:android:web` to ensure no typescript errors remain.
9. **Test Regressions**: Validate that credentials and offline databases load correctly.
10. **Document & Report**: Update the relevant engineering docs and push changes to the repository.

Source:

- `AGENTS.md`

---

## 2. Diagnostics Telemetry Collection

To inspect client operations, the app integrates diagnostic reporting overlays inside the developer panel.

### Log Tracing Arrays

- **`stateTimeline`**: Records state machine transitions.
- **`jsLogs`**: Captures frontend React console warnings, errors, and informational logs.
- **`nativeLogsList`**: Records Android PackageInstaller callback responses and system events.

### Snapshot Generation

Copy buttons inside the DevTools panel compile reports via `generateFullEngineeringReport()` to export system states.

To prevent transaction failures inside the Android OS Clipboard service (which caps transactional IPC payloads), the dashboard UI limits clipboard copy operations to a maximum of `400,000` characters:

```typescript
if (text.length > 400000) {
  textToCopy = text.substring(text.length - 400000);
  textToCopy =
    `[WARNING: Report truncated to the last 400,000 characters due to Android clipboard size limits]\n\n...[TRUNCATED]...\n\n` +
    textToCopy;
}
```

Source:

- `packages/ui-shared/src/components/DevToolsDashboard.tsx`
- `packages/studio-core/src/lib/updater/diagnostics.ts`
