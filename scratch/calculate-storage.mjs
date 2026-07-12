import fs from 'fs';

const tokenData = JSON.parse(fs.readFileSync('C:\\Users\\ayuda\\.config\\configstore\\firebase-tools.json', 'utf8'));
const accessToken = tokenData.tokens.access_token;

async function run() {
  const url = 'https://firebasehosting.googleapis.com/v1beta1/projects/studio-30f44/sites/studio-30f44/versions';
  const response = await fetch(url, {
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
  let totalBytes = 0;
  for (const v of data.versions) {
    const bytes = parseInt(v.versionBytes || 0, 10);
    totalBytes += bytes;
    console.log(`Version: ${v.name}, Status: ${v.status}, Files: ${v.fileCount}, Bytes: ${bytes} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
  }
  console.log(`Total footprint of retrieved versions: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
}

run().catch(console.error);
