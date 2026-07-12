import fs from 'fs';

const tokenData = JSON.parse(fs.readFileSync('C:\\Users\\ayuda\\.config\\configstore\\firebase-tools.json', 'utf8'));
const accessToken = tokenData.tokens.access_token;

async function run() {
  // Let's try to delete an EXPIRED version: e0f629cbe8474086
  const versionName = 'projects/studio-30f44/sites/studio-30f44/versions/e0f629cbe8474086';
  const url = `https://firebasehosting.googleapis.com/v1beta1/${versionName}`;
  
  console.log(`Attempting to delete expired version: ${versionName}...`);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (response.ok) {
    console.log('✓ Successfully deleted version!');
  } else {
    console.error('✗ Failed to delete version:', response.status, await response.text());
  }
}

run().catch(console.error);
