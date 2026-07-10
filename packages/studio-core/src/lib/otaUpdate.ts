/**
 * otaUpdate.ts — SHIM
 *
 * All OTA updater logic has been extracted into lib/updater/*.ts
 * This file is preserved so that existing import paths continue to work.
 *
 * @see lib/updater/index.ts     — full public API barrel
 * @see lib/updater/pipeline.ts  — check / download / apply pipeline
 * @see lib/updater/telemetry.ts — logDiagnosticEvent, logDetailedJsTrace
 * @see lib/updater/useOtaUpdate.ts — React hooks
 */

export * from './updater/index';
