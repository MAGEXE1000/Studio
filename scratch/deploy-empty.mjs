import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const publicPath = 'firebase-public';
const backupPath = 'firebase-public-full';

async function run() {
  if (fs.existsSync(backupPath)) {
    console.error('Backup path already exists. Please resolve manually.');
    return;
  }

  console.log('Renaming firebase-public to firebase-public-full...');
  fs.renameSync(publicPath, backupPath);

  try {
    console.log('Creating minimal firebase-public...');
    fs.mkdirSync(publicPath);
    
    // Write minimal index.html
    fs.writeFileSync(path.join(publicPath, 'index.html'), '<!DOCTYPE html><html><body><h1>Studio Temp</h1></body></html>');
    
    // Copy app-release.json and version.json from backup to keep them valid
    fs.copyFileSync(path.join(backupPath, 'app-release.json'), path.join(publicPath, 'app-release.json'));
    fs.copyFileSync(path.join(backupPath, 'version.json'), path.join(publicPath, 'version.json'));

    console.log('Running local firebase deploy...');
    execSync('npx firebase-tools deploy --only hosting --project studio-30f44', { stdio: 'inherit' });
    console.log('Deployment successful!');

  } catch (err) {
    console.error('Deployment failed:', err);
  } finally {
    console.log('Restoring firebase-public from backup...');
    if (fs.existsSync(publicPath)) {
      fs.rmSync(publicPath, { recursive: true, force: true });
    }
    fs.renameSync(backupPath, publicPath);
    console.log('Restored successfully.');
  }
}

run().catch(console.error);
