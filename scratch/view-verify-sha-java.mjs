import fs from 'fs';

const src = fs.readFileSync('apps/studio-android/android/app/src/main/java/com/chordex/app/AppInstallerPlugin.java', 'utf8');
const lines = src.split('\n');

console.log(lines.slice(242, 302).join('\n'));
