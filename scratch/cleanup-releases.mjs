import fs from 'fs';

const tokenData = JSON.parse(fs.readFileSync('C:\\Users\\ayuda\\.config\\configstore\\firebase-tools.json', 'utf8'));
const accessToken = tokenData.tokens.access_token;

async function apiCall(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API Call failed (${url}): ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function run() {
  console.log('Fetching active channel releases...');
  const releasesData = await apiCall('https://firebasehosting.googleapis.com/v1beta1/projects/studio-30f44/sites/studio-30f44/channels/live/releases');
  
  // Sort releases by releaseTime descending (newest first)
  const releases = releasesData.releases.sort((a, b) => new Date(b.releaseTime) - new Date(a.releaseTime));
  console.log(`Found ${releases.length} releases in live channel history.`);

  // Keep the 3 newest releases, delete the rest
  const keepCount = 3;
  const toDelete = releases.slice(keepCount);
  console.log(`Keeping the ${keepCount} newest releases. Deleting ${toDelete.length} old releases from history...`);

  for (const rel of toDelete) {
    console.log(`Deleting release: ${rel.name} (Time: ${rel.releaseTime}, Version: ${rel.version.name})`);
    try {
      const deleteUrl = `https://firebasehosting.googleapis.com/v1beta1/${rel.name}`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (res.ok) {
        console.log(`✓ Deleted release successfully.`);
      } else {
        console.error(`✗ Failed to delete release: ${res.status} ${await res.text()}`);
      }
    } catch (e) {
      console.error(`✗ Error deleting release:`, e.message);
    }
  }

  // Now query versions again and delete any version that is no longer active
  console.log('Re-fetching active releases...');
  const activeReleases = await apiCall('https://firebasehosting.googleapis.com/v1beta1/projects/studio-30f44/sites/studio-30f44/channels/live/releases');
  const activeVersionNames = new Set(activeReleases.releases.map(r => r.version.name));
  
  console.log('Fetching all versions...');
  const versionsData = await apiCall('https://firebasehosting.googleapis.com/v1beta1/projects/studio-30f44/sites/studio-30f44/versions');
  
  let deletedCount = 0;
  for (const version of versionsData.versions) {
    if (activeVersionNames.has(version.name)) {
      continue;
    }
    console.log(`Deleting newly inactive version: ${version.name}`);
    try {
      const deleteUrl = `https://firebasehosting.googleapis.com/v1beta1/${version.name}`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (res.ok) {
        console.log(`✓ Deleted version successfully.`);
        deletedCount++;
      } else {
        console.error(`✗ Failed to delete version: ${res.status} ${await res.text()}`);
      }
    } catch (e) {
      console.error(`✗ Error deleting version:`, e.message);
    }
  }
  console.log(`Cleanup complete. Deleted ${deletedCount} versions.`);
}

run().catch(console.error);
