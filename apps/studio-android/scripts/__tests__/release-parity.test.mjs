import assert from 'node:assert/strict';
import { compareReleaseParity } from '../releaseParity/comparator.mjs';

console.log('=== RUNNING RELEASE PARITY TEST SUITE ===');

function testParityMatch() {
  console.log('\n[Test 1] Complete Stage Parity Match');
  const workflowStages = ['Preflight & Audit', 'Release Manifest Generation', 'Signing Validation', 'Firebase Metadata Validation', 'OTA & Updater Validation', 'GitHub Release Publication'];
  const simulatorStages = ['Preflight & Audit', 'Release Manifest Generation', 'Signing Validation', 'Firebase Metadata Validation', 'OTA & Updater Validation', 'GitHub Release Publication'];

  const res = compareReleaseParity(workflowStages, simulatorStages);
  assert.equal(res.allPass, true);
  console.log('✓ PASS: Complete stage parity match verified');
}

function testParityMismatch() {
  console.log('\n[Test 2] Missing Stage Parity Mismatch');
  const workflowStages = ['Preflight & Audit', 'Release Manifest Generation'];
  const simulatorStages = ['Preflight & Audit'];

  const res = compareReleaseParity(workflowStages, simulatorStages);
  assert.equal(res.allPass, false);
  console.log('✓ PASS: Missing stage mismatch caught correctly');
}

function runAll() {
  testParityMatch();
  testParityMismatch();

  console.log('\n====================================================================');
  console.log('ALL RELEASE PARITY TEST SCENARIOS PASSED CLEANLY (2/2)');
  console.log('====================================================================\n');
}

runAll();
