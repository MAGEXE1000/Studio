import { execSync } from 'node:child_process';

const REPO_SLUG = 'MAGEXE1000/Studio';

export async function fetchGitHubReleaseInfo(tag, options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const execFn = options.execFn || execSync;
  const targetTag = tag.startsWith('v') ? tag : `v${tag}`;

  let releaseData = null;
  let releaseExists = false;

  // 1. Attempt gh CLI query
  try {
    const rawJson = execFn(`gh release view ${targetTag} --repo ${REPO_SLUG} --json tagName,name,assets,isDraft,isPrerelease`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    if (rawJson) {
      releaseData = JSON.parse(rawJson);
      releaseExists = true;
    }
  } catch (_) {
    // 2. Fallback to public GitHub API
    try {
      const apiRes = await fetchFn(`https://api.github.com/repos/${REPO_SLUG}/releases/tags/${targetTag}`, {
        headers: { 'User-Agent': 'ReleaseValidator/1.0', Accept: 'application/vnd.github.v3+json' },
      });
      if (apiRes.ok) {
        const json = await apiRes.json();
        releaseData = {
          tagName: json.tag_name,
          name: json.name,
          assets: json.assets.map((a) => ({
            name: a.name,
            url: a.browser_download_url,
            size: a.size,
            contentType: a.content_type,
          })),
        };
        releaseExists = true;
      }
    } catch (_) {}
  }

  // 3. Fallback to HEAD request on tag release page
  if (!releaseExists) {
    try {
      const tagHead = await fetchFn(`https://github.com/${REPO_SLUG}/releases/tag/${targetTag}`, { method: 'HEAD' });
      if (tagHead.ok || tagHead.status === 302 || tagHead.status === 301) {
        releaseExists = true;
      }
    } catch (_) {}
  }

  return {
    exists: releaseExists,
    tag: targetTag,
    data: releaseData,
  };
}
