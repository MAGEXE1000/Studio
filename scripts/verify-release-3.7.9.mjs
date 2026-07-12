import { spawnSync } from 'child_process';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function verifyAll() {
  const backoffs = [15000, 30000, 60000, 120000, 180000]; // Polling up to 7 minutes
  let attempt = 0;
  
  while (true) {
    console.log(`\n--- Verification Attempt #${attempt + 1} ---`);
    const results = await Promise.all([
      // 1. Fetch app-release.json
      fetch('https://studio-30f44.web.app/app-release.json').then(async r => {
        if (!r.ok) return { name: 'app-release.json', ok: false, error: `HTTP ${r.status}` };
        const data = await r.json();
        const valid = data.version === '3.7.9' && data.versionCode === 136 && data.signatures === '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206';
        return { name: 'app-release.json', ok: valid, data };
      }).catch(e => ({ name: 'app-release.json', ok: false, error: e.message })),
      
      // 2. Fetch version.json
      fetch('https://studio-30f44.web.app/version.json').then(async r => {
        if (!r.ok) return { name: 'version.json', ok: false, error: `HTTP ${r.status}` };
        const data = await r.json();
        // Since version.json has the web or native version, let's verify it has been updated
        const valid = data.version === '3.7.9' || data.version === '4.0.0';
        return { name: 'version.json', ok: valid, data };
      }).catch(e => ({ name: 'version.json', ok: false, error: e.message })),
      
      // 3. Check GitHub Release assets via gh CLI
      Promise.resolve().then(() => {
        const ghResult = spawnSync('gh', ['release', 'view', 'v3.7.9', '--json', 'assets'], { encoding: 'utf8' });
        if (ghResult.status !== 0) return { name: 'gh-release', ok: false, error: ghResult.stderr };
        const assets = JSON.parse(ghResult.stdout).assets;
        const hasApk = assets.some(a => a.name === 'studio-3.7.9.apk');
        const hasSha = assets.some(a => a.name === 'studio-3.7.9.sha256' || a.name === 'studio-3.7.9.apk.sha256');
        return { name: 'gh-release', ok: hasApk && hasSha, assets };
      }).catch(e => ({ name: 'gh-release', ok: false, error: e.message })),
      
      // 4. Fetch latest APK redirect
      fetch('https://studio-30f44.web.app/apk/studio-latest.apk', { method: 'HEAD', redirect: 'manual' }).then(r => {
        const loc = r.headers.get('location') || '';
        const ok = loc.includes('studio-3.7.9.apk');
        return { name: 'latest-apk-redirect', ok, location: loc };
      }).catch(e => ({ name: 'latest-apk-redirect', ok: false, error: e.message }))
    ]);

    let allPassed = true;
    for (const res of results) {
      if (res.ok) {
        console.log(`✓ ${res.name} verified successfully.`);
      } else {
        console.log(`✗ ${res.name} FAILED!`, res.error || res);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n=== ALL POST-RELEASE VERIFICATIONS PASSED ===');
      process.exit(0);
    }

    if (attempt >= backoffs.length) {
      console.log('\n=== POST-RELEASE VERIFICATION FAILED AFTER MAX RETRIES ===');
      process.exit(1);
    }

    const waitMs = backoffs[attempt];
    console.log(`Verification failed or incomplete. Retrying in ${waitMs / 1000}s while GitHub Actions builds and publishes...`);
    await delay(waitMs);
    attempt++;
  }
}

verifyAll().catch(e => {
  console.error(e);
  process.exit(1);
});
