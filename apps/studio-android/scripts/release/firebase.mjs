const FIREBASE_METADATA_URL = 'https://studio-30f44.web.app/app-release.json';

export async function fetchFirebaseReleaseMetadata(options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;

  try {
    const res = await fetchFn(FIREBASE_METADATA_URL, {
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (res.status === 404) {
      return { ok: false, status: 404, data: null, error: 'Firebase metadata (app-release.json) not found (404)' };
    }

    if (!res.ok) {
      return { ok: false, status: res.status, data: null, error: `Firebase returned HTTP status ${res.status}` };
    }

    const data = await res.json();
    return {
      ok: true,
      status: 200,
      version: data.version || null,
      versionCode: data.versionCode || null,
      sha256: data.sha256 || null,
      signatures: data.signatures || null,
      data,
    };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err.message };
  }
}
