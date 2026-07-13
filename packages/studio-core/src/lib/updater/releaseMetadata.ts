import { APP_VERSION, compareSemver, parseAndNormalizeVersion, parseSemver } from '../appVersion';
import { shouldUseAndroidApkUpdater } from '../capgoUpdater';
import { otaDebugLogs } from './diagnostics';
import { StructuredReleaseNotes, globalOtaState, activeUpdateSession } from './stateMachine';
import { logRawSource } from './versionLogger';
import { UpdaterFlightRecorder } from './flightRecorder';

export interface RemoteVersionInfo {
  version: string;
  versionCode?: number;
  changelog?: string;
  mandatory?: boolean;
  downloadUrl?: string;
  updateType?: 'ota' | 'apk' | 'both' | 'none';
  apkUrl?: string;
  apkSha256?: string;
  manualApkUrl?: string;
  fallbackApkUrl?: string;
  releaseNotes?: string[] | StructuredReleaseNotes;
  requiredApkVersion?: string;
  requiredVersionCode?: number;
  platform?: string;
  reinstallRequired?: boolean;
  signatureChanged?: boolean;
  previousSignatureSha256?: string;
  newSignatureSha256?: string;
  installMode?: 'reinstall-required';
  signatures?: string;
  apkSizeBytes?: number;
  packageName?: string;
  tag_name?: string;
  name?: string;
}

const FETCH_TIMEOUT_MS = 6000;

