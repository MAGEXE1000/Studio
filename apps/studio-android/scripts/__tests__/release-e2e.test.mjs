import assert from 'node:assert/strict';
import { simulateGitHubRelease, simulateFirebaseMetadata, simulateSimulatedManifest } from '../releaseE2E/simulator.mjs';
import { verifySimulatedRelease } from '../releaseE2E/verifier.mjs';

console.log('=== RUNNING RELEASE E2E TEST SUITE ===');

function testNormalRelease() {
  console.log('\n[Test 1] Normal Release Simulation');
  const gh = simulateGitHubRelease('4.3.55');
  const fb = { version: '4.3.55', sha256: '032bc2a0132388558d9bbe8956ed4047e5e1dfb5d528222989d6b5cd927d1f7f', signatures: '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206' };
  const manifest = { version: '4.3.55', releaseTag: 'v4.3.55', artifact: { sha256: '032bc2a0132388558d9bbe8956ed4047e5e1dfb5d528222989d6b5cd927d1f7f', signingCertFingerprint: '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206' } };

  const checks = verifySimulatedRelease(gh, fb, manifest);
  assert.equal(checks.every((c) => c.pass), true);
  console.log('✓ PASS: Normal release simulation verified');
}

function testMetadataMismatch() {
  console.log('\n[Test 2] Version & Checksum Mismatch Detection');
  const gh = simulateGitHubRelease('4.3.55');
  const fbBad = { version: '4.3.54', sha256: 'bad-sha', signatures: 'bad-sig' };
  const manifest = { version: '4.3.55', releaseTag: 'v4.3.55', artifact: { sha256: '032bc2a0132388558d9bbe8956ed4047e5e1dfb5d528222989d6b5cd927d1f7f', signingCertFingerprint: '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206' } };

  const checks = verifySimulatedRelease(gh, fbBad, manifest);
  assert.equal(checks.every((c) => c.pass), false);
  console.log('✓ PASS: Mismatch detected as expected');
}

function runAll() {
  testNormalRelease();
  testMetadataMismatch();

  console.log('\n====================================================================');
  console.log('ALL RELEASE E2E TEST SCENARIOS PASSED CLEANLY (2/2)');
  console.log('====================================================================\n');
}

runAll();
