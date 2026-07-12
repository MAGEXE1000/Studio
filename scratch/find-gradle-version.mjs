import fs from 'fs';

const path = 'apps/studio-android/android/app/build.gradle';
if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('versionCode') || line.includes('versionName')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('build.gradle not found.');
}