export function versionJsonUrls(): string[] {
  const t = Date.now();
  const override = (import.meta.env.VITE_OTA_VERSION_URL as string | undefined)?.trim();
  if (override) {
    const sep = override.includes('?') ? '&' : '?';
    return [`${override}${sep}t=${t}`];
  }

  const remoteBase = (import.meta.env.VITE_OTA_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'https://studio-30f44.web.app';
  const urls: string[] = [];

  if (shouldUseAndroidApkUpdater()) {
    urls.push(`${remoteBase}/app-release.json?t=${t}`);
  } else {
    const localBase = import.meta.env.BASE_URL || '/';
    urls.push(`${localBase}version.json?t=${t}`);
  }
  
  console.log(`[OTA DIAGNOSTICS] Generated urls to fetch:`, urls);

  return urls;
}

async function fetchOne(
  url: string,
  signal: AbortSignal,
): Promise<RemoteVersionInfo | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal,
    });
    if (!res.ok) {
      const errStr = `HTTP Error ${res.status}`;
      if (url.includes('version.json')) otaDebugLogs.fetchedVersionJson = errStr;
      if (url.includes('app-release.json')) otaDebugLogs.fetchedAppReleaseJson = errStr;
      console.warn(`[AppUpdater] Metadata fetch failed for URL: ${url}. ${errStr}`);
      return null;
    }
    const text = await res.text();
    const isAppRelease = url.includes('app-release.json');
    const isVersionJson = url.includes('version.json');
    if (isAppRelease) {
      logRawSource('app-release.json', text);
    } else if (isVersionJson) {
      logRawSource('version.json', text);
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch (e) {
      const errStr = 'Malformed JSON response';
      if (isVersionJson) otaDebugLogs.fetchedVersionJson = errStr;
      if (isAppRelease) otaDebugLogs.fetchedAppReleaseJson = errStr;
      console.warn(`[AppUpdater] Metadata integrity failed for URL: ${url}. ${errStr}`);
      return null;
    }
    if (!json || typeof json !== 'object') {
      const errStr = 'Malformed JSON response';
      if (isVersionJson) otaDebugLogs.fetchedVersionJson = errStr;
      if (isAppRelease) otaDebugLogs.fetchedAppReleaseJson = errStr;
      console.warn(`[AppUpdater] Metadata integrity failed for URL: ${url}. ${errStr}`);
      return null;
    }
    const obj = json as Record<string, unknown>;
    const normalizedVersion = parseAndNormalizeVersion(obj.version as string | null | undefined);
    if (!normalizedVersion) {
      const errStr = 'Missing or invalid version field in JSON';
      if (url.includes('version.json')) otaDebugLogs.fetchedVersionJson = errStr;
      if (url.includes('app-release.json')) otaDebugLogs.fetchedAppReleaseJson = errStr;
      console.warn(`[AppUpdater] Metadata integrity failed for URL: ${url}. ${errStr}`);
      return null;
    }
    
    if (url.includes('version.json')) {
      otaDebugLogs.fetchedVersionJson = normalizedVersion;
    } else if (url.includes('app-release.json')) {
      otaDebugLogs.fetchedAppReleaseJson = normalizedVersion;
    }

    const changelog = typeof obj.description === 'string' ? obj.description : (typeof obj.changelog === 'string' ? obj.changelog : undefined);
    const downloadUrl = typeof obj.downloadUrl === 'string' ? obj.downloadUrl : (typeof obj.ota_download_url === 'string' ? obj.ota_download_url : undefined);
    const updateType = (obj.update_type === 'ota' || obj.update_type === 'apk' || obj.update_type === 'both' || obj.update_type === 'none') 
      ? obj.update_type 
      : ((obj.updateType === 'ota' || obj.updateType === 'apk' || obj.updateType === 'both' || obj.updateType === 'none') ? obj.updateType : undefined);
    const apkUrl = typeof obj.download_url === 'string' ? obj.download_url : (typeof obj.apkUrl === 'string' ? obj.apkUrl : undefined);
    const apkSha256 = typeof obj.sha256 === 'string' ? obj.sha256 : (typeof obj.apkSha256 === 'string' ? obj.apkSha256 : undefined);
    const manualApkUrl = typeof obj.manual_download_url === 'string' ? obj.manual_download_url : (typeof obj.manualApkUrl === 'string' ? obj.manualApkUrl : undefined);
    const fallbackApkUrl = typeof obj.fallback_download_url === 'string' ? obj.fallback_download_url : (typeof obj.fallbackApkUrl === 'string' ? obj.fallbackApkUrl : undefined);
    
    const reinstallRequired = !!(obj.reinstallRequired || obj.reinstall_required);
    const signatureChanged = !!(obj.signatureChanged || obj.signature_changed);
    const previousSignatureSha256 = typeof obj.previousSignatureSha256 === 'string' ? obj.previousSignatureSha256 : (typeof obj.previous_signature_sha256 === 'string' ? obj.previous_signature_sha256 : undefined);
    const newSignatureSha256 = typeof obj.newSignatureSha256 === 'string' ? obj.newSignatureSha256 : (typeof obj.new_signature_sha256 === 'string' ? obj.new_signature_sha256 : undefined);
    const installMode = (obj.installMode === 'reinstall-required' || obj.install_mode === 'reinstall-required') ? 'reinstall-required' : undefined;
    const packageName = typeof obj.packageName === 'string' ? obj.packageName : (typeof obj.package_name === 'string' ? obj.package_name : undefined);
    const signatures = typeof obj.signatures === 'string' ? obj.signatures : (typeof obj.signature === 'string' ? obj.signature : undefined);
    
    const requiredApkVersion = typeof obj.required_apk_version === 'string'
      ? obj.required_apk_version
      : (typeof obj.requiredApkVersion === 'string' ? obj.requiredApkVersion : undefined);
    const requiredVersionCode = typeof obj.required_version_code === 'number'
      ? obj.required_version_code
      : (typeof obj.requiredVersionCode === 'number' ? obj.requiredVersionCode : (typeof obj.required_version_code === 'string' ? parseInt(obj.required_version_code, 10) : (typeof obj.requiredVersionCode === 'string' ? parseInt(obj.requiredVersionCode, 10) : undefined)));
    const versionCode = typeof obj.versionCode === 'number'
      ? obj.versionCode
      : (typeof obj.version_code === 'number' ? obj.version_code : (typeof obj.versionCode === 'string' ? parseInt(obj.versionCode, 10) : (typeof obj.version_code === 'string' ? parseInt(obj.version_code, 10) : undefined)));

    let parsedReleaseNotes: string[] | StructuredReleaseNotes | undefined = undefined;
    if (obj.releaseNotes) {
      if (Array.isArray(obj.releaseNotes)) {
        parsedReleaseNotes = obj.releaseNotes.filter((item: any) => typeof item === 'string') as string[];
      } else if (typeof obj.releaseNotes === 'object') {
        const rnObj = obj.releaseNotes as any;
        const notesObj: StructuredReleaseNotes = {};
        if (Array.isArray(rnObj.added)) {
          notesObj.added = rnObj.added.filter((item: any) => typeof item === 'string') as string[];
        }
        if (Array.isArray(rnObj.improved)) {
          notesObj.improved = rnObj.improved.filter((item: any) => typeof item === 'string') as string[];
        }
        if (Array.isArray(rnObj.fixed)) {
          notesObj.fixed = rnObj.fixed.filter((item: any) => typeof item === 'string') as string[];
        }
        if (Array.isArray(rnObj.changed)) {
          notesObj.changed = rnObj.changed.filter((item: any) => typeof item === 'string') as string[];
        }
        if (notesObj.added || notesObj.improved || notesObj.fixed || notesObj.changed) {
          parsedReleaseNotes = notesObj;
        }
      }
    }

    const resultObj: RemoteVersionInfo = {
      version: normalizedVersion,
      changelog,
      mandatory: obj.mandatory === true,
      downloadUrl,
      updateType,
      apkUrl,
      apkSha256,
      manualApkUrl,
      fallbackApkUrl,
      releaseNotes: parsedReleaseNotes,
      requiredApkVersion,
      requiredVersionCode,
      versionCode,
      platform: typeof obj.platform === 'string' ? obj.platform : undefined,
      reinstallRequired,
      signatureChanged,
      previousSignatureSha256,
      newSignatureSha256,
      installMode,
      packageName,
      signatures,
      apkSizeBytes: typeof obj.apkSizeBytes === 'number'
        ? obj.apkSizeBytes
        : (typeof obj.apkSizeBytes === 'string' ? parseInt(obj.apkSizeBytes, 10) : undefined),
    };

    if (!validateRemoteMetadata(resultObj)) {
      const errStr = `Rejected remote metadata due to validation failure. version: ${normalizedVersion}`;
      if (url.includes('version.json')) otaDebugLogs.fetchedVersionJson = errStr;
      if (url.includes('app-release.json')) otaDebugLogs.fetchedAppReleaseJson = errStr;
      return null;
    }

    return resultObj;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (url.includes('version.json')) otaDebugLogs.fetchedVersionJson = `Error: ${errMsg}`;
    if (url.includes('app-release.json')) otaDebugLogs.fetchedAppReleaseJson = `Error: ${errMsg}`;
    console.warn(`[AppUpdater] Metadata parsing exception for URL: ${url}. ${errMsg}`);
    return null;
  }
}

