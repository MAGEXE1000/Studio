import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/lib/apkDownloader.ts', 'utf8');
const lines = src.split('\n');

let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('verifyApkSha256') && (lines[i].includes('async') || lines[i].includes('function') || lines[i].includes('const'))) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  console.log(`Found verifyApkSha256 at line ${startIdx + 1}`);
  console.log(lines.slice(Math.max(0, startIdx - 5), startIdx + 40).join('\n'));
} else {
  console.log('verifyApkSha256 not found.');
}
