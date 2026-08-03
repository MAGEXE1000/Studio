import { fetchFirebaseReleaseMetadata } from '../../release/firebase.mjs';

export async function checkFirebaseMetadata(options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;

  const fbResult = await fetchFirebaseReleaseMetadata({ fetchFn });

  if (!fbResult.ok && fbResult.status === 404) {
    return {
      name: 'Firebase',
      pass: true,
      details: 'Firebase Hosting app-release.json returns HTTP 404 (Initial Release)',
    };
  }

  if (!fbResult.ok) {
    return {
      name: 'Firebase',
      pass: false,
      rootCause: `Firebase metadata request failed: ${fbResult.error}`,
      suggestedFix: 'Verify Firebase Hosting status and studio-30f44 project configuration.',
      priority: 'HIGH',
      expectedResolution: 'Firebase app-release.json returns HTTP 200.',
    };
  }

  if (!fbResult.version || !fbResult.versionCode) {
    return {
      name: 'Firebase',
      pass: false,
      rootCause: 'Firebase app-release.json missing version or versionCode field.',
      suggestedFix: 'Re-generate metadata using generate-release-metadata.mjs.',
      priority: 'HIGH',
      expectedResolution: 'Valid version and versionCode fields present in app-release.json.',
    };
  }

  return {
    name: 'Firebase',
    pass: true,
    details: `Deployed Version: ${fbResult.version} (versionCode: ${fbResult.versionCode})`,
  };
}
