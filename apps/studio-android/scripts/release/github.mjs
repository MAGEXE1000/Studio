import { execSync } from 'node:child_process';

const REPO_SLUG = 'MAGEXE1000/Studio';
const [OWNER, REPO] = REPO_SLUG.split('/');

export async function fetchGitHubReleaseInfo(tag, options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const execFn = options.execFn || execSync;
  const token = options.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const targetTag = tag.startsWith('v') ? tag : `v${tag}`;

  let releaseData = null;
  let releaseExists = false;
  let provider = 'None';

  // 1. Primary: GitHub REST API
  try {
    const headers = {
      'User-Agent': 'ReleaseValidator/1.0',
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) headers.Authorization = `token ${token}`;

    const apiRes = await fetchFn(`https://api.github.com/repos/${REPO_SLUG}/releases/tags/${targetTag}`, {
      headers,
    });

    if (apiRes.ok) {
      const json = await apiRes.json();
      releaseData = {
        tagName: json.tag_name,
        name: json.name,
        isDraft: json.draft || false,
        isPrerelease: json.prerelease || false,
        publishedAt: json.published_at,
        assets: Array.isArray(json.assets)
          ? json.assets.map((a) => ({
              name: a.name,
              url: a.browser_download_url,
              size: a.size,
              contentType: a.content_type,
            }))
          : [],
      };
      releaseExists = !releaseData.isDraft;
      provider = 'REST API';
      return { exists: releaseExists, tag: targetTag, data: releaseData, provider };
    }
  } catch (_) {}

  // 2. Secondary: GitHub GraphQL API
  if (!releaseExists && token) {
    try {
      const graphqlQuery = {
        query: `
          query ($owner: String!, $repo: String!, $tag: String!) {
            repository(owner: $owner, name: $repo) {
              release(tagName: $tag) {
                tagName
                name
                isDraft
                isPrerelease
                publishedAt
                releaseAssets(first: 20) {
                  nodes {
                    name
                    downloadUrl
                    size
                    contentType
                  }
                }
              }
            }
          }
        `,
        variables: { owner: OWNER, repo: REPO, tag: targetTag },
      };

      const gqlRes = await fetchFn('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'User-Agent': 'ReleaseValidator/1.0',
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphqlQuery),
      });

      if (gqlRes.ok) {
        const gqlJson = await gqlRes.json();
        const release = gqlJson.data?.repository?.release;
        if (release) {
          releaseData = {
            tagName: release.tagName,
            name: release.name,
            isDraft: release.isDraft,
            isPrerelease: release.isPrerelease,
            publishedAt: release.publishedAt,
            assets: release.releaseAssets?.nodes?.map((a) => ({
              name: a.name,
              url: a.downloadUrl,
              size: a.size,
              contentType: a.contentType,
            })) || [],
          };
          releaseExists = !releaseData.isDraft;
          provider = 'GraphQL';
          return { exists: releaseExists, tag: targetTag, data: releaseData, provider };
        }
      }
    } catch (_) {}
  }

  // 3. Fallback: GitHub CLI (Last Resort Only)
  if (!releaseExists) {
    try {
      const rawJson = execFn(
        `gh release view ${targetTag} --repo ${REPO_SLUG} --json tagName,name,assets,isDraft,isPrerelease`,
        {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        }
      );
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        releaseData = {
          tagName: parsed.tagName,
          name: parsed.name,
          isDraft: parsed.isDraft || false,
          isPrerelease: parsed.isPrerelease || false,
          assets: Array.isArray(parsed.assets)
            ? parsed.assets.map((a) => ({
                name: a.name,
                url: a.url,
                size: a.size || 0,
                contentType: a.contentType || '',
              }))
            : [],
        };
        releaseExists = !releaseData.isDraft;
        provider = 'GitHub CLI Fallback';
        return { exists: releaseExists, tag: targetTag, data: releaseData, provider };
      }
    } catch (_) {}
  }

  // 4. HTTP HEAD tag page fallback check
  if (!releaseExists) {
    try {
      const tagHead = await fetchFn(`https://github.com/${REPO_SLUG}/releases/tag/${targetTag}`, {
        method: 'HEAD',
      });
      if (tagHead.ok || tagHead.status === 302 || tagHead.status === 301) {
        releaseExists = true;
        provider = 'HTTP Fallback';
      }
    } catch (_) {}
  }

  return {
    exists: releaseExists,
    tag: targetTag,
    data: releaseData,
    provider,
  };
}