export function logPipelineTrace(caller: string, stage: string, input: any, output: any) {
  const timestamp = new Date().toISOString();
  const state = globalOtaState?.updateState || 'UNKNOWN';
  const sessionId = activeUpdateSession ? String(activeUpdateSession.sessionId) : (globalOtaState?.sessionId ? String(globalOtaState.sessionId) : 'N/A');
  
  const logMsg = `[PIPELINE_TRACE] [${timestamp}] [Session:${sessionId}] [State:${state}] [Caller:${caller}] [Stage:${stage}] | Input: ${typeof input === 'object' ? JSON.stringify(input) : input} | Output: ${typeof output === 'object' ? JSON.stringify(output) : output}`;
  console.log(logMsg);
  
  // Also push to the Flight Recorder so it is captured in the diagnostic copy everything report
  try {
    UpdaterFlightRecorder.record({
      thread: 'js',
      sessionId: sessionId !== 'N/A' ? sessionId : null,
      workflowId: null,
      eventType: `trace_${stage}`,
      caller: caller,
      category: 'PIPELINE',
      reason: `${stage} trace`,
      details: JSON.stringify({ input, output, timestamp, state })
    });
  } catch (e) {
    // ignore
  }
}

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  name?: string;
  body?: string;
  assets: GitHubReleaseAsset[];
}

