import fs from 'fs';

const tokenData = JSON.parse(fs.readFileSync('C:\\Users\\ayuda\\.config\\configstore\\firebase-tools.json', 'utf8'));
const accessToken = tokenData.tokens.access_token;

async function run() {
  const url = 'https://firebasehosting.googleapis.com/v1beta1/projects/studio-30f44/sites/studio-30f44/channels/live?updateMask=retainedReleaseCount';
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      retainedReleaseCount: 5
    })
  });

  if (!response.ok) {
    console.error('Failed to update channel retention:', response.status, await response.text());
    return;
  }

  const data = await response.json();
  console.log('Successfully updated channel retention config:', JSON.stringify(data, null, 2));
}

run().catch(console.error);
