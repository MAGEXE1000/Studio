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
  console.log('Fetching active releases...');
  const releasesData = await apiCall('https://firebasehosting.googleapis.com/v1beta1/projects/studio-30f44/sites/studio-30f44/releases');
  const activeVersionNames = new Set(releasesData.releases.map(r => r.version.name));
  console.log('Active Versions:', activeVersionNames);

  console.log('Fetching all versions...');
  const versionsData = await apiCall('https://firebasehosting.googleapis.com/v1beta1/projects/studio-30f44/sites/studio-30f44/versions');
  
  let deletedCount = 0;
  for (const version of versionsData.versions) {
    if (activeVersionNames.has(version.name)) {
      console.log(`Keeping active version: ${version.name}`);
      continue;
    }
    
    console.log(`Deleting inactive version: ${version.name} (${version.fileCount} files, ${version.versionBytes} bytes)`);
    try {
      // DELETE URL: https://firebasehosting.googleapis.com/v1beta1/{versionName}
      const deleteUrl = `https://firebasehosting.googleapis.com/v1beta1/${version.name}`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (res.ok) {
        console.log(`✓ Deleted successfully.`);
        deletedCount++;
      } else {
        console.error(`✗ Failed to delete: ${res.status} ${await res.text()}`);
      }
    } catch (e) {
      console.error(`✗ Error deleting version:`, e.message);
    }
  }
  console.log(`Cleanup complete. Deleted ${deletedCount} inactive versions.`);
}

run().catch(console.error);