async function fetchLatestFromGitHub(signal: AbortSignal): Promise<RemoteVersionInfo | null> {
  const caller = 'fetchLatestFromGitHub';
  const url = 'https://api.github.com/repos/MAGEXE1000/Studio/releases';
  logPipelineTrace(caller, 'HTTP_REQUEST_URL', { url }, 'N/A');
  
  try {
    const res = await fetch(url, {
      signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    logPipelineTrace(caller, 'HTTP_RESPONSE', { url }, { status: res.status, statusText: res.statusText });
    
    if (!res.ok) {
      console.warn(`[AppUpdater] GitHub releases fetch failed: HTTP ${res.status}`);
      return null;
    }
    
    const text = await res.text();
    logPipelineTrace(caller, 'RAW_JSON', { url }, { rawLength: text.length, sample: text.slice(0, 200) });
    logRawSource('github-releases', text);

    const releases = JSON.parse(text) as GitHubRelease[];
    if (!Array.isArray(releases) || releases.length === 0) {
      return null;
    }

    // Find the first/latest release that contains an APK asset
    let targetRelease: GitHubRelease | null = null;
    let apkAsset: GitHubReleaseAsset | null = null;
    let shaAsset: GitHubReleaseAsset | null = null;

    for (const r of releases) {
      if (r.assets && Array.isArray(r.assets)) {
        const foundApk = r.assets.find(a => a.name.toLowerCase().endsWith('.apk'));
        if (foundApk) {
          targetRelease = r;
          apkAsset = foundApk;
          shaAsset = r.assets.find(a => a.name.toLowerCase().endsWith('.sha256')) || null;
          break;
        }
      }
    }

    if (!targetRelease || !apkAsset) {
      return null;
    }

    const version = parseAndNormalizeVersion(targetRelease.tag_name);
    if (!version) {
      return null;
    }

    logPipelineTrace(caller, 'METADATA_PARSING', { tag_name: targetRelease.tag_name }, { version });

    // Calculate versionCode from version string (e.g. 4.0.29 -> 40029)
    const semver = parseSemver(version);
    let versionCode = 0;
    if (semver) {
      versionCode = semver.major * 10000 + semver.minor * 100 + semver.patch;
    }
    logPipelineTrace(caller, 'VERSION_CODE_ASSIGNMENT', { version }, { versionCode });

    // Attempt to fetch the SHA-256 hash from the .sha256 asset
    let apkSha256 = '';
    if (shaAsset) {
      const shaUrl = shaAsset.browser_download_url;
      logPipelineTrace(caller, 'HTTP_REQUEST_URL', { url: shaUrl }, 'N/A');
      try {
        const shaRes = await fetch(shaUrl, { signal });
        logPipelineTrace(caller, 'HTTP_RESPONSE', { url: shaUrl }, { status: shaRes.status });
        if (shaRes.ok) {
          const shaText = await shaRes.text();
          logPipelineTrace(caller, 'RAW_JSON', { url: shaUrl }, { raw: shaText.trim() });
          const match = shaText.trim().match(/^([a-fA-F0-9]{64})/);
          if (match) {
            apkSha256 = match[1].toLowerCase();
          }
        }
      } catch (shaErr) {
        console.log('[AppUpdater] Failed to fetch SHA-256 asset from GitHub. Will rely on fallback metadata if available.', shaErr);
        UpdaterFlightRecorder.record({
          thread: 'js',
          sessionId: null,
          workflowId: null,
          eventType: 'sha256AssetFetchFailure',
          caller: 'fetchVersionFromGitHub',
          reason: 'Network/Timeout/Missing asset when fetching .sha256',
          details: String(shaErr)
        });
      }
    }

    const info: RemoteVersionInfo = {
      version,
      versionCode,
      changelog: targetRelease.body || '',
      mandatory: false,
      downloadUrl: apkAsset.browser_download_url,
      apkUrl: apkAsset.browser_download_url,
      apkSha256: apkSha256 || undefined,
      manualApkUrl: apkAsset.browser_download_url,
      fallbackApkUrl: apkAsset.browser_download_url,
      platform: 'github',
      updateType: 'apk',
      tag_name: targetRelease.tag_name,
      name: targetRelease.name || `Studio v${version}`
    };

    logPipelineTrace(caller, 'RELEASE_METADATA_OBJECT', { source: 'github' }, info);
    return info;
  } catch (err) {
    console.warn('[AppUpdater] Exception in fetchLatestFromGitHub:', err);
    return null;
  }
}

export async function fetchRemoteVersion(
  signal?: AbortSignal,
): Promise<RemoteVersionInfo | null> {
  const caller = 'fetchRemoteVersion';
  const urls = versionJsonUrls();
  const ctrl = signal ? null : new AbortController();
  const sig = signal ?? ctrl!.signal;

  const firebasePromise = new Promise<RemoteVersionInfo | null>((resolve) => {
    if (urls.length === 0) return resolve(null);
    let completed = false;
    let resolved = false;
    let failedCount = 0;
    let fallbackRes: RemoteVersionInfo | null = null;
    const total = urls.length;

    urls.forEach((url) => {
      logPipelineTrace(caller, 'HTTP_REQUEST_URL', { url }, 'N/A');
      fetchOne(url, sig)
        .then((res) => {
          if (resolved || completed) return;
          if (res) {
            logPipelineTrace(caller, 'HTTP_RESPONSE', { url }, { status: 200 });
            logPipelineTrace(caller, 'RELEASE_METADATA_OBJECT', { source: 'firebase', url }, res);
            resolved = true;
            completed = true;
            resolve(res);
          } else {
            logPipelineTrace(caller, 'HTTP_RESPONSE', { url }, { status: 'failed/null' });
            failedCount++;
            if (failedCount === total) {
              completed = true;
              resolve(fallbackRes);
            }
          }
        })
        .catch((err) => {
          logPipelineTrace(caller, 'HTTP_RESPONSE', { url }, { error: err?.message || String(err) });
          if (resolved || completed) return;
          failedCount++;
          if (failedCount === total) {
            completed = true;
            resolve(fallbackRes);
          }
        });
    });
  });

  const githubPromise = fetchLatestFromGitHub(sig);

  let timerId: any = null;
  const timerPromise = new Promise<null>((resolve) => {
    timerId = setTimeout(() => {
      console.warn('[AppUpdater] Concurrent version check timed out (6s).');
      resolve(null);
    }, FETCH_TIMEOUT_MS);
  });

  try {
    const [firebaseRes, githubRes] = await Promise.race([
      Promise.all([firebasePromise, githubPromise]),
      timerPromise.then(() => [null, null])
    ]) as [RemoteVersionInfo | null, RemoteVersionInfo | null];

    if (timerId) {
      clearTimeout(timerId);
    }

    if (!firebaseRes && !githubRes) {
      logPipelineTrace(caller, 'remoteVersion updates', 'N/A', { error: 'Both Firebase and GitHub checks failed.' });
      return null;
    }

    let finalRemote: RemoteVersionInfo | null = null;

    if (firebaseRes && githubRes) {
      const cmp = compareSemver(firebaseRes.version, githubRes.version);
      if (cmp > 0) {
        console.log(`[AppUpdater] Firebase metadata (${firebaseRes.version}) is newer than GitHub release (${githubRes.version}). Using Firebase.`);
        finalRemote = firebaseRes;
      } else if (cmp < 0) {
        console.log(`[AppUpdater] GitHub release (${githubRes.version}) is newer than Firebase metadata (${firebaseRes.version}). Using GitHub.`);
        finalRemote = githubRes;
      } else {
        const codeF = firebaseRes.versionCode || 0;
        const codeG = githubRes.versionCode || 0;
        if (codeF >= codeG) {
          finalRemote = firebaseRes;
        } else {
          finalRemote = githubRes;
        }
      }
    } else {
      finalRemote = firebaseRes || githubRes;
    }

    logPipelineTrace(caller, 'remoteVersion updates', { firebaseRes, githubRes }, { selected: finalRemote });
    return finalRemote;
  } catch (err) {
    console.warn('[AppUpdater] Error in fetchRemoteVersion:', err);
    return null;
  }
}

export function validateRemoteMetadata(remote: RemoteVersionInfo | null): boolean {
  if (!remote) return false;
  
  const versionName = remote.version;
  const rawVersionCode = remote.versionCode;
  const versionCode = typeof rawVersionCode === 'number' ? rawVersionCode : (typeof rawVersionCode === 'string' ? parseInt(rawVersionCode, 10) : undefined);
  
  const tag = remote.platform === 'github' ? (remote as any).tag_name : (remote.version ? `v${remote.version}` : undefined);
  const releaseName = remote.platform === 'github' ? (remote as any).name : (remote.version ? `Studio v${remote.version}` : undefined);

  const isNativeCheck = shouldUseAndroidApkUpdater();
  
  let isVerNameValid = false;
  let isVerCodeValid = false;
  let isTagValid = false;
  let isReleaseNameValid = false;

  if (versionName && typeof versionName === 'string') {
    const parsed = parseSemver(versionName);
    if (parsed && versionName !== 'V' && versionName !== 'v') {
      isVerNameValid = true;
    }
  }

  // tag validation: must parse as valid semver
  if (tag && typeof tag === 'string') {
    const parsed = parseSemver(tag);
    if (parsed && tag !== 'V' && tag !== 'v') {
      isTagValid = true;
    }
  }

  if (releaseName && typeof releaseName === 'string' && releaseName.trim().length > 0) {
    isReleaseNameValid = true;
  }

  if (isNativeCheck) {
    if (versionCode !== undefined && typeof versionCode === 'number' && !isNaN(versionCode) && versionCode > 0) {
      isVerCodeValid = true;
    }
  } else {
    isVerCodeValid = true; // Not required on web
  }

  if (!isVerNameValid || !isVerCodeValid || !isTagValid || !isReleaseNameValid) {
    console.error(`[AppUpdater] [METADATA REJECTED] Validation failure: ` +
      `versionName: "${versionName}" (${isVerNameValid ? 'VALID' : 'INVALID'}), ` +
      `versionCode: ${versionCode} (${isVerCodeValid ? 'VALID' : 'INVALID'}), ` +
      `tag: "${tag}" (${isTagValid ? 'VALID' : 'INVALID'}), ` +
      `releaseName: "${releaseName}" (${isReleaseNameValid ? 'VALID' : 'INVALID'})`);
    return false;
  }
  
  return true;
}
