import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkGitHubRelease } from './checks/githubCheck.mjs';
import { checkGitTag } from './checks/tagCheck.mjs';
import { checkApkIntegrity } from './checks/apkCheck.mjs';
import { checkFirebaseMetadata } from './checks/firebaseCheck.mjs';
import { checkOtaAndUpdater } from './checks/otaCheck.mjs';
import { checkSignature } from './checks/signatureCheck.mjs';
import { buildDoctorReport } from './report.mjs';
import { fetchFirebaseReleaseMetadata } from '../release/firebase.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../../..');

export async function runReleaseDoctor(options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const appVersionPath = path.join(repoRoot, 'packages/studio-core/src/lib/startup/appVersion.ts');
  let currentVersion = '4.3.54';

  if (fs.existsSync(appVersionPath)) {
    const src = fs.readFileSync(appVersionPath, 'utf8');
    const match = src.match(/export\s+const\s+NATIVE_VERSION\s*=\s*['"]([^'"]+)['"]/);
    if (match) currentVersion = match[1];
  }

  // Resolve deployed release version (e.g., 4.3.53) for GitHub and Tag checks
  let targetReleaseVersion = currentVersion;
  const fbMeta = await fetchFirebaseReleaseMetadata({ fetchFn });
  if (fbMeta.ok && fbMeta.version) {
    targetReleaseVersion = fbMeta.version;
  }

  const results = [];
  results.push(await checkGitHubRelease(targetReleaseVersion, options));
  results.push(await checkGitTag(targetReleaseVersion, options));
  results.push(await checkApkIntegrity(options));
  results.push(await checkFirebaseMetadata(options));
  results.push(await checkOtaAndUpdater(options));
  results.push(await checkSignature(options));

  const report = buildDoctorReport(results);
  return report;
}
