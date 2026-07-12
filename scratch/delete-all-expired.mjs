import fs from 'fs';

const tokenData = JSON.parse(fs.readFileSync('C:\\Users\\ayuda\\.config\\configstore\\firebase-tools.json', 'utf8'));
const accessToken = tokenData.tokens.access_token;

async function run() {
  const listUrl = 'https://firebasehosting.googleapis.com/v1beta1/projects/studio-30f44/sites/studio-30f44/versions';
  const response = await fetch(listUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('Failed to list versions:', response.status, await response.text());
    return;
  }

  const data = await response.json();
  const expiredVersions = data.versions.filter(v => v.status === 'EXPIRED');
  console.log(`Found ${expiredVersions.length} expired versions to delete.`);

  let successCount = 0;
  for (const v of expiredVersions) {
    console.log(`Deleting: ${v.name}...`);
    const deleteUrl = `https://firebasehosting.googleapis.com/v1beta1/${v.name}`;
    const delRes = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (delRes.ok) {
      console.log('✓ Success');
      successCount++;
    } else {
      console.error(`✗ Failed: ${delRes.status} ${await delRes.text()}`);
    }
  }

  console.log(`Successfully cleaned up ${successCount} expired versions.`);
}

run().catch(console.error);
