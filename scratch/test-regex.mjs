import fs from 'node:fs';
import path from 'node:path';

const changelogPath = 'apps/studio-android/CHANGELOG.md';
const changelogText = fs.readFileSync(changelogPath, 'utf8');
const version = '3.7.65';
const esc = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = new RegExp(
  `^##\\s+${esc}\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`,
  'm'
);
const match = changelogText.match(re);
console.log('Match found:', !!match);
if (match) {
  console.log('Match content:');
  console.log(match[0]);
  console.log('Group content:');
  console.log(match[1]);
}
