import { fetchGitHubReleaseInfo } from '../../release/github.mjs';

export async function checkGitHubRelease(version, options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const execFn = options.execFn || options.execSync;
  const targetVersion = version || '4.3.54';
  const targetTag = `v${targetVersion}`;

  const ghInfo = await fetchGitHubReleaseInfo(targetVersion, { fetchFn, execFn });

  if (!ghInfo.exists) {
    return {
      name: 'GitHub Release',
      pass: false,
      provider: ghInfo.provider,
      rootCause: `GitHub Release tag '${targetTag}' not found.`,
      suggestedFix: `Publish GitHub Release '${targetTag}' with title '${targetVersion}' and release APK asset.`,
      priority: 'CRITICAL',
      expectedResolution: 'GitHub Release exists and is visible on GitHub.',
    };
  }

  // Check title naming policy: Must NOT contain brand names like Livex or Studio
  const title = ghInfo.data?.name || '';
  const forbiddenBrands = ['livex', 'studio'];
  const titleLower = title.toLowerCase();
  const hasBrand = forbiddenBrands.some((b) => titleLower.includes(b));

  if (hasBrand) {
    return {
      name: 'GitHub Release',
      pass: false,
      provider: ghInfo.provider,
      rootCause: `Release title '${title}' violates naming policy! Release titles must contain ONLY version number (e.g., '${targetVersion}').`,
      suggestedFix: `Update release title to '${targetVersion}'.`,
      priority: 'HIGH',
      expectedResolution: `Release title updated to '${targetVersion}'.`,
    };
  }

  return {
    name: 'GitHub Release',
    pass: true,
    provider: ghInfo.provider,
    details: `Tag: ${targetTag}, Title: ${title || targetVersion}, Assets: ${ghInfo.data?.assets?.length || 0}`,
  };
}
