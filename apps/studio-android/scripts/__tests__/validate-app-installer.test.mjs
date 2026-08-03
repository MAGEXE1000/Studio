import assert from 'node:assert/strict';
import { evaluatePreviousReleaseState } from '../release/index.mjs';

console.log('=== RUNNING PREVIOUS APK VALIDATION CLASSIFIER TEST SUITE ===');

async function testCaseD_FirstRelease() {
  console.log('\n[Test 1] CASE D: First Release / Missing Firebase metadata (HTTP 404)');
  const mockFetch = async (url) => {
    if (url.includes('app-release.json')) {
      return { status: 404, ok: false };
    }
    return { status: 404, ok: false };
  };

  const result = await evaluatePreviousReleaseState({ fetchFn: mockFetch });
  assert.equal(result.case, 'CASE_D');
  assert.equal(result.pass, true);
  console.log('✓ PASS: Correctly classified as CASE_D (First Release)');
}

async function testCaseC_MissingGitHubReleaseTag() {
  console.log('\n[Test 2] CASE C: Firebase version exists, but GitHub Release tag is missing');
  const mockFetch = async (url) => {
    if (url.includes('app-release.json')) {
      return {
        status: 200,
        ok: true,
        json: async () => ({ version: '4.3.50', versionCode: 40350 }),
      };
    }
    return { status: 404, ok: false };
  };

  const mockExec = () => {
    throw new Error('Release tag v4.3.50 not found');
  };

  const result = await evaluatePreviousReleaseState({
    fetchFn: mockFetch,
    execFn: mockExec,
    allowMissingApk: false,
  });
  assert.equal(result.case, 'CASE_C');
  assert.equal(result.pass, false);
  assert.match(result.diagnostic, /CRITICAL REPOSITORY INCONSISTENCY DETECTED/);
  console.log('✓ PASS: Correctly classified as CASE_C (Incomplete Deployment / Missing Release Tag)');
}

async function testCaseB_MissingApkAsset() {
  console.log('\n[Test 3] CASE B: GitHub Release tag exists, but APK asset returns HTTP 404');
  const mockFetch = async (url) => {
    if (url.includes('app-release.json')) {
      return {
        status: 200,
        ok: true,
        json: async () => ({ version: '4.3.50', versionCode: 40350 }),
      };
    }
    if (url.includes('.apk')) {
      return { status: 404, ok: false };
    }
    return { status: 200, ok: true };
  };

  const mockExec = (cmd) => {
    if (cmd.includes('gh release view v4.3.50')) {
      return 'v4.3.50\nTitle: Release v4.3.50';
    }
    return '';
  };

  const result = await evaluatePreviousReleaseState({
    fetchFn: mockFetch,
    execFn: mockExec,
    allowMissingApk: false,
  });
  assert.equal(result.case, 'CASE_B');
  assert.equal(result.pass, false);
  assert.match(result.diagnostic, /INTERRUPTED RELEASE DETECTED/);
  console.log('✓ PASS: Correctly classified as CASE_B (Interrupted Release / Missing APK Asset)');
}

async function testCaseA_NormalRelease() {
  console.log('\n[Test 4] CASE A: Normal release (GitHub Release tag and APK asset both exist)');
  const mockFetch = async (url) => {
    if (url.includes('app-release.json')) {
      return {
        status: 200,
        ok: true,
        json: async () => ({ version: '4.3.50', versionCode: 40350 }),
      };
    }
    if (url.includes('studio-4.3.50.apk')) {
      return { status: 200, ok: true };
    }
    return { status: 200, ok: true };
  };

  const mockExec = (cmd) => {
    if (cmd.includes('gh release view v4.3.50')) {
      return 'v4.3.50\nTitle: Release v4.3.50';
    }
    return '';
  };

  const result = await evaluatePreviousReleaseState({
    fetchFn: mockFetch,
    execFn: mockExec,
    allowMissingApk: false,
  });
  assert.equal(result.case, 'CASE_A');
  assert.equal(result.pass, true);
  console.log('✓ PASS: Correctly classified as CASE_A (Normal Release)');
}

async function testCaseE_IntentionalHistoryReset() {
  console.log('\n[Test 5] CASE E: Intentional history reset confirmed');
  const mockFetch = async (url) => {
    if (url.includes('app-release.json')) {
      return {
        status: 200,
        ok: true,
        json: async () => ({ version: '4.3.50', versionCode: 40350 }),
      };
    }
    return { status: 200, ok: true };
  };

  const result = await evaluatePreviousReleaseState({
    fetchFn: mockFetch,
    resetConfirmed: true,
  });
  assert.equal(result.case, 'CASE_E');
  assert.equal(result.pass, true);
  assert.match(result.diagnostic, /INTENTIONAL REPOSITORY HISTORY RESET CONFIRMED/);
  console.log('✓ PASS: Correctly classified as CASE_E (Intentional Version Reset)');
}

async function testEmergencyBypass() {
  console.log('\n[Test 6] Emergency Bypass via ALLOW_MISSING_PREV_APK=true');
  const mockFetch = async (url) => {
    if (url.includes('app-release.json')) {
      return {
        status: 200,
        ok: true,
        json: async () => ({ version: '4.3.50', versionCode: 40350 }),
      };
    }
    return { status: 404, ok: false };
  };

  const mockExec = () => {
    throw new Error('Release tag missing');
  };

  const result = await evaluatePreviousReleaseState({
    fetchFn: mockFetch,
    execFn: mockExec,
    allowMissingApk: true,
  });
  assert.equal(result.case, 'CASE_C');
  assert.equal(result.pass, true);
  assert.equal(result.bypassed, true);
  console.log('✓ PASS: Correctly allowed bypass when allowMissingApk=true is explicitly set');
}

async function runAll() {
  await testCaseD_FirstRelease();
  await testCaseC_MissingGitHubReleaseTag();
  await testCaseB_MissingApkAsset();
  await testCaseA_NormalRelease();
  await testCaseE_IntentionalHistoryReset();
  await testEmergencyBypass();
  console.log('\n====================================================================');
  console.log('ALL PREVIOUS APK VALIDATION TESTS PASSED CLEANLY (6/6)');
  console.log('====================================================================\n');
}

runAll().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
