import fs from 'fs';

const tokenData = JSON.parse(fs.readFileSync('C:\\Users\\ayuda\\.config\\configstore\\firebase-tools.json', 'utf8'));
const accessToken = tokenData.tokens.access_token;

async function run() {
  const url = 'https://firebasehosting.googleapis.com/v1beta1/projects/studio-30f44/sites/studio-30f44/channels/live/releases';
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('Failed to list releases:', response.status, await response.text());
    return;
  }

  const data = await response.json();
  console.log(`Releases Count: ${data.releases ? data.releases.length : 0}`);
  if (data.releases) {
    for (let i = 0; i < Math.min(5, data.releases.length); i++) {
      console.log(`Release ${i}: ${data.releases[i].name} - Version: ${data.releases[i].version.name} - Time: ${data.releases[i].releaseTime}`);
    }
  }
}

run().catch(console.error);
